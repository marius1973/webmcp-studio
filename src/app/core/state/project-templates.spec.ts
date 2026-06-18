import { describe, it, expect } from 'vitest';
import { PROJECT_TEMPLATES } from './project-templates';
import { validateTreeState } from '../webmcp/tree-validate';

describe('project-templates', () => {
  it('todas las plantillas pasan validación', () => {
    for (const tpl of PROJECT_TEMPLATES) {
      const result = validateTreeState(tpl.tree());
      expect(result.ok, tpl.id).toBe(true);
    }
  });

  it('landing-saas tiene botón CTA', () => {
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === 'landing-saas')!;
    const state = tpl.tree();
    const hasButton = Object.values(state.nodes).some((n) => n.kind === 'button');
    expect(hasButton).toBe(true);
  });
});
