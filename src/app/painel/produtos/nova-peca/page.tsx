import Link from 'next/link'

import { ProductForm } from '@/presentation/components/product/product-form'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { requireArtisan } from '../../../current-artisan'
import { publish } from '../actions'

export default async function NewProductPage() {
  await requireArtisan()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <nav aria-label={messages.panel.myProducts.title}>
        <Link href={routes.myProducts} className="text-emerald-800 underline underline-offset-4">
          {messages.panel.myProducts.title}
        </Link>
      </nav>

      <h1 className="text-3xl font-semibold text-stone-900">
        {messages.panel.productForm.newTitle}
      </h1>

      <ProductForm action={publish} />
    </main>
  )
}
