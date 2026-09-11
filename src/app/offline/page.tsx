import { messages } from '@/presentation/messages/pt-BR'

export const metadata = {
  title: 'Sem conexão',
}

/**
 * Shown by the service worker when a navigation happens with no connection. Kept deliberately
 * plain: it has to render from cache, with no data and no images.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold text-stone-900">Você está sem internet</h1>
      <p className="text-lg text-stone-700">
        Não foi possível carregar esta página agora. Quando a conexão voltar, tente de novo.
      </p>
      <p className="text-stone-600">{messages.app.name}</p>
    </main>
  )
}
