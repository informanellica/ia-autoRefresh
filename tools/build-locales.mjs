// Generates _locales/<lang>/messages.json for every language below.
// Edit the table, then run:  node tools/build-locales.mjs
// _locales/ is shipped in the extension (committed, not gitignored).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = "Auto Refresh"; // appName (brand, kept across locales)

// refreshingEvery uses placeholder $interval$.
const L = {
  en: {
    appDesc: "Automatically reload any tab at the interval you choose — per tab, with presets, a custom timer, and an at-a-glance badge.",
    settings: "Settings", toggleTheme: "Toggle light/dark theme",
    statusInactive: "Stopped", refreshingEvery: "Refreshing every $interval$",
    presetsLabel: "Presets", customLabel: "Custom:", optSeconds: "Seconds", optMinutes: "Minutes",
    unitSec: "s", unitMin: "m", unitHour: "h",
    start: "Start", stop: "Stop", back: "Back",
    editPresetsLabel: "Edit presets", addPreset: "+ Add preset",
    restartBehaviorLabel: "On restart", dontRemember: "Don't remember state (no auto-resume after restart)",
    save: "Save", delete: "Delete",
  },
  ja: {
    appDesc: "指定した間隔でタブを自動再読み込み。タブごとに設定でき、プリセット・カスタム間隔・ひと目で分かるバッジ付き。",
    settings: "設定", toggleTheme: "テーマ切替",
    statusInactive: "停止中", refreshingEvery: "$interval$ ごとに更新中",
    presetsLabel: "プリセット", customLabel: "カスタム:", optSeconds: "秒", optMinutes: "分",
    unitSec: "秒", unitMin: "分", unitHour: "時間",
    start: "開始", stop: "停止", back: "戻る",
    editPresetsLabel: "プリセット編集", addPreset: "＋ プリセットを追加",
    restartBehaviorLabel: "再起動時の動作", dontRemember: "状態を記憶しない（再起動後に自動再開しない）",
    save: "保存", delete: "削除",
  },
  es: {
    appDesc: "Recarga automáticamente cualquier pestaña en el intervalo que elijas: por pestaña, con preajustes, temporizador personalizado y una insignia a la vista.",
    settings: "Configuración", toggleTheme: "Cambiar tema claro/oscuro",
    statusInactive: "Detenido", refreshingEvery: "Actualizando cada $interval$",
    presetsLabel: "Preajustes", customLabel: "Personalizado:", optSeconds: "Segundos", optMinutes: "Minutos",
    unitSec: "s", unitMin: "min", unitHour: "h",
    start: "Iniciar", stop: "Detener", back: "Atrás",
    editPresetsLabel: "Editar preajustes", addPreset: "+ Añadir preajuste",
    restartBehaviorLabel: "Al reiniciar", dontRemember: "No recordar el estado (sin reanudar tras reiniciar)",
    save: "Guardar", delete: "Eliminar",
  },
  pt_BR: {
    appDesc: "Recarregue automaticamente qualquer aba no intervalo que você escolher — por aba, com predefinições, timer personalizado e um selo visível.",
    settings: "Configurações", toggleTheme: "Alternar tema claro/escuro",
    statusInactive: "Parado", refreshingEvery: "Atualizando a cada $interval$",
    presetsLabel: "Predefinições", customLabel: "Personalizado:", optSeconds: "Segundos", optMinutes: "Minutos",
    unitSec: "s", unitMin: "min", unitHour: "h",
    start: "Iniciar", stop: "Parar", back: "Voltar",
    editPresetsLabel: "Editar predefinições", addPreset: "+ Adicionar predefinição",
    restartBehaviorLabel: "Ao reiniciar", dontRemember: "Não lembrar o estado (sem retomar após reiniciar)",
    save: "Salvar", delete: "Excluir",
  },
  fr: {
    appDesc: "Rechargez automatiquement n'importe quel onglet à l'intervalle choisi — par onglet, avec préréglages, minuteur personnalisé et un badge visible.",
    settings: "Paramètres", toggleTheme: "Basculer thème clair/sombre",
    statusInactive: "Arrêté", refreshingEvery: "Actualisation toutes les $interval$",
    presetsLabel: "Préréglages", customLabel: "Personnalisé :", optSeconds: "Secondes", optMinutes: "Minutes",
    unitSec: "s", unitMin: "min", unitHour: "h",
    start: "Démarrer", stop: "Arrêter", back: "Retour",
    editPresetsLabel: "Modifier les préréglages", addPreset: "+ Ajouter un préréglage",
    restartBehaviorLabel: "Au redémarrage", dontRemember: "Ne pas mémoriser l'état (pas de reprise après redémarrage)",
    save: "Enregistrer", delete: "Supprimer",
  },
  de: {
    appDesc: "Lade jeden Tab automatisch im gewählten Intervall neu — pro Tab, mit Voreinstellungen, eigenem Timer und einem Badge auf einen Blick.",
    settings: "Einstellungen", toggleTheme: "Helles/dunkles Design umschalten",
    statusInactive: "Gestoppt", refreshingEvery: "Aktualisierung alle $interval$",
    presetsLabel: "Voreinstellungen", customLabel: "Benutzerdef.:", optSeconds: "Sekunden", optMinutes: "Minuten",
    unitSec: "s", unitMin: "m", unitHour: "h",
    start: "Start", stop: "Stopp", back: "Zurück",
    editPresetsLabel: "Voreinstellungen bearbeiten", addPreset: "+ Voreinstellung hinzufügen",
    restartBehaviorLabel: "Beim Neustart", dontRemember: "Status nicht merken (kein automatisches Fortsetzen nach Neustart)",
    save: "Speichern", delete: "Löschen",
  },
  it: {
    appDesc: "Ricarica automaticamente qualsiasi scheda all'intervallo scelto — per scheda, con preset, timer personalizzato e un badge a colpo d'occhio.",
    settings: "Impostazioni", toggleTheme: "Attiva/disattiva tema chiaro/scuro",
    statusInactive: "Fermato", refreshingEvery: "Aggiornamento ogni $interval$",
    presetsLabel: "Preset", customLabel: "Personalizzato:", optSeconds: "Secondi", optMinutes: "Minuti",
    unitSec: "s", unitMin: "min", unitHour: "h",
    start: "Avvia", stop: "Ferma", back: "Indietro",
    editPresetsLabel: "Modifica preset", addPreset: "+ Aggiungi preset",
    restartBehaviorLabel: "Al riavvio", dontRemember: "Non ricordare lo stato (nessuna ripresa dopo il riavvio)",
    save: "Salva", delete: "Elimina",
  },
  ru: {
    appDesc: "Автоматически перезагружайте любую вкладку с выбранным интервалом — для каждой вкладки, с пресетами, своим таймером и значком на кнопке.",
    settings: "Настройки", toggleTheme: "Светлая/тёмная тема",
    statusInactive: "Остановлено", refreshingEvery: "Обновление каждые $interval$",
    presetsLabel: "Пресеты", customLabel: "Свой:", optSeconds: "Секунды", optMinutes: "Минуты",
    unitSec: "с", unitMin: "м", unitHour: "ч",
    start: "Старт", stop: "Стоп", back: "Назад",
    editPresetsLabel: "Изменить пресеты", addPreset: "+ Добавить пресет",
    restartBehaviorLabel: "При перезапуске", dontRemember: "Не запоминать состояние (без автозапуска после перезапуска)",
    save: "Сохранить", delete: "Удалить",
  },
  zh_CN: {
    appDesc: "按所选间隔自动刷新任意标签页——逐标签设置，含预设、自定义计时器和一目了然的角标。",
    settings: "设置", toggleTheme: "切换浅色/深色主题",
    statusInactive: "已停止", refreshingEvery: "每 $interval$ 刷新一次",
    presetsLabel: "预设", customLabel: "自定义：", optSeconds: "秒", optMinutes: "分钟",
    unitSec: "秒", unitMin: "分", unitHour: "时",
    start: "开始", stop: "停止", back: "返回",
    editPresetsLabel: "编辑预设", addPreset: "＋ 添加预设",
    restartBehaviorLabel: "重启时", dontRemember: "不记忆状态（重启后不自动恢复）",
    save: "保存", delete: "删除",
  },
  zh_TW: {
    appDesc: "依所選間隔自動重新整理任意分頁——逐分頁設定，含預設、自訂計時器與一目了然的角標。",
    settings: "設定", toggleTheme: "切換淺色/深色主題",
    statusInactive: "已停止", refreshingEvery: "每 $interval$ 重新整理一次",
    presetsLabel: "預設", customLabel: "自訂：", optSeconds: "秒", optMinutes: "分鐘",
    unitSec: "秒", unitMin: "分", unitHour: "時",
    start: "開始", stop: "停止", back: "返回",
    editPresetsLabel: "編輯預設", addPreset: "＋ 新增預設",
    restartBehaviorLabel: "重新啟動時", dontRemember: "不記住狀態（重新啟動後不自動恢復）",
    save: "儲存", delete: "刪除",
  },
  ko: {
    appDesc: "원하는 간격으로 모든 탭을 자동 새로고침 — 탭별 설정, 프리셋, 사용자 지정 타이머, 한눈에 보이는 배지.",
    settings: "설정", toggleTheme: "밝은/어두운 테마 전환",
    statusInactive: "중지됨", refreshingEvery: "$interval$마다 새로고침 중",
    presetsLabel: "프리셋", customLabel: "사용자 지정:", optSeconds: "초", optMinutes: "분",
    unitSec: "초", unitMin: "분", unitHour: "시간",
    start: "시작", stop: "중지", back: "뒤로",
    editPresetsLabel: "프리셋 편집", addPreset: "＋ 프리셋 추가",
    restartBehaviorLabel: "재시작 시", dontRemember: "상태를 기억하지 않음(재시작 후 자동 재개 안 함)",
    save: "저장", delete: "삭제",
  },
};

for (const [lang, m] of Object.entries(L)) {
  const out = { appName: { message: BRAND } };
  for (const [k, v] of Object.entries(m)) {
    out[k] = { message: v };
    if (k === "refreshingEvery") out[k].placeholders = { interval: { content: "$1" } };
  }
  const dir = path.join(ROOT, "_locales", lang);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "messages.json"), JSON.stringify(out, null, 2) + "\n");
}
console.log("locales:", Object.keys(L).join(", "));
