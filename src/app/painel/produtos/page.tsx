import Image from 'next/image'
import Link from 'next/link'

import { Alert } from '@/presentation/components/ui/alert'
import { buttonVariants } from '@/presentation/components/ui/button'
import { PANEL_PARAM, PRODUCT_GONE } from '@/presentation/lib/panel-url'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { findProductsOfArtisan } from '../../composition'
import { requireArtisan } from '../../current-artisan'

export default async function MyProductsPage(props: PageProps<'/painel/produtos'>) {
  const artisan = await requireArtisan()
  const catalogue = await findProductsOfArtisan(artisan.id)

  const params = await props.searchParams
  const added = catalogue.find((item) => item.product.id === first(params[PANEL_PARAM.added]))
  const saved = catalogue.find((item) => item.product.id === first(params[PANEL_PARAM.saved]))
  const removed = first(params[PANEL_PARAM.removed]) === '1'
  const gone = first(params[PANEL_PARAM.error]) === PRODUCT_GONE

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.panel.myProducts.title}</h1>
        <p className="text-stone-700">{messages.panel.myProducts.lead}</p>
      </header>

      {added && (
        <Alert variant="success">{messages.panel.myProducts.published(added.product.name)}</Alert>
      )}
      {saved && (
        <Alert variant="success">{messages.panel.myProducts.saved(saved.product.name)}</Alert>
      )}
      {removed && <Alert variant="success">{messages.panel.myProducts.removed}</Alert>}
      {gone && <Alert variant="error">{messages.panel.myProducts.gone}</Alert>}

      {catalogue.length === 0 ? (
        <p className="rounded-lg border border-stone-300 bg-stone-100 p-4 text-stone-700">
          {messages.panel.myProducts.empty}
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-3 p-0">
          {catalogue.map(({ product, photo }) => (
            <li key={product.id}>
              <article className="flex flex-wrap items-center gap-4 rounded-lg border border-stone-300 bg-white p-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  {photo ? (
                    <Image src={photo.url} alt="" fill sizes="5rem" className="object-cover" />
                  ) : (
                    <p className="flex h-full items-center justify-center p-1 text-center text-xs text-stone-600">
                      {messages.panel.myProducts.noPhoto}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-stone-900">{product.name}</h2>
                  <p className="text-stone-700">
                    {product.price
                      ? product.price.format()
                      : messages.panel.myProducts.priceOnRequest}
                  </p>
                </div>

                {/* The visible word is the same on every row, so the accessible name carries the
                    piece it belongs to — and contains it, as WCAG 2.5.3 requires. */}
                <Link
                  href={routes.editProduct(product.id)}
                  aria-label={messages.panel.myProducts.editLabel(product.name)}
                  className={buttonVariants({ variant: 'secondary' })}
                >
                  {messages.panel.myProducts.edit}
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={routes.newProduct}
        className={buttonVariants({ size: 'large', className: 'self-start' })}
      >
        {catalogue.length === 0
          ? messages.panel.myProducts.add
          : messages.panel.myProducts.addAnother}
      </Link>
    </main>
  )
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
