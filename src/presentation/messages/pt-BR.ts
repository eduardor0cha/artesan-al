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
    address: 'Endereço',
    openingHours: 'Quando abre',
    whoSellsHere: 'Quem vende aqui',
    mapLabel: 'Mapa do ponto de venda',
    seeArtisan: (name: string) => `Ver a página de ${name}`,
    metaDescription: (name: string, type: string) =>
      `${type} em Alagoas: ${name}. Veja quem vende ali e como falar com cada artesão.`,
  },
  artisan: {
    craft: 'Ofício',
    city: 'Cidade',
    story: 'História',
    sicab: 'Registro de artesão (SICAB)',
    catalogue: 'Peças',
    emptyCatalogue: 'Este artesão ainda não publicou nenhuma peça.',
    whereToFind: 'Onde encontrar',
    noSalesPoints: 'Este artesão ainda não informou onde vende.',
    contact: 'Contato',
    metaDescription: (name: string, craft: string | null, city: string | null) =>
      [name, craft, city].filter(Boolean).join(' — ') +
      '. Veja as peças, onde encontrar e como falar direto com quem faz.',
  },
  product: {
    madeBy: 'Quem fez',
    priceOnRequest: 'Preço a combinar',
    about: 'Sobre a peça',
    whereToBuy: 'Onde comprar',
    noPhoto: 'Esta peça ainda não tem foto.',
    seeProduct: (name: string) => `Ver a peça ${name}`,
    metaDescription: (name: string, artisanName: string) =>
      `${name}, feita à mão por ${artisanName}. Fale direto com quem faz e saiba onde comprar.`,
  },
  whatsApp: {
    talk: 'Falar no WhatsApp',
    aboutProduct: (productName: string, artisanName: string) =>
      `Olá, ${artisanName}! Vi a peça "${productName}" no ArtesanAL e queria saber mais.`,
    aboutArtisan: (artisanName: string) =>
      `Olá, ${artisanName}! Vi seu trabalho no ArtesanAL e queria saber mais.`,
  },
  navigation: {
    backToSearch: 'Voltar para a busca',
  },
  notFound: {
    title: 'Página não encontrada',
    description: 'O endereço que você abriu não existe ou foi removido.',
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
