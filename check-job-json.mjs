// One public job per invocation; no model, no submission, no user-file writes.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { checkUrlLiveness, newLivenessPage, validateUrlSecurity } from './liveness-browser.mjs';
const url = process.argv[2];
let browser;
try {
  await validateUrlSecurity(url);
  // Reuse installed Chrome if Playwright's separate browser is absent.
  // A fresh temporary profile is used; never open the user's profile.
  browser = await chromium.launch({ headless: true, ...(existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' }) });
  const result = await checkUrlLiveness(await newLivenessPage(browser), url);
  console.log(JSON.stringify(result));
} catch {
  console.log(JSON.stringify({ result: 'uncertain', reason: '检查失败，请打开官网确认' }));
} finally { await browser?.close(); }
