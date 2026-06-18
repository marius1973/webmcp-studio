import type { Page } from '@playwright/test';

/** Abre el menú ＋ Añadir y elige un tipo de la paleta. */
export async function addFromPalette(page: Page, kind: 'Card' | 'Botón' | 'Texto' | 'Input' | 'Contenedor') {
  await page.getByRole('button', { name: '＋ Añadir' }).click();
  await page.getByRole('menuitem', { name: new RegExp(`Añadir ${kind}`) }).click();
}

export async function openAgentStrip(page: Page) {
  const details = page.locator('details.agent-fold');
  if ((await details.count()) === 0) return;
  if (!(await details.evaluate((el) => (el as HTMLDetailsElement).open))) {
    await details.locator('summary').click();
  }
}

export async function openInspector(page: Page) {
  const details = page.locator('details.inspector-fold');
  if ((await details.count()) === 0) return;
  if (!(await details.evaluate((el) => (el as HTMLDetailsElement).open))) {
    await details.locator('summary').click();
  }
}

export async function createBlankProject(page: Page) {
  await page.getByRole('button', { name: /^Proyecto/ }).click();
  await page.getByRole('menuitem', { name: /Nuevo/ }).click();
  await page.getByRole('button', { name: /Crear proyecto/ }).click();
  await page.waitForURL(/\/project\//);
}

export async function exportAngularZip(page: Page) {
  await page.getByRole('button', { name: /^Exportar/ }).click();
  await page.getByRole('menuitem', { name: /Angular ZIP/ }).click();
}

export async function renameProject(page: Page, name: string) {
  await page.getByRole('button', { name: /^Proyecto/ }).click();
  await page.getByRole('menuitem', { name: /Renombrar/ }).click();
  await page.locator('#rename-name').fill(name);
  await page.getByRole('button', { name: /Guardar/ }).click();
}
