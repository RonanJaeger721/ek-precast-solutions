const { chromium } = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseUrl = process.env.SITE_URL || 'http://localhost:4173';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const results = [];
  for (const [name, width, height] of [['mobile',375,812],['tablet',768,1024],['desktop',1440,1000]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1400);
    const data = await page.evaluate(() => ({
      title: document.title,
      bodyText: document.body.innerText.length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      overflowing: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0,8).map(el => ({tag:el.tagName,cls:el.className,right:Math.round(el.getBoundingClientRect().right)})),
      heroVisible: !!document.querySelector('#hero-title')?.getBoundingClientRect().height,
      navVisible: !!document.querySelector('.track-nav')?.getBoundingClientRect().height
    }));
    await page.screenshot({ path: `${name}.png`, fullPage: false });
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    data.brokenImages = await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src));
    results.push({ name, width, ...data, errors });
    await page.close();
  }
  const interaction = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await interaction.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await interaction.click('#menuToggle');
  const menuOpen = await interaction.locator('#mobileMenu').getAttribute('aria-hidden');
  await interaction.click('#menuToggle');
  await interaction.locator('.project').first().evaluate(el => el.scrollIntoView({block:'center'}));
  await interaction.waitForTimeout(500);
  await interaction.evaluate(() => document.querySelector('.project').click());
  const modalOpen = await interaction.locator('#projectModal').evaluate(el => el.open);
  await interaction.locator('#projectModal .modal-close').click();
  const restoredPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await restoredPage.goto(`${baseUrl}/#motion`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await restoredPage.waitForTimeout(1700);
  const restoredSection = await restoredPage.evaluate(() => {
    const copy = document.querySelector('.motion-copy');
    const frame = document.querySelector('.video-frame');
    return {
      copyOpacity: getComputedStyle(copy).opacity,
      frameClip: getComputedStyle(frame).clipPath,
      sectionHeight: Math.round(document.querySelector('.motion-section').getBoundingClientRect().height)
    };
  });
  await restoredPage.close();
  results.push({ interactions: { menuOpen: menuOpen === 'false', modalOpen, restoredSection } });
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
