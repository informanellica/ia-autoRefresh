// Client-side i18n for this extension's detail page (GitHub Pages).
(function () {
  const LANGS = [
    ["en", "English"], ["ja", "日本語"], ["es", "Español"], ["pt_BR", "Português"],
    ["fr", "Français"], ["de", "Deutsch"], ["it", "Italiano"], ["ru", "Русский"],
    ["zh_CN", "简体中文"], ["zh_TW", "繁體中文"], ["ko", "한국어"],
  ];
  const T = {
    tagline: { en: "Auto-reload any tab", ja: "タブを自動で再読み込み", es: "Recarga automática de pestañas", pt_BR: "Recarregue abas automaticamente", fr: "Rechargez vos onglets automatiquement", de: "Tabs automatisch neu laden", it: "Ricarica automatica delle schede", ru: "Автообновление вкладок", zh_CN: "自动刷新任意标签页", zh_TW: "自動重新整理分頁", ko: "탭 자동 새로고침" },
    desc: { en: "Auto Refresh reloads any tab automatically at the interval you choose — per tab, with handy presets, a custom timer (seconds or minutes), a toolbar badge, and optional resume after restart. Light and dark themes that follow your system. Everything runs locally: no data is collected and no network requests are made.", ja: "Auto Refresh は、選んだ間隔でタブを自動的に再読み込みします。タブごとに設定でき、便利なプリセット・カスタム間隔(秒/分)・ツールバーのバッジ・再起動後の自動再開(任意)に対応。システムに追従するライト/ダークテーマ。すべて端末内で動作し、データ収集や通信は一切行いません。", es: "Auto Refresh recarga cualquier pestaña automáticamente en el intervalo que elijas: por pestaña, con preajustes prácticos, temporizador personalizado (segundos o minutos), insignia en la barra y reanudación opcional tras reiniciar. Temas claro y oscuro que siguen tu sistema. Todo funciona localmente: no se recopilan datos ni se hacen peticiones de red.", pt_BR: "O Auto Refresh recarrega qualquer aba automaticamente no intervalo que você escolher — por aba, com predefinições práticas, timer personalizado (segundos ou minutos), selo na barra e retomada opcional após reiniciar. Temas claro e escuro que acompanham o sistema. Tudo funciona localmente: nenhum dado é coletado e nenhuma requisição de rede é feita.", fr: "Auto Refresh recharge automatiquement n'importe quel onglet à l'intervalle choisi — par onglet, avec des préréglages pratiques, un minuteur personnalisé (secondes ou minutes), un badge dans la barre d'outils et une reprise facultative après redémarrage. Thèmes clair et sombre qui suivent votre système. Tout fonctionne en local : aucune donnée collectée, aucune requête réseau.", de: "Auto Refresh lädt jeden Tab automatisch im gewählten Intervall neu — pro Tab, mit praktischen Voreinstellungen, eigenem Timer (Sekunden oder Minuten), einem Symbol-Badge und optionaler Fortsetzung nach dem Neustart. Helles und dunkles Design, das deinem System folgt. Alles läuft lokal: keine Datenerfassung, keine Netzwerkanfragen.", it: "Auto Refresh ricarica automaticamente qualsiasi scheda all'intervallo scelto — per scheda, con preset comodi, timer personalizzato (secondi o minuti), badge nella barra e ripresa facoltativa dopo il riavvio. Temi chiaro e scuro che seguono il sistema. Funziona tutto in locale: nessun dato raccolto e nessuna richiesta di rete.", ru: "Auto Refresh автоматически перезагружает любую вкладку с выбранным интервалом — для каждой вкладки, с удобными пресетами, своим таймером (секунды или минуты), значком на панели и необязательным возобновлением после перезапуска. Светлая и тёмная темы, следующие за системой. Всё работает локально: данные не собираются, сетевые запросы не выполняются.", zh_CN: "Auto Refresh 按你选择的间隔自动刷新任意标签页——逐标签设置，含便捷预设、自定义计时器（秒或分钟）、工具栏角标，以及可选的重启后自动恢复。浅色与深色主题，跟随系统。一切均在本地运行：不收集任何数据，也不发起网络请求。", zh_TW: "Auto Refresh 依你選擇的間隔自動重新整理任意分頁——逐分頁設定，含便捷預設、自訂計時器（秒或分鐘）、工具列角標，以及可選的重新啟動後自動恢復。淺色與深色主題，跟隨系統。一切皆在本機執行：不收集任何資料，也不發出網路請求。", ko: "Auto Refresh는 선택한 간격으로 모든 탭을 자동으로 새로고침합니다 — 탭별 설정, 편리한 프리셋, 사용자 지정 타이머(초 또는 분), 툴바 배지, 재시작 후 자동 재개(선택)를 지원합니다. 시스템을 따르는 밝은/어두운 테마. 모든 작업은 로컬에서 실행되며 데이터를 수집하거나 네트워크 요청을 하지 않습니다." },
    apps: { en: "All apps", ja: "アプリ一覧", es: "Aplicaciones", pt_BR: "Aplicativos", fr: "Applications", de: "Apps", it: "App", ru: "Приложения", zh_CN: "应用", zh_TW: "應用程式", ko: "앱" },
    support: { en: "Support", ja: "サポート", es: "Soporte", pt_BR: "Suporte", fr: "Assistance", de: "Support", it: "Assistenza", ru: "Поддержка", zh_CN: "支持", zh_TW: "支援", ko: "지원" },
    releases: { en: "Download (releases)", ja: "ダウンロード（リリース）", es: "Descargar (versiones)", pt_BR: "Baixar (versões)", fr: "Télécharger (versions)", de: "Download (Releases)", it: "Scarica (release)", ru: "Скачать (релизы)", zh_CN: "下载（发布）", zh_TW: "下載（發行）", ko: "다운로드(릴리스)" },
    source: { en: "Source code", ja: "ソースコード", es: "Código fuente", pt_BR: "Código-fonte", fr: "Code source", de: "Quellcode", it: "Codice sorgente", ru: "Исходный код", zh_CN: "源代码", zh_TW: "原始碼", ko: "소스 코드" },
    privacy: { en: "Privacy policy", ja: "プライバシーポリシー", es: "Política de privacidad", pt_BR: "Política de privacidade", fr: "Confidentialité", de: "Datenschutz", it: "Privacy", ru: "Конфиденциальность", zh_CN: "隐私政策", zh_TW: "隱私權政策", ko: "개인정보처리방침" },
    note: { en: "For Chrome & Edge · No data collected · Open source", ja: "Chrome・Edge 対応 · データ収集なし · オープンソース", es: "Para Chrome y Edge · Sin recopilación de datos · Código abierto", pt_BR: "Para Chrome e Edge · Sem coleta de dados · Código aberto", fr: "Pour Chrome et Edge · Aucune donnée collectée · Open source", de: "Für Chrome & Edge · Keine Datenerfassung · Open Source", it: "Per Chrome ed Edge · Nessun dato raccolto · Open source", ru: "Для Chrome и Edge · Данные не собираются · Открытый код", zh_CN: "支持 Chrome 与 Edge · 不收集数据 · 开源", zh_TW: "支援 Chrome 與 Edge · 不收集資料 · 開源", ko: "Chrome·Edge 지원 · 데이터 미수집 · 오픈소스" },
  };

  const tr = (k, l) => (T[k] ? (T[k][l] || T[k].en) : "");
  function resolveLang() {
    const s = localStorage.getItem("site_lang");
    if (s && LANGS.some(([c]) => c === s)) return s;
    const n = (navigator.language || "en").toLowerCase();
    if (n.startsWith("ja")) return "ja";
    if (n.startsWith("pt")) return "pt_BR";
    if (n.startsWith("ko")) return "ko";
    if (n.startsWith("zh")) return (n.includes("tw") || n.includes("hant") || n.includes("hk") || n.includes("mo")) ? "zh_TW" : "zh_CN";
    for (const [c] of LANGS) if (n.startsWith(c.split("_")[0])) return c;
    return "en";
  }
  function apply(l) {
    document.documentElement.lang = l.replace("_", "-");
    document.querySelectorAll("[data-i18n]").forEach((el) => { const v = tr(el.dataset.i18n, l); if (v) el.textContent = v; });
    document.querySelectorAll("[data-i18n-content]").forEach((el) => { const v = tr(el.dataset.i18nContent, l); if (v) el.setAttribute("content", v); });
  }
  function switcher(l) {
    const host = document.getElementById("lang-switcher"); if (!host) return;
    const g = document.createElement("div"); g.className = "input-group input-group-sm"; g.style.width = "auto";
    const ic = document.createElement("span"); ic.className = "input-group-text"; ic.innerHTML = '<i class="bi bi-translate"></i>';
    const sel = document.createElement("select"); sel.className = "form-select form-select-sm"; sel.style.maxWidth = "10rem";
    sel.setAttribute("aria-label", "Language / 言語"); sel.title = "Language / 言語";
    for (const [c, n] of LANGS) { const o = document.createElement("option"); o.value = c; o.textContent = n; if (c === l) o.selected = true; sel.appendChild(o); }
    sel.addEventListener("change", () => { localStorage.setItem("site_lang", sel.value); apply(sel.value); });
    g.appendChild(ic); g.appendChild(sel); host.appendChild(g);
  }
  const lang = resolveLang(); apply(lang); switcher(lang);
})();
