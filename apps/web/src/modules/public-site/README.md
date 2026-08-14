# Website público Visa Fácil

Este projeto agora contém somente o website/landing page comercial da Visa Fácil.

## Alterar banners do Hero

O slideshow é controlado por um único arquivo:

`apps/web/src/modules/public-site/content/heroSlides.ts`

Para trocar uma propaganda:

1. abra `heroSlides.ts`;
2. altere o campo `src` do banner desejado;
3. ajuste o `alt` com uma descrição curta da nova arte;
4. commit/push no branch `dev`;
5. o GitHub Actions publica automaticamente o novo website no GitHub Pages.

O campo `src` pode receber uma URL HTTPS de imagem. Imagens permanentes da marca podem ser adicionadas em `apps/web/src/modules/public-site/assets/` e importadas no arquivo de slides.

Para adicionar ou remover banners, basta adicionar ou remover objetos de `HERO_SLIDES`. O componente cria automaticamente os slides, setas e indicadores conforme a quantidade.

## Estrutura pública

- `components/` — seções visuais do website
- `content/heroSlides.ts` — campanhas/banners do Hero
- `assets/` — imagens permanentes do website
- `styles/` — identidade visual e responsividade
- `pages/PublicSitePage.tsx` — composição da landing page
- `usePublicSiteInteractions.ts` — slideshow, menu, FAQ e demais interações

O website preserva a migração React da página oficial e não utiliza iframe nem `dangerouslySetInnerHTML`.
