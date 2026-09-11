# 0007 — Leaflet com tiles do OpenStreetMap

**Status:** aceita

## Contexto

O mapa é a cara do produto, e o público-alvo usa aparelhos de entrada em rede ruim. O projeto
também não tem verba para cota de API de mapas.

## Decisão

Leaflet (~40 KB, tiles raster) com tiles do OpenStreetMap e agrupamento por
`leaflet.markercluster` para feiras densas. As coordenadas de um ponto vêm do GPS do aparelho no
local ("usar minha localização atual"), com ajuste manual do pin.

## Alternativas descartadas

- **MapLibre GL com tiles vetoriais**: visual muito melhor, mas exige WebGL — justamente o que trava
  em aparelho de entrada — e um provedor de tiles.
- **Google Maps**: familiar e com ótima busca de endereço, mas exige chave, cartão de crédito e
  amarra um projeto de interesse público a um fornecedor comercial.
- **Geocodificação por endereço (Nominatim)**: o Nominatim público limita a 1 req/s e tem cobertura
  irregular no interior de Alagoas; feiras e ateliês muitas vezes não têm endereço utilizável.

## Consequências

- Sem chave de API e sem cota, o ambiente local funciona offline do ponto de vista de cadastro.
- A política de uso dos tiles públicos do OSM exige um provedor próprio se o tráfego crescer.
- O endereço textual é campo livre, apenas para exibição.
