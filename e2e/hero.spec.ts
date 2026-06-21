import { test, expect, type Page } from '@playwright/test';
import { addFromPalette, createBlankProject, openAgentStrip, undoHistory } from './ui-helpers';

/**
 * Video hero del README (~20 s): 4 paneles, paleta, drag & drop, historial con slider,
 * playbook, replay en el Observador y Preview con datos mock.
 */
const PACE = 800;

test.describe.configure({ timeout: 90_000 });

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

  await page.goto('/');
  await page.waitForURL(/\/project\//);
  await expect(page.locator('app-component-tree')).toBeVisible();
  await expect(page.locator('app-canvas-home, app-node-renderer').first()).toBeVisible();
  await expect(page.locator('app-tool-panel')).toBeVisible();
  await expect(page.locator('app-agent-console')).toBeVisible();
  await beat();
  await beat();

  await createBlankProject(page);
  await beat();

  await addFromPalette(page, 'Card');
  await beat();
  await addFromPalette(page, 'Botón');
  await beat();
  await page.locator('.row.root').click();
  await addFromPalette(page, 'Texto');
  await beat();

  await dragNodeTo(page, 'Texto', 'Card');
  await beat();
  await expect(observer.locator('.step').filter({ hasText: 'move_component' }).first()).toBeVisible();
  await beat();

  await expect(page.locator('app-history-slider')).toBeVisible();
  await undoHistory(page);
  await beat();

  await openAgentStrip(page);
  await page.getByRole('button', { name: 'Landing analytics' }).click();
  await beat();
  await beat();

  await page.getByRole('tab', { name: /Observador/ }).click();
  await expect(observer.locator('.step').filter({ hasText: 'run_playbook' }).first()).toBeVisible();
  await expect(observer.locator('.step.agent').filter({ hasText: '🤖' }).first()).toBeVisible();
  await expect(observer.getByText(/porque/).first()).toBeVisible();
  await observer.locator('.step').filter({ hasText: 'run_playbook' }).first().click();
  await beat();
  await observer.scrollIntoViewIfNeeded();
  await beat();

  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('app-node-renderer')).toBeVisible();
  await beat();
  await page.getByRole('button', { name: 'Con datos' }).click();
  await beat();
  await beat();
});
