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
  singlePurpose: "Automatically reload browser tabs at a user-defined interval.",
  // Store "Description" (16,000 chars) per language — paste into the listing.
  desc: {
    en: "Auto Refresh reloads any tab automatically at the interval you choose — per tab, with handy presets, a custom timer (seconds or minutes), a toolbar badge, and optional resume after restart. Light and dark themes that follow your system. Everything runs locally: no data is collected and no network requests are made.",
    ja: "Auto Refresh は、選んだ間隔でタブを自動的に再読み込みします。タブごとに設定でき、便利なプリセット・カスタム間隔(秒/分)・ツールバーのバッジ・再起動後の自動再開(任意)に対応。システムに追従するライト/ダークテーマ。すべて端末内で動作し、データ収集や通信は一切行いません。",
    es: "Auto Refresh recarga cualquier pestaña automáticamente en el intervalo que elijas: por pestaña, con preajustes prácticos, temporizador personalizado (segundos o minutos), insignia en la barra y reanudación opcional tras reiniciar. Temas claro y oscuro que siguen tu sistema. Todo funciona localmente: no se recopilan datos ni se hacen peticiones de red.",
    pt_BR: "O Auto Refresh recarrega qualquer aba automaticamente no intervalo que você escolher — por aba, com predefinições práticas, timer personalizado (segundos ou minutos), selo na barra e retomada opcional após reiniciar. Temas claro e escuro que acompanham o sistema. Tudo funciona localmente: nenhum dado é coletado e nenhuma requisição de rede é feita.",
    fr: "Auto Refresh recharge automatiquement n'importe quel onglet à l'intervalle choisi — par onglet, avec des préréglages pratiques, un minuteur personnalisé (secondes ou minutes), un badge dans la barre d'outils et une reprise facultative après redémarrage. Thèmes clair et sombre qui suivent votre système. Tout fonctionne en local : aucune donnée collectée, aucune requête réseau.",
    de: "Auto Refresh lädt jeden Tab automatisch im gewählten Intervall neu — pro Tab, mit praktischen Voreinstellungen, eigenem Timer (Sekunden oder Minuten), einem Symbol-Badge und optionaler Fortsetzung nach dem Neustart. Helles und dunkles Design, das deinem System folgt. Alles läuft lokal: keine Datenerfassung, keine Netzwerkanfragen.",
    it: "Auto Refresh ricarica automaticamente qualsiasi scheda all'intervallo scelto — per scheda, con preset comodi, timer personalizzato (secondi o minuti), badge nella barra e ripresa facoltativa dopo il riavvio. Temi chiaro e scuro che seguono il sistema. Funziona tutto in locale: nessun dato raccolto e nessuna richiesta di rete.",
    ru: "Auto Refresh автоматически перезагружает любую вкладку с выбранным интервалом — для каждой вкладки, с удобными пресетами, своим таймером (секунды или минуты), значком на панели и необязательным возобновлением после перезапуска. Светлая и тёмная темы, следующие за системой. Всё работает локально: данные не собираются, сетевые запросы не выполняются.",
    zh_CN: "Auto Refresh 按你选择的间隔自动刷新任意标签页——逐标签设置，含便捷预设、自定义计时器（秒或分钟）、工具栏角标，以及可选的重启后自动恢复。浅色与深色主题，跟随系统。一切均在本地运行：不收集任何数据，也不发起网络请求。",
    zh_TW: "Auto Refresh 依你選擇的間隔自動重新整理任意分頁——逐分頁設定，含便捷預設、自訂計時器（秒或分鐘）、工具列角標，以及可選的重新啟動後自動恢復。淺色與深色主題，跟隨系統。一切皆在本機執行：不收集任何資料，也不發出網路請求。",
    ko: "Auto Refresh는 선택한 간격으로 모든 탭을 자동으로 새로고침합니다 — 탭별 설정, 편리한 프리셋, 사용자 지정 타이머(초 또는 분), 툴바 배지, 재시작 후 자동 재개(선택)를 지원합니다. 시스템을 따르는 밝은/어두운 테마. 모든 작업은 로컬에서 실행되며 데이터를 수집하거나 네트워크 요청을 하지 않습니다.",
  },
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

