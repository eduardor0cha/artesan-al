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
  units: {
    meters: 'm',
    kilometers: 'km',
  },
  search: {
    heading: 'Pontos de venda perto de você',
    controls: 'Onde procurar',
    useMyLocation: 'Usar minha localização',
    locating: 'Procurando você...',
    radius: 'Distância',
    radiusOption: (kilometers: string) => `Até ${kilometers} km`,
    submit: 'Buscar',
    searchThisArea: 'Buscar nesta área',
    resultCount: (count: number) =>
      count === 1 ? '1 ponto de venda encontrado' : `${count} pontos de venda encontrados`,
    empty: 'Nenhum ponto de venda encontrado por perto. Tente aumentar a distância.',
    locationDenied: 'Não conseguimos acessar sua localização. Você pode procurar pelo mapa.',
    locationUnsupported: 'Este aparelho não informa a localização. Você pode procurar pelo mapa.',
    map: {
      label: 'Mapa dos pontos de venda encontrados',
      loading: 'Carregando o mapa...',
      listIsEquivalent: 'O mapa mostra os mesmos pontos de venda da lista.',
      zoomIn: 'Aproximar',
      zoomOut: 'Afastar',
      radiusArea: 'Área da busca',
      attribution:
        '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  salesPoint: {
    types: {
      fair: 'Feira',
      workshop: 'Ateliê',
      store: 'Loja',
      cooperative: 'Cooperativa',
    },
    distanceAway: (distance: string) => `a ${distance} de você`,
    soldBy: 'Vende aqui',
    andMoreArtisans: (count: number) =>
      count === 1 ? 'e mais 1 artesão' : `e mais ${count} artesãos`,
    noArtisans: 'Ninguém vendendo aqui no momento.',
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
