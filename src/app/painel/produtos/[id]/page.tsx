import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProductForm } from '@/presentation/components/product/product-form'
import { Button } from '@/presentation/components/ui/button'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { findOwnProductOfArtisan } from '../../../composition'
import { requireArtisan } from '../../../current-artisan'
import { remove, update } from '../actions'

export default async function EditProductPage(props: PageProps<'/painel/produtos/[id]'>) {
  const artisan = await requireArtisan()
  const { id } = await props.params
  const item = await findOwnProductOfArtisan(artisan.id, id)

  // Someone else's piece is not "forbidden" here, it is simply not in this artisan's catalogue.
  if (!item) notFound()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <nav aria-label={messages.panel.myProducts.title}>
        <Link href={routes.myProducts} className="text-emerald-800 underline underline-offset-4">
          {messages.panel.myProducts.title}
        </Link>
      </nav>

      <h1 className="text-3xl font-semibold text-stone-900">
        {messages.panel.productForm.editTitle}
      </h1>

      {/* Only plain data crosses into the form: `Price` is a class, and a class does not. */}
      <ProductForm
        action={update}
        product={{
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          priceCents: item.product.price?.cents ?? null,
        }}
        photo={item.photo}
      />

      {/*
       * Removal is asked for twice, and the second time in its own words: it cannot be undone, and
       * a disclosure keeps it out of reach of a mistaken tap without needing JavaScript to open.
       */}
      <details className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <summary className="min-h-11 content-center text-stone-900">
          {messages.panel.productForm.remove}
        </summary>

        <div className="flex flex-col gap-3 pt-3">
          <h2 className="text-lg font-semibold text-stone-900">
            {messages.panel.productForm.removeTitle}
          </h2>
          <p className="text-stone-700">{messages.panel.productForm.removeLead}</p>

          <form action={remove} className="flex flex-wrap gap-3">
            <input type="hidden" name="productId" value={item.product.id} />
            <Button type="submit" variant="secondary">
              {messages.panel.productForm.removeConfirm}
            </Button>
            <Link
              href={routes.myProducts}
              className="min-h-11 content-center text-emerald-800 underline underline-offset-4"
            >
              {messages.panel.productForm.keep}
            </Link>
          </form>
        </div>
      </details>
    </main>
  )
}
