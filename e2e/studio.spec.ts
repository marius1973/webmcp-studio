import { test, expect } from '@playwright/test';
import { addFromPalette, openAgentStrip, redoHistory, undoHistory } from './ui-helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForURL(/\/project\//);
});

test('crea un componente desde la paleta y lo deshace', async ({ page }) => {
  await addFromPalette(page, 'Botón');
  await expect(page.locator('app-history-slider .pos')).toHaveText('1 / 1');
  await undoHistory(page);
  await expect(page.locator('app-history-slider .pos')).toHaveText('0 / 1');
});

test('el agente (simulador) crea y narra en el Observador', async ({ page }) => {
  await openAgentStrip(page);
  await page.getByRole('button', { name: 'create_component(button)' }).click();
  const observerPanel = page.locator('#panel-observer');
  await expect(observerPanel.getByText('create_component')).toBeVisible();
  await expect(observerPanel.getByText(/porque/)).toBeVisible();
});

test('las tools cambian al navegar entre editor y docs', async ({ page }) => {
  const toolPanel = page.locator('app-tool-panel');
  await expect(toolPanel.getByText('create_component', { exact: false }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Docs' }).click();
  await expect(toolPanel.getByText('search_docs')).toBeVisible();
});

test('persiste el proyecto entre recargas', async ({ page }) => {
  await addFromPalette(page, 'Card');
  await expect(page.locator('app-component-tree .count')).toHaveText('2');
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForURL(/\/project\//);
  await expect(page.locator('app-component-tree .count')).toHaveText('2');
});