const LANG_NAME = {
  en: "English", ja: "日本語", es: "Español", pt_BR: "Português (BR)", fr: "Français",
  de: "Deutsch", it: "Italiano", ru: "Русский", zh_CN: "简体中文", zh_TW: "繁體中文", ko: "한국어",
};

// Top-to-bottom, all-language submission walkthrough.
function submissionDoc(cfg, listing) {
  const langs = Object.keys(cfg.promoHead);
  const rows = langs
    .map((l) => `| ${l} — ${LANG_NAME[l] || l} | \`${l}/screenshot-1280x800.png\` | \`${l}/promo-tile-440x280.png\` |`)
    .join("\n");
  const descs = langs
    .map((l) => `### ${LANG_NAME[l] || l} (${l})\n\n${cfg.desc[l] || cfg.desc.en}`)
    .join("\n\n");

  return `# 提出ガイド — ${cfg.storeName}（v${cfg.version}）｜上から順に

このフォルダだけで提出できます。**タイトルと概要は拡張機能パッケージから自動取得**され、
全${langs.length}言語に翻訳済みです。そのため言語ごとに設定するのは**説明文**と
**ローカライズ版スクリーンショット**だけです。画像は各言語の \`<lang>/\` サブフォルダにあります。

## 手順0 — 事前準備
- プライバシーポリシーを公開し、URLが開けることを確認: ${cfg.privacy}
  （本文: このフォルダの \`privacy-policy.md\`）
- アカウント: Chrome ウェブストア デベロッパー（初回 \$5）/ Edge Partner Center（無料）

## 手順1 — アイテム作成とパッケージのアップロード
1. Chrome ウェブストア デベロッパー ダッシュボード → **「新しいアイテム」**
2. \`../${cfg.zip}\` をアップロード

## 手順2 — 全言語向けアセット（最初に1回）
**「全言語向けアセット」**の欄に:
- ショップアイコン（128×128）: \`store-icon-128.png\`
- 全言語向けスクリーンショット（未対応言語のフォールバック）: \`en/screenshot-1280x800.png\`
- プロモーションタイル 440×280（任意）: \`en/promo-tile-440x280.png\`
- マーキー 1400×560: スキップ

## 手順3 — 共通フィールド（「すべての言語用」を1回）
- カテゴリ: ${cfg.category}
- ホームページ URL: ${cfg.homepage}
- サポート URL: ${cfg.support}
- 成人向けコンテンツ: **いいえ**
- 公開設定: **公開（Public）**

## 手順4 — 言語ごとの掲載（各言語で繰り返す）
**「編集中の言語」**を切り替え、その言語について:
1. 説明: 手順5のその言語のテキストを貼り付け
2. ローカライズ版スクリーンショット: その言語のファイルをアップロード
（タイトル・概要は自動入力されます）

| 言語 | ローカライズ版スクショ | ローカライズ版タイル |
| --- | --- | --- |
${rows}

最低でも **英語（en）＋ 日本語（ja）**。他の言語は後から追加できます
（それまでは自動翻訳のタイトル/概要 ＋ 全言語向け（英語）スクショが表示されます）。

## 手順5 — 貼り付け用の説明文（言語別）

${descs}

## 手順6 — プライバシー（Privacy practices タブ）
- 単一目的（Single purpose）: ${cfg.singlePurpose}
- この版の権限: ${cfg.perms}（正当化の文言は末尾の付録に）
- リモートコードの使用: **なし（No）**
- データ収集: **なし** → 3つの宣言にチェック（販売しない / 単一目的に限定 / 信用度評価に使わない）
- プライバシーポリシー URL: ${cfg.privacy}

## 手順7 — 提出
**「審査のために送信」** をクリック。審査は数時間〜数日（広い権限ほど長め）。

## 手順8 — Microsoft Edge アドオン（同じパッケージ）
1. Partner Center → 新規拡張機能 → \`../${cfg.zip}\` をアップロード
2. 上記と同じ説明文・スクショ・URL を流用
3. プライバシー: 同じポリシー URL、データ収集なし → **公開**

---

## 付録 — 英語/日本語の掲載文リファレンス（概要・権限の正当化）

${listing}
`;
}

await generate(CONFIG, MOCK, ROOT, OUT);
