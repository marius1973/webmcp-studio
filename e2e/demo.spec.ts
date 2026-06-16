import { test, expect } from '@playwright/test';

/**
 * Recorrido de demo grabado en video (Playwright).
 *   npm run demo:video
 * El .webm queda en ./test-results/. Convertilo a GIF con ffmpeg (ver DEMO.md).
 *
 * Las pausas (`beat`) son solo para que el video se vea fluido, no para esperar al DOM.
 */
const PACE = 900;

test('recorrido completo del Studio', async ({ page }) => {
  const beat = () => page.waitForTimeout(PACE);

  // Escena 1 — el agente construye UI estructuralmente
  await page.goto('/');
  await page.waitForURL(/\/project\//);
  await beat();
  await page.getByRole('button', { name: 'create_component(card)' }).click();
  await beat();
  await page.getByRole('button', { name: 'create_component(button)' }).click();
  await beat();

  // Preview: ver los componentes reales renderizados
  await page.getByRole('button', { name: 'Preview' }).click();
  await beat();

  // Escena 3 — Signal Form expuesto como tool
  await page.locator('app-new-component-form select').selectOption('text');
  await page.locator('app-new-component-form input').first().fill('Título de la demo');
  await beat();
  await page.locator('app-new-component-form').getByRole('button', { name: 'Crear' }).click();
  await beat();

  // Escena 2 — narración del agente en el Observador
  await expect(page.getByText('create_component').first()).toBeVisible();
  await expect(page.getByText(/porque/).first()).toBeVisible();
  await beat();

  // Escena 4 — deshacer lo que hizo el agente
  const undo = page.getByRole('button', { name: /Undo/ }).first();
  await undo.click();
  await beat();
  await undo.click();
  await beat();

  // Escena 5 — auto-cleanup: cambian las tools al ir a Docs
  await page.getByRole('link', { name: 'Docs' }).click();
  await expect(page.getByText('search_docs')).toBeVisible();
  await beat();

  // Escena 6 — persistencia: volver y recargar
  await page.getByRole('link', { name: /Volver al editor/ }).click();
  await page.waitForURL(/\/project\//);
  await beat();
  await page.reload();
  await beat();
});
