'use client'

import { useEffect, useRef, useState } from 'react'

import { TextField } from '@/presentation/components/ui/text-field'
import { messages } from '@/presentation/messages/pt-BR'

/** Long edge after the reduction. Enough for the square card and the page of the piece. */
const MAX_EDGE = 1200

/** Visibly lossy only on flat colour, and about a tenth of the bytes a phone photo costs. */
const JPEG_QUALITY = 0.8

const REDUCED_TYPE = 'image/jpeg'

type PhotoInputProps = {
  /** The photo already published, shown until the artisan picks another one. */
  currentPhoto?: { url: string; alt: string } | null
}

type Status = 'idle' | 'working' | 'ready' | 'failed'

/**
 * The photo of a piece and the words that describe it, as one field: the alternative text is
 * required the moment there is an image, because the schema demands it and the axe run asserts it.
 *
 * The picture is shrunk in the browser before it is ever sent. A phone here takes 4000px pictures
 * over a connection that drops, and the screens show the piece at 600px at most: uploading the
 * original would be minutes of waiting for bytes nothing displays. The reduced file replaces what
 * the field holds, so the form still posts a plain `<input type="file">` and the Server Action
 * receives it with no client-side plumbing of its own.
 */
export function PhotoInput({ currentPhoto = null }: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  /** The file this component produced, to tell it apart from one the person just chose. */
  const reducedRef = useRef<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function onChange() {
    const input = inputRef.current
    const chosen = input?.files?.[0]

    if (!input || !chosen || chosen === reducedRef.current) return

    setStatus('working')

    try {
      const reduced = await reduce(chosen)
      const transfer = new DataTransfer()

      transfer.items.add(reduced)
      reducedRef.current = reduced
      // Assigning `files` fires no change event, so this does not loop back into here.
      input.files = transfer.files

      setPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return URL.createObjectURL(reduced)
      })
      setStatus('ready')
    } catch {
      // A file the browser cannot decode: a HEIC from an older iPhone, or a corrupted download.
      input.value = ''
      reducedRef.current = null
      setStatus('failed')
    }
  }

  const shown = preview ?? currentPhoto?.url ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="product-photo" className="font-medium text-stone-900">
          {currentPhoto && !preview
            ? messages.panel.productForm.replacePhoto
            : messages.panel.productForm.photo}
        </label>

        <p id="product-photo-hint" className="text-sm text-stone-600">
          {messages.panel.productForm.photoHint}
        </p>

        {shown && (
          // The preview is an object URL made in this browser, and next/image only knows how to
          // fetch and optimise a real one.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            // Decorative here: the field below is where this photo gets described, and announcing
            // a half-typed draft of it would only get in the way.
            alt=""
            className="h-40 w-40 rounded-lg border border-stone-300 object-cover"
          />
        )}

        <input
          ref={inputRef}
          id="product-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          // Offers the camera straight away on a phone, which is where these photos are taken.
          capture="environment"
          aria-describedby="product-photo-hint"
          onChange={onChange}
          className="min-h-11 rounded-lg border border-stone-400 bg-white p-2 text-base text-stone-900 file:mr-3 file:min-h-9 file:rounded-md file:border-0 file:bg-stone-200 file:px-3 file:text-base file:text-stone-900"
        />

        {/* Announced when it changes: the reduction takes a moment on a slow phone. */}
        <p role="status" className="text-sm text-stone-700">
          {status === 'working' && messages.panel.productForm.photoPreparing}
          {status === 'ready' && messages.panel.productForm.photoReady}
          {status === 'failed' && messages.panel.productForm.photoFailed}
        </p>
      </div>

      <TextField
        id="product-alt"
        name="alt"
        label={messages.panel.productForm.alt}
        hint={messages.panel.productForm.altHint}
        defaultValue={currentPhoto?.alt}
        required={Boolean(shown)}
      />
    </div>
  )
}

/**
 * Draws the picture into a canvas no larger than `MAX_EDGE` and reads it back as JPEG. Canvas is
 * used rather than a library because it is already in every browser this audience runs, and an
 * image codec is a megabyte of JavaScript to download over the connection being spared.
 */
async function reduce(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')

    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas 2d indisponível')

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, REDUCED_TYPE, JPEG_QUALITY),
    )
    if (!blob) throw new Error('canvas não produziu a imagem')

    return new File([blob], 'foto.jpg', { type: REDUCED_TYPE })
  } finally {
    bitmap.close()
  }
}
