// Generate Chrome/Edge store assets from the REAL popup.
//
// Renders popup.html with mocked chrome.* APIs + sample data inside a branded
// 1280x800 promo layout, screenshots it (exact store size, no alpha), and also
// emits a 440x280 promo tile, a 128px store icon, and SUBMISSION.md.
//
// Requires Playwright and an installed Google Chrome. Run from the repo root:
//   npm install        # once (pulls playwright)
//   npm run assets     # -> dist/store-assets/
import { chromium } from "playwright";
import { pathToFileURL, fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist", "store-assets");

const CONFIG = {
  storeName: "Auto Refresh",
  zip: "auto-refresh-v1.0.1.zip",
  head: "タブを自動で再読み込み",
  sub: "間隔を選ぶだけ。\nダッシュボードや在庫ページの監視に。",
  jp: true,
  privacy: "https://informanellica.github.io/ia-autoRefresh/PRIVACY",
  category: "Tools(ツール)/ Productivity",
  perms: "tabs, storage",
  popupWidth: 280,
  popupHeight: 345,
  zoom: 1.7,
};

// chrome.* mock (callback style) — running state + light theme.
const MOCK = `
window.chrome={
 storage:{local:{get:(k,cb)=>cb({theme:'light'}),set:()=>{}}},
 tabs:{query:(q,cb)=>cb([{id:1,url:'https://example.com'}])},
 runtime:{sendMessage:(m,cb)=>cb({active:true,interval:60})},
};
`;

await generate(CONFIG, MOCK, ROOT, OUT);

// --- shared generator (identical across the three extensions) ---
export async function generate(cfg, mock, root, out) {
  fs.mkdirSync(out, { recursive: true });
  const fontFam = cfg.jp
    ? "'Yu Gothic UI','Yu Gothic','Meiryo',sans-serif"
    : "'Segoe UI',Arial,sans-serif";
  const popupUrl = pathToFileURL(path.join(root, "popup.html")).href;
  const iconUrl = pathToFileURL(path.join(root, "icons", "icon128.png")).href;

  const promo = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
.stage{width:1280px;height:800px;display:flex;align-items:center;
 background:linear-gradient(135deg,#0a2540,#103a8e);font-family:${fontFam};overflow:hidden}
.copy{flex:1;padding:0 72px}
.copy h1{color:#fff;font-size:50px;line-height:1.15;margin-bottom:18px;font-weight:700}
.copy p{color:#c8d6f0;font-size:27px;line-height:1.5;white-space:pre-line}
.device{margin-right:96px;border-radius:16px;overflow:hidden;
 box-shadow:0 26px 70px rgba(0,0,0,.5);flex:0 0 auto;zoom:${cfg.zoom}}
.device iframe{border:0;display:block;width:${cfg.popupWidth}px;height:${cfg.popupHeight}px;background:#fff}
</style></head><body><div class="stage">
 <div class="copy"><h1>${cfg.head}</h1><p>${cfg.sub}</p></div>
 <div class="device"><iframe src="${popupUrl}"></iframe></div>
</div></body></html>`;

  const tile = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
.t{width:440px;height:280px;display:flex;align-items:center;gap:24px;padding:0 40px;
 background:linear-gradient(135deg,#0a2540,#103a8e);font-family:${fontFam};color:#fff}
.t img{width:96px;height:96px}
.t h2{font-size:30px;font-weight:700}
.t p{font-size:18px;color:#c8d6f0;margin-top:6px}
</style></head><body><div class="t"><img src="${iconUrl}">
 <div><h2>${cfg.storeName}</h2><p>${cfg.head}</p></div></div></body></html>`;

  fs.writeFileSync(path.join(out, "_promo.html"), promo);
  fs.writeFileSync(path.join(out, "_tile.html"), tile);

  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript({ content: mock });

  await page.goto(pathToFileURL(path.join(out, "_promo.html")).href);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, "screenshot-1280x800.png"), clip: { x: 0, y: 0, width: 1280, height: 800 } });

  await page.setViewportSize({ width: 440, height: 280 });
  await page.goto(pathToFileURL(path.join(out, "_tile.html")).href);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "promo-tile-440x280.png"), clip: { x: 0, y: 0, width: 440, height: 280 } });

  await browser.close();

  fs.copyFileSync(path.join(root, "icons", "icon128.png"), path.join(out, "store-icon-128.png"));
  fs.rmSync(path.join(out, "_promo.html"), { force: true });
  fs.rmSync(path.join(out, "_tile.html"), { force: true });

  fs.writeFileSync(path.join(out, "SUBMISSION.md"), `# Submission assets — ${cfg.storeName}

## Package
- ZIP to upload: \`../${cfg.zip}\`

## Listing
- Store name: ${cfg.storeName}
- Category: ${cfg.category}
- Full listing text (EN + JA): \`../../store/listing.md\`
- Privacy policy URL: ${cfg.privacy}
- Permissions to justify: ${cfg.perms}

## Graphic assets (this folder)
- Store icon 128: \`store-icon-128.png\`
- Screenshot 1280x800 (no alpha): \`screenshot-1280x800.png\`
- Promo tile 440x280 (optional): \`promo-tile-440x280.png\`

Regenerate with: \`npm run assets\`
`);

  console.log("store assets ->", out);
}
