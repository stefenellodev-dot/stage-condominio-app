const { chromium } = require('playwright');

const EMAIL = 'almagro.101@test.com';
const PASS = 'RespTest2026$';
const BASE = 'http://localhost:3000';

const sizes = [
  { name: 'movil-390x844', width: 390, height: 844 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'desktop-1280x800', width: 1280, height: 800 },
];

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: /correo|email/i }).first().fill(EMAIL);
  await page.getByRole('textbox', { name: /contraseña|password/i }).first().fill(PASS);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

async function screenshotAndCheck(page, ctxName, label) {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const iw = await page.evaluate(() => window.innerWidth);
  const overflow = sw > iw;
  await page.screenshot({
    path: `/tmp/r5-${ctxName}-${label}.png`,
    fullPage: true,
  });
  console.log(JSON.stringify({ ctx: ctxName, label, scrollWidth: sw, innerWidth: iw, horizontalOverflow: overflow }));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page);
  console.log('LOGIN_OK user=almagro.101@test.com');

  // Pantallas del rol user
  const views = [
    { label: 'home', click: null },
    { label: 'unidades', click: '🚪' },
    { label: 'espacios-comunes', click: '🏊' },
    { label: 'perfil', click: '👤' },
  ];

  for (const v of views) {
    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      if (v.click) {
        const locator = page.locator('button', { hasText: v.click }).first();
        if ((await locator.count()) > 0) {
          await locator.click();
          await page.waitForLoadState('networkidle');
        }
      }
      await screenshotAndCheck(page, v.label, size.name);
    }
  }

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
