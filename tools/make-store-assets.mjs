// Generate Chrome/Edge store assets from the REAL popup, for every UI locale.
//
// For each locale it renders popup.html with mocked chrome.* APIs + that
// locale's messages inside a branded 1280x800 promo layout, and writes:
//   dist/store-assets/<lang>/screenshot-1280x800.png
//   dist/store-assets/<lang>/promo-tile-440x280.png
// Plus, at the top level: store-icon-128.png, privacy-policy.md, SUBMISSION.md.
//
// Requires Playwright + an installed Google Chrome. Run from the repo root:
//   npm install        # once
//   npm run assets     # -> dist/store-assets/
import { chromium } from "playwright";
import { pathToFileURL, fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist", "store-assets");

const CONFIG = {
  storeName: "Auto Refresh",
  zip: "auto-refresh-v1.0.2.zip",
  uiLocale: "ja",
  privacy: "https://informanellica.github.io/ia-autoRefresh/PRIVACY",
  category: "Tools(ツール)/ Productivity",
  perms: "tabs, storage",
  version: "1.0.2",
  summaryEN: "Automatically reload any tab at the interval you choose — per tab, with presets, a custom timer, and an at-a-glance badge.",
  summaryJA: "指定した間隔でタブを自動再読み込み。タブごとに設定でき、プリセット・カスタム間隔・ひと目で分かるバッジ付き。",
  homepage: "https://informanellica.com",
  support: "https://github.com/informanellica/ia-autoRefresh",
  popupWidth: 280,
  popupHeight: 345,
  zoom: 1.7,
  promoHead: {
    en: "Auto-reload any tab",
    ja: "タブを自動で再読み込み",
    es: "Recarga automática de pestañas",
    pt_BR: "Recarregue abas automaticamente",
    fr: "Rechargez vos onglets automatiquement",
    de: "Tabs automatisch neu laden",
    it: "Ricarica automatica delle schede",
    ru: "Автообновление вкладок",
    zh_CN: "自动刷新任意标签页",
    zh_TW: "自動重新整理分頁",
    ko: "탭 자동 새로고침",
  },
};

// chrome.* mock (callback style) — running state.
const MOCK = `
window.chrome={
 storage:{local:{get:(k,cb)=>cb({theme:'light'}),set:()=>{}}},
 tabs:{query:(q,cb)=>cb([{id:1,url:'https://example.com'}])},
 runtime:{sendMessage:(m,cb)=>cb({active:true,interval:60})},
};
`;

// --- shared generator (identical across the three extensions) ---
const CJK = new Set(["ja", "zh_CN", "zh_TW", "ko"]);
const FONT_LATIN = "'Segoe UI',Arial,sans-serif";
const FONT_CJK = "'Segoe UI','Yu Gothic UI','Microsoft YaHei','Microsoft JhengHei','Malgun Gothic','Meiryo',sans-serif";

export async function generate(cfg, mock, root, out) {
  fs.mkdirSync(out, { recursive: true });
  const popupUrl = pathToFileURL(path.join(root, "popup.html")).href;
  const iconUrl = pathToFileURL(path.join(root, "icons", "icon128.png")).href;

  const browser = await chromium.launch({ channel: "chrome" });

  for (const lang of Object.keys(cfg.promoHead)) {
    const msgsRaw = JSON.parse(fs.readFileSync(path.join(root, "_locales", lang, "messages.json"), "utf8"));
    const flat = {};
    for (const k in msgsRaw) flat[k] = msgsRaw[k].message;
    const head = cfg.promoHead[lang];
    const sub = flat.appDesc || "";
    const fontFam = CJK.has(lang) ? FONT_CJK : FONT_LATIN;
    const i18nMock = `(()=>{const M=${JSON.stringify(flat)};window.chrome=window.chrome||{};window.chrome.i18n={getMessage:(k,subs)=>{let s=(M[k]||"");if(subs!=null){const a=[].concat(subs);let i=0;s=s.replace(/\\$\\w+\\$/g,()=>a[i++]??"");}return s;}};})();`;

    const promo = `<!doctype html><html lang="${lang.replace("_", "-")}"><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
.stage{width:1280px;height:800px;display:flex;align-items:center;
 background:linear-gradient(135deg,#0a2540,#103a8e);font-family:${fontFam};overflow:hidden}
.copy{flex:1;padding:0 72px}
.copy h1{color:#fff;font-size:50px;line-height:1.15;margin-bottom:18px;font-weight:700}
.copy p{color:#c8d6f0;font-size:26px;line-height:1.5}
.device{margin-right:96px;border-radius:16px;overflow:hidden;
 box-shadow:0 26px 70px rgba(0,0,0,.5);flex:0 0 auto;zoom:${cfg.zoom}}
.device iframe{border:0;display:block;width:${cfg.popupWidth}px;height:${cfg.popupHeight}px;background:#fff}
</style></head><body><div class="stage">
 <div class="copy"><h1>${escapeHtml(head)}</h1><p>${escapeHtml(sub)}</p></div>
 <div class="device"><iframe src="${popupUrl}"></iframe></div>
</div></body></html>`;

    const tile = `<!doctype html><html lang="${lang.replace("_", "-")}"><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
.t{width:440px;height:280px;display:flex;align-items:center;gap:24px;padding:0 40px;
 background:linear-gradient(135deg,#0a2540,#103a8e);font-family:${fontFam};color:#fff}
.t img{width:96px;height:96px}
.t h2{font-size:28px;font-weight:700}
.t p{font-size:17px;color:#c8d6f0;margin-top:6px}
</style></head><body><div class="t"><img src="${iconUrl}">
 <div><h2>${escapeHtml(cfg.storeName)}</h2><p>${escapeHtml(head)}</p></div></div></body></html>`;

    const dir = path.join(out, lang);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "_promo.html"), promo);
    fs.writeFileSync(path.join(dir, "_tile.html"), tile);

    // Fresh context per locale so init scripts don't accumulate.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript({ content: mock + "\n" + i18nMock });
    await page.goto(pathToFileURL(path.join(dir, "_promo.html")).href);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(dir, "screenshot-1280x800.png"), clip: { x: 0, y: 0, width: 1280, height: 800 } });

    await page.setViewportSize({ width: 440, height: 280 });
    await page.goto(pathToFileURL(path.join(dir, "_tile.html")).href);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(dir, "promo-tile-440x280.png"), clip: { x: 0, y: 0, width: 440, height: 280 } });
    await ctx.close();

    fs.rmSync(path.join(dir, "_promo.html"), { force: true });
    fs.rmSync(path.join(dir, "_tile.html"), { force: true });

    if (lang === cfg.uiLocale) {
      fs.copyFileSync(path.join(dir, "screenshot-1280x800.png"), path.join(out, "screenshot-1280x800.png"));
      fs.copyFileSync(path.join(dir, "promo-tile-440x280.png"), path.join(out, "promo-tile-440x280.png"));
    }
    console.log("  shot", lang);
  }

  await browser.close();

  fs.copyFileSync(path.join(root, "icons", "icon128.png"), path.join(out, "store-icon-128.png"));

  const listing = fs.readFileSync(path.join(root, "store", "listing.md"), "utf8");
  const privacy = fs.readFileSync(path.join(root, "PRIVACY.md"), "utf8");
  fs.writeFileSync(path.join(out, "privacy-policy.md"), privacy);
  fs.writeFileSync(path.join(out, "SUBMISSION.md"), submissionDoc(cfg, listing));

  console.log("store assets ->", out);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function submissionDoc(cfg, listing) {
  const langs = Object.keys(cfg.promoHead).join(", ");
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
| Language | English (primary); add others as locales |
| Store icon (128x128) | store-icon-128.png |
| Screenshots (1280x800) | per-locale: <lang>/screenshot-1280x800.png (default: screenshot-1280x800.png) |
| Promo tile, small (440x280) | per-locale: <lang>/promo-tile-440x280.png |
| Marquee tile (1400x560) | optional — not provided |
| Homepage URL | ${cfg.homepage} |
| Support URL | ${cfg.support} |
| Mature content | No |
| Visibility | Public |

Localized screenshots/tiles available for: ${langs}

## B. Privacy practices tab
- Single purpose: see section D ("Single purpose" / 単一目的)
- Permission justifications: see section D ("Permission justifications" / 権限の正当化)
- Permissions in this build: ${cfg.perms}
- Uses remote code? No
- Data collection: none — then tick the 3 certifications
- Privacy policy URL: ${cfg.privacy}
- Privacy policy text (already hosted; local copy): privacy-policy.md

## C. Package to upload
- ../${cfg.zip}

---

## D. Listing text — full (EN + JA)

${listing}
`;
}

await generate(CONFIG, MOCK, ROOT, OUT);
