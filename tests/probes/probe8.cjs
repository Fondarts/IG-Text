const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:8000/index.html',{waitUntil:'networkidle'});
  await page.click('#emoji-btn'); await page.waitForTimeout(150);
  await page.fill('#text-input','Team USA ');
  const us = await page.evaluateHandle(()=>[...document.querySelectorAll('#emoji-panel .emoji-item')].find(x=>x.dataset.emoji==='\u{1F1FA}\u{1F1F8}'));
  await us.asElement().click();
  await page.waitForTimeout(1500);
  await page.click('#emoji-btn'); await page.waitForTimeout(150);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#download-btn')]);
  await dl.saveAs('tu.png');
  await b.close();
})();
