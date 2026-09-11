import { messages } from '@/presentation/messages/pt-BR'

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold text-stone-900">{messages.app.name}</h1>
      <p className="text-lg text-stone-700">{messages.app.tagline}</p>
      <p className="text-stone-600">
        Andaime do projeto. As telas públicas, o painel do artesão e a busca por proximidade ainda
        serão construídos — veja <code className="rounded bg-stone-100 px-1">docs/adr/</code> para
        as decisões já tomadas.
      </p>
    </main>
  )
}
