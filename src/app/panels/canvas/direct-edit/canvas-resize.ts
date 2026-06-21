/** Convierte props width/height a estilos inline para Preview. */
export function sizeStyle(props: Record<string, string>): Record<string, string> {
  const style: Record<string, string> = {};
  const w = props['width'];
  const h = props['height'];
  if (w) style['width'] = w.endsWith('%') || w.endsWith('px') ? w : `${w}px`;
  if (h) style['height'] = h.endsWith('%') || h.endsWith('px') ? h : `${h}px`;
  if (w || h) {
    style['maxWidth'] = '100%';
    style['boxSizing'] = 'border-box';
  }
  return style;
}

export function formatSizePx(px: number): string {
  return `${Math.max(48, Math.round(px))}`;
}
