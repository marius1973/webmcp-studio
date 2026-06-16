import { test, expect } from '@playwright/test';

// Flujos clave del Studio. Requiere Edge 147+/Chrome 149 para el agente nativo;
// estos tests cubren la UI y el modelo (no dependen de un agente del navegador).

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForURL(/\/project\//);
});

test('crea un componente desde la paleta y lo deshace', async ({ page }) => {
  await page.getByRole('button', { name: /Añadir Botón/ }).click();
  // El historial registra la acción
  await expect(page.getByText(/1 acciones/)).toBeVisible();
  // Undo desde la toolbar del canvas
  await page.getByRole('button', { name: /Undo/ }).first().click();
  await expect(page.getByText(/0 acciones/)).toBeVisible();
});

test('el agente (simulador) crea y narra en el Observador', async ({ page }) => {
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
  await page.getByRole('button', { name: /Añadir Card/ }).click();
  await expect(page.locator('app-component-tree .count')).toHaveText('2');
  // Autosave debounced (400 ms en ProjectStore)
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForURL(/\/project\//);
  await expect(page.locator('app-component-tree .count')).toHaveText('2');
});
