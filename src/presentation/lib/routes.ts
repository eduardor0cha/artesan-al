/**
 * Every public URL in one place. They are written in pt-BR because a visitor reads and shares
 * them — the URL is content, not code (ADR 0010).
 */
export const routes = {
  search: '/',
  salesPoint: (id: string) => `/pontos-de-venda/${id}`,
  artisan: (slug: string) => `/artesaos/${slug}`,
  product: (id: string) => `/produtos/${id}`,

  signIn: '/entrar',
  signUp: '/criar-conta',
  forgotPassword: '/esqueci-minha-senha',

  /** The artisan's own area. Everything under it requires a session. */
  panel: '/painel',
  profile: '/painel/perfil',
  whereISell: '/painel/onde-vendo',
  newSalesPoint: '/painel/onde-vendo/novo',
  myProducts: '/painel/produtos',
  newProduct: '/painel/produtos/nova-peca',
  editProduct: (id: string) => `/painel/produtos/${id}`,
} as const
