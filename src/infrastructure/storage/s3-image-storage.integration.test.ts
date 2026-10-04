import {
  CreateBucketCommand,
  GetObjectCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { S3ImageStorage, type S3ImageStorageConfig } from './s3-image-storage'

/**
 * The photo of a piece, against a real MinIO. What needs a server rather than a stub: that the
 * upload signs correctly against an S3-compatible endpoint served path-style, and that the URL
 * this class builds is the one a browser can actually fetch without credentials — a product photo
 * is read by visitors who never sign in.
 */
// minio/minio is gone from Docker Hub; Chainguard's build has the same entrypoint and health route.
const MINIO_IMAGE = process.env.MINIO_IMAGE ?? 'cgr.dev/chainguard/minio:latest'
const BUCKET = 'artesanal'
const ACCESS_KEY = 'artesanal'
const SECRET_KEY = 'artesanal123'

const aJpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])

describe('S3ImageStorage', () => {
  let container: StartedTestContainer
  let storage: S3ImageStorage
  let config: S3ImageStorageConfig

  beforeAll(async () => {
    container = await new GenericContainer(MINIO_IMAGE)
      .withEnvironment({ MINIO_ROOT_USER: ACCESS_KEY, MINIO_ROOT_PASSWORD: SECRET_KEY })
      .withCommand(['server', '/data'])
      .withExposedPorts(9000)
      .withWaitStrategy(Wait.forHttp('/minio/health/live', 9000))
      .start()

    const endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`

    config = {
      endpoint,
      region: 'us-east-1',
      bucket: BUCKET,
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
      // Same origin here; in production the bucket is usually served from a separate domain.
      publicUrl: `${endpoint}/${BUCKET}`,
    }

    await bootstrapBucket(config)

    storage = new S3ImageStorage(config)
  })

  afterAll(async () => {
    await container?.stop()
  })

  it('uploads a photo and serves it at the URL it reports', async () => {
    const stored = await storage.upload({
      key: 'produtos/moringa.jpg',
      body: aJpeg(),
      contentType: 'image/jpeg',
    })

    expect(stored.key).toBe('produtos/moringa.jpg')

    // Fetched with no credentials, exactly as the visitor's browser does it.
    const response = await fetch(storage.publicUrl(stored.key))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(aJpeg())
  })

  it('keeps the key as the only address of the object, with no bucket name in it', async () => {
    await storage.upload({ key: 'produtos/cesto.webp', body: aJpeg(), contentType: 'image/webp' })

    expect(storage.publicUrl('produtos/cesto.webp')).toBe(`${config.publicUrl}/produtos/cesto.webp`)
  })

  /** A piece taken off the catalogue must take its photo with it: nothing else points at the key. */
  it('deletes a photo that no product points at any more', async () => {
    await storage.upload({ key: 'produtos/velha.jpg', body: aJpeg(), contentType: 'image/jpeg' })
    await storage.delete('produtos/velha.jpg')

    const response = await fetch(storage.publicUrl('produtos/velha.jpg'))

    expect(response.status).toBe(404)
  })

  it('overwrites the object when the same key is written twice', async () => {
    const second = new Uint8Array([1, 2, 3])

    await storage.upload({ key: 'produtos/mesma.jpg', body: aJpeg(), contentType: 'image/jpeg' })
    await storage.upload({ key: 'produtos/mesma.jpg', body: second, contentType: 'image/jpeg' })

    const response = await fetch(storage.publicUrl('produtos/mesma.jpg'))

    expect(new Uint8Array(await response.arrayBuffer())).toEqual(second)
  })
})

/**
 * What the `storage-init` container does in docker compose: create the bucket and let anyone read
 * from it. Writing stays signed — only the application uploads.
 */
async function bootstrapBucket(config: S3ImageStorageConfig): Promise<void> {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: true,
  })

  await client.send(new CreateBucketCommand({ Bucket: config.bucket }))
  await client.send(
    new PutBucketPolicyCommand({
      Bucket: config.bucket,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${config.bucket}/*`],
          },
        ],
      }),
    }),
  )

  // Proves the bootstrap took before any assertion depends on it.
  await expect(
    client.send(new GetObjectCommand({ Bucket: config.bucket, Key: 'nao-existe' })),
  ).rejects.toThrow()
}
