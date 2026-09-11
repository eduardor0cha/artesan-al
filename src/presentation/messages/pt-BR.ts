/**
 * Every user-facing string in one place. Code is written in English; what the artisan and the
 * visitor read is pt-BR, in plain words — short sentences, no jargon, no English terms.
 *
 * Centralising them also makes the vocabulary reviewable as a whole, which matters when the
 * audience includes people with little digital literacy.
 */
export const messages = {
  app: {
    name: 'ArtesanAL',
    tagline: 'Encontre artesãos e artesanato perto de você',
    description:
      'Plataforma que mostra no mapa onde encontrar artesãos e produtos artesanais de Alagoas.',
  },
  search: {
    useMyLocation: 'Usar minha localização',
    radius: 'Distância',
    empty: 'Nenhum ponto de venda encontrado por perto.',
    locationDenied: 'Não conseguimos acessar sua localização. Você pode procurar pelo mapa.',
  },
  salesPoint: {
    types: {
      fair: 'Feira',
      workshop: 'Ateliê',
      store: 'Loja',
      cooperative: 'Cooperativa',
    },
    distanceAway: (km: string) => `a ${km} km de você`,
  },
  auth: {
    cpf: 'CPF',
    password: 'Senha',
    phone: 'Celular',
    signIn: 'Entrar',
    signUp: 'Criar minha conta',
    forgotPassword: 'Esqueci minha senha',
    otpSent: 'Enviamos um código para o seu celular.',
  },
  errors: {
    unexpected: 'Algo deu errado. Tente de novo.',
  },
} as const
