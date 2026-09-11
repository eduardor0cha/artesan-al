import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import type { ImageStorage, StoredImage } from '@/application/ports/image-storage'

import { serverEnv } from '../config/env'

/**
 * Talks to MinIO locally and to any S3-compatible service (R2, S3, Supabase Storage) in
 * production — the difference is the value of S3_ENDPOINT, not this code.
 */
export class S3ImageStorage implements ImageStorage {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly publicBaseUrl: string

  constructor() {
    const env = serverEnv()

    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      // MinIO serves buckets as a path segment rather than a subdomain.
      forcePathStyle: true,
    })

    this.bucket = env.S3_BUCKET
    this.publicBaseUrl = env.S3_PUBLIC_URL.replace(/\/$/, '')
  }

  async upload({
    key,
    body,
    contentType,
  }: {
    key: string
    body: Uint8Array | Buffer
    contentType: string
  }): Promise<StoredImage> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )

    return { key }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`
  }
}
