/** Estilos de layout para contenedores en Preview (sin CSS libre). */

export function layoutClass(props: Record<string, string>): string {
  const parts = ['pv-layout'];
  const dir = props['direction'] === 'row' ? 'row' : 'col';
  parts.push(`pv-${dir}`);
  const gap = props['gap'];
  if (gap === 'sm' || gap === 'lg') parts.push(`pv-gap-${gap}`);
  const align = props['align'];
  if (align === 'center' || align === 'start') parts.push(`pv-align-${align}`);
  return parts.join(' ');
}

export function textSizeClass(props: Record<string, string>): string {
  const size = props['textSize'];
  if (size === 'hero' || size === 'caption') return `pv-text-${size}`;
  return 'pv-text-body';
}
