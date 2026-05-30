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
  version: "1.0.1",
  summaryEN: "Automatically reload any tab at the interval you choose — per tab, with presets, a custom timer, and an at-a-glance badge.",
  summaryJA: "指定した間隔でタブを自動再読み込み。タブごとに設定でき、プリセット・カスタム間隔・ひと目で分かるバッジ付き。",
  homepage: "https://informanellica.com",
  support: "https://github.com/informanellica/ia-autoRefresh",
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

  // Inline listing + privacy so dist/ is fully self-contained.
  const listing = fs.readFileSync(path.join(root, "store", "listing.md"), "utf8");
  const privacy = fs.readFileSync(path.join(root, "PRIVACY.md"), "utf8");
  fs.writeFileSync(path.join(out, "privacy-policy.md"), privacy);
  fs.writeFileSync(path.join(out, "SUBMISSION.md"), submissionDoc(cfg, listing));

  console.log("store assets ->", out);
}

// Field-by-field packet mirroring the Chrome Web Store / Edge listing forms,
// with the full listing text embedded so dist/ needs nothing else.
function submissionDoc(cfg, listing) {
  return `# Submission packet — ${cfg.storeName} (v${cfg.version})

Self-contained: every value for the Chrome Web Store / Edge forms is in THIS
folder. The long Description text is in section D below.

## A. Store listing form
| Field | Value |
| --- | --- |
| Title | ${cfg.storeName} |
| Summary — EN (<=132) | ${cfg.summaryEN} |
| Summary — JA (<=132) | ${cfg.summaryJA} |
| Description | paste "Detailed description" from section D (EN / 日本語) |
| Category | ${cfg.category} |
| Language | English (primary); add 日本語 as a second locale |
| Store icon (128x128) | store-icon-128.png |
| Screenshots (1280x800) | screenshot-1280x800.png |
| Promo tile, small (440x280) | promo-tile-440x280.png (optional) |
| Marquee tile (1400x560) | optional — not provided |
| Homepage URL | ${cfg.homepage} |
| Support URL | ${cfg.support} |
| Mature content | No |
| Visibility | Public |

## B. Privacy practices tab
- Single purpose: see section D ("Single purpose" / 単一目的)
- Permission justifications: see section D ("Permission justifications" / 権限の正当化)
- Permissions in this build: ${cfg.perms}
- Uses remote code? No
- Data collection: none — then tick the 3 certifications (no selling of data,
  use limited to single purpose, not used for creditworthiness)
- Privacy policy URL: ${cfg.privacy}
- Privacy policy text (already hosted; local copy): privacy-policy.md

## C. Package to upload
- ../${cfg.zip}

---

## D. Listing text — full (EN + JA)

${listing}
`;
}
