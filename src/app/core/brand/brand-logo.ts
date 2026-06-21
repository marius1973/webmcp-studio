/** Rutas del logo de marca (cuadrado, PNG nítido + variante retina). */
export const BRAND_LOGO = {
  src: 'icons/logo.png',
  src2x: 'icons/logo@2x.png',
  /** Tamaño CSS en px (la imagen fuente es 2× para pantallas retina). */
  docs: 128,
  about: 160,
} as const;

export function brandLogoSrcset(): string {
  return `${BRAND_LOGO.src} 1x, ${BRAND_LOGO.src2x} 2x`;
}
