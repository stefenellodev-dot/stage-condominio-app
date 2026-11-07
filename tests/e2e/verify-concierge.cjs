const { chromium } = require('playwright');
const BASE = 'http://100.126.211.117:3002';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: /correo|email/i }).first().fill('conserje.almagro@condominio-stage.cl');
  await page.getByRole('textbox', { name: /contraseña|password/i }).first().fill('Test1234$');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(12000);
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').innerText();
  console.log('BADGE:', body.includes('CONSERJE') ? 'CONSERJE' : body.includes('ADMIN') ? 'ADMIN' : body.includes('USER') ? 'USER' : 'NONE');
  const hasModulo = body.includes('Conserjería y Accesos');
  console.log('MODULO CONCIERJE:', hasModulo ? 'VISIBLE' : 'NO ENCONTRADO');
  await browser.close();
})();
