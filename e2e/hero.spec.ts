import { test, expect, type Page } from '@playwright/test';

/**
 * GIF hero del README (~18 s): 4 paneles, edición manual, drag & drop, undo, agente
 * simulado y narración en el Observador.
 *
 *   npm run demo:hero
 *   npm run demo:gif
 */
const PACE = 800;

test.describe.configure({ timeout: 90_000 });

/** Arrastra un nodo por el handle ⠿ hacia otra fila del árbol (CDK drag-drop). */
async function dragNodeTo(page: Page, sourceLabel: string, targetLabel: string) {
  const handle = page
    .locator('.node-wrap')
    .filter({ has: page.locator('.lbl', { hasText: sourceLabel }) })
    .locator('.handle')
    .first();
  const target = page.locator('.row').filter({ hasText: targetLabel }).first();

  await handle.scrollIntoViewIfNeeded();
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error(`drag: no se encontró ${sourceLabel} → ${targetLabel}`);

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 28 });
  await page.waitForTimeout(350);
  await page.mouse.up();
}

test('flujo real del Studio (hero README)', async ({ page }) => {
  const beat = () => page.waitForTimeout(PACE);
  const observer = page.locator('#panel-observer');

  // ── 4 paneles visibles ─────────────────────────────────────────────────────
  await page.goto('/');
  await page.waitForURL(/\/project\//);
  await expect(page.locator('app-component-tree')).toBeVisible();
  await expect(page.locator('app-canvas-home, app-node-renderer').first()).toBeVisible();
  await expect(page.locator('app-tool-panel')).toBeVisible();
  await expect(page.locator('app-agent-console')).toBeVisible();
  await beat();
  await beat();

  // ── Nuevo proyecto (lienzo limpio) ─────────────────────────────────────────
  await page.getByRole('button', { name: /Nuevo/ }).click();
  await page.waitForURL(/\/project\//);
  await beat();

  // ── Paleta: Card → Botón → Texto ───────────────────────────────────────────
  await page.getByRole('button', { name: /Añadir Card/ }).click();
  await beat();
  await page.getByRole('button', { name: /Añadir Botón/ }).click();
  await beat();
  await page.locator('.row.root').click();
  await page.getByRole('button', { name: /Añadir Texto/ }).click();
  await beat();

  // ── Drag & drop: reparentar Texto dentro de la Card ────────────────────────
  await dragNodeTo(page, 'Texto', 'Card');
  await beat();
  await expect(observer.locator('.step').filter({ hasText: 'move_component' }).first()).toBeVisible();
  await beat();

  // ── Undo (revierte el drag) ────────────────────────────────────────────────
  await page.getByRole('button', { name: /Undo/ }).first().click();
  await beat();

  // ── Simulador de agente: create_component ──────────────────────────────────
  await page.locator('.row').filter({ hasText: 'Card' }).first().click();
  await page.getByRole('button', { name: 'create_component(button)' }).click();
  await beat();
  await page.locator('.row.root').click();
  await page.getByRole('button', { name: 'create_component(card)' }).click();
  await beat();

  // ── Observador: narración 🤖 con rationale ─────────────────────────────────
  await page.getByRole('tab', { name: /Observador/ }).click();
  await expect(observer.getByText('create_component').first()).toBeVisible();
  await expect(observer.locator('.step.agent').filter({ hasText: '🤖' }).first()).toBeVisible();
  await expect(observer.getByText(/porque/).first()).toBeVisible();
  await observer.scrollIntoViewIfNeeded();
  await beat();
  await beat();

  // ── Preview: UI renderizada ────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('app-node-renderer')).toBeVisible();
  await beat();
  await beat();
});
