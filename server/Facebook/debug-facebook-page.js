require('dotenv').config();
const { createPage } = require('./scraper/browser');

(async () => {
  const { page, context } = await createPage();
  try {
    console.log('NAVIGATING');
    const response = await page.goto('https://www.facebook.com/zahidkhan.kakar.5', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('STATUS', response && response.status ? response.status() : 'NO_STATUS');
    console.log('URL', page.url());
    console.log('TITLE', await page.title());
    const text = await page.locator('body').innerText();
    console.log('BODY_TEXT_START');
    console.log((text || '').slice(0, 2000));
    console.log('BODY_TEXT_END');
    const html = await page.content();
    console.log('HTML_HAS_LOGIN', /(log in|Log In|login)/i.test(html));
    console.log('HTML_HAS_POST', /(story_fbid|\/posts\/)/i.test(html));
    console.log('HTML_SNIP', html.slice(0, 1000));
  } catch (error) {
    console.error('PAGE_ERROR', error && error.stack ? error.stack : String(error));
  } finally {
    await context.close();
  }
})();
