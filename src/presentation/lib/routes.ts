/**
 * Every public URL in one place. They are written in pt-BR because a visitor reads and shares
 * them — the URL is content, not code (ADR 0010).
 */
export const routes = {
  search: '/',
  salesPoint: (id: string) => `/pontos-de-venda/${id}`,
  artisan: (slug: string) => `/artesaos/${slug}`,
  product: (id: string) => `/produtos/${id}`,
} as const
