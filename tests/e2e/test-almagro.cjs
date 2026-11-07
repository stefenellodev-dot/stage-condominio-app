const { chromium } = require('playwright');
const BASE = 'http://100.126.211.117:3002';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: /correo|email/i }).first().fill('almagro.101@test.com');
  await page.getByRole('textbox', { name: /contraseña|password/i }).first().fill('Test1234$');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(10000);
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').innerText();
  const badge = body.includes('SUPERADMIN') ? 'SUPERADMIN' : body.includes('ADMIN') ? 'ADMIN' : body.includes('USER') ? 'USER' : body.includes('CONSERJE') ? 'CONSERJE' : 'DESCONOCIDO';
  console.log('BADGE:', badge);
  console.log('MODULO CONDOMINIOS:', body.includes('Condominios') ? 'VISIBLE' : 'NO');
  await browser.close();
})();
EOF
node tests/e2e/test-concierge-roles.cjs 2>&1