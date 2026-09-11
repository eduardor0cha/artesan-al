export type StoredImage = {
  /** Key inside the bucket. Persisted with the product; never a full URL. */
  key: string
}

export interface ImageStorage {
  upload(input: {
    key: string
    body: Uint8Array | Buffer
    contentType: string
  }): Promise<StoredImage>

  delete(key: string): Promise<void>

  /** Absolute URL for a stored key, derived from the storage configuration. */
  publicUrl(key: string): string
}
