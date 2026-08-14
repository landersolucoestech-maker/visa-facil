import heroVisaFacil from '../assets/hero-visa-facil.webp';

export type HeroSlide = {
  src: string;
  alt: string;
};

/**
 * EDITE SOMENTE ESTA LISTA PARA TROCAR OS BANNERS DO HERO.
 *
 * - `src`: pode ser uma imagem importada do projeto ou uma URL HTTPS.
 * - `alt`: descrição curta da arte para acessibilidade.
 * - Para adicionar/remover banners, adicione/remova itens do array.
 * - O slideshow e os indicadores se adaptam automaticamente à quantidade.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    src: heroVisaFacil,
    alt: 'Estátua da Liberdade, skyline de Nova York e bandeira dos Estados Unidos',
  },
  {
    src: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1800&q=90',
    alt: 'Nova York, Estados Unidos',
  },
  {
    src: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=1800&q=90',
    alt: 'Toronto, Canadá',
  },
];
