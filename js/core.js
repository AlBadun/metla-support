// Общее для всех экранов: окно Telegram, запросы к серверу, текст с сервера — только как текст.
import {t, translations} from './i18n.js?v=99f2eb87';

// Chrome 61–85: модули есть, replaceChildren нет (необновляемый WebView на старых телефонах). Без него список и переписка не рисуются.
if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function (...nodes) {
        this.textContent = '';
        this.append(...nodes);
    };
}

// Что знают несколько экранов. reload — повторная загрузка главного экрана, ticketClosed — список сразу после закрытия (app.js).
export const state = {loadFailure: null, reload: null, ticketClosed: null};

// Номер последнего запроса: поздний ответ прежнего не рисуем, на экране уже другое (зависший запрос отменяется только через 30 с).
export const lastRequest = { list: 0, conversation: 0 };

// Файл Telegram бывает недоступен (сеть, блокировка) или старый клиент не знает нового вызова. Подпись входа и язык есть и
// в адресе окна (tgWebAppData): страница работает и без файла, а без подписи честно скажет, как открыть её заново.
export function telegramApp() {
    return (window.Telegram && window.Telegram.WebApp) || null;
}

export function telegramInitData() {
    const app = telegramApp();
    return (app && app.initData) || window.metlaBoot.launchParam('tgWebAppData');
}

// Одна дверь для вызовов Telegram: файла может не быть, старый клиент метода не знает, сам вызов может бросить (Б15).
export function telegramHas(version) {
    const app = telegramApp();
    try {
        return Boolean(app && app.isVersionAtLeast(version));
    } catch (e) {
        return false;
    }
}

// false — вызова не было: у места вызова может быть запасной путь.
export function telegramCall(version, action) {
    if (!telegramHas(version)) return false;
    try {
        action(telegramApp());
        return true;
    } catch (e) {
        console.error('Вызов Telegram не прошёл:', e);
        return false;
    }
}

// Лёгкая — на главные действия; success и error — на итог. Метода нет — ничего (Б8).
export function vibrate(kind) {
    telegramCall('6.1', app => {
        if (kind === 'light') app.HapticFeedback.impactOccurred('light');
        else app.HapticFeedback.notificationOccurred(kind);
    });
}

export function setupTelegramWindow() {
    telegramCall('6.0', app => {
        app.ready();
        app.expand();
    });
    telegramCall('6.1', app => app.setBackgroundColor('#0B0D17'));
    // До 6.9 шапка принимает только ключи цвета: наш цвет там бросает.
    telegramCall('6.9', app => app.setHeaderColor('#0B0D17'));
    telegramCall('7.10', app => app.setBottomBarColor('#0B0D17'));
}

const BASE_API = 'https://metlasupportbot-production.up.railway.app/api';
const READ_TIMEOUT_MS = 30000;

export async function apiFetch(endpoint, options = {}) {
    const headers = options.headers || {};
    const initData = options.noSignature ? '' : telegramInitData();
    if (initData) {
        headers['X-Telegram-Init-Data'] = initData;
    }

    // Чтение не висит без конца: человек увидит понятный текст, а не вечную загрузку. Отправка файла идёт сколько идёт.
    const controller = new AbortController();
    const timer = options.method ? null : setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
    try {
        const response = await fetch(`${BASE_API}${endpoint}`, { ...options, headers, signal: controller.signal });
        if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(`Network error: ${response.status} - ${errorText}`);
            // Код отказа сервера (пределы обращений, длина текста, размер файла) — для понятного текста человеку.
            error.status = response.status;
            try { error.code = JSON.parse(errorText).code; } catch (e) { error.code = null; }
            throw error;
        }
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

// Данные с сервера — только как текст: узел и textContent, разметкой они не становятся (М-10, А13).
export function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// Что бот пишет в базу вместо подписи вложения: на том языке, что был у него, со значком. На экране — на языке окна и без значка, база не меняется (№8, М-11). В поиске — тоже.
// services/translations.py (screenshot, attachment_*, attachment, photo_reply, auto_response_saved, file_not_delivered); message_handlers.py и api/routes/tickets.py: «📎 Файл».
// «📎 Файл не дошёл» — файл из мини-приложения не принял Telegram нигде (Д-181, этап 4, Л2): с текстом — первой строкой, без — одна.
const SAVED_LABELS = {
    '📎 Файл': 'msg_file',
    '📎 Файл не дошёл': 'msg_file_failed', '📎 File not delivered': 'msg_file_failed',
    '📷 Скриншот': 'msg_screenshot', '📷 Screenshot': 'msg_screenshot',
    '🎬 Видео': 'msg_video', '🎬 Video': 'msg_video',
    '🎤 Голосовое сообщение': 'msg_voice', '🎤 Voice message': 'msg_voice',
    '⭕ Видеосообщение': 'msg_video_note', '⭕ Video message': 'msg_video_note',
    '🎵 Аудио': 'msg_audio', '🎵 Audio': 'msg_audio',
    '🎞 GIF': 'msg_animation',
    'вложение': 'msg_attachment', 'attachment': 'msg_attachment',
    '[Фото]': 'msg_photo', '[Photo]': 'msg_photo',
    '[Автоматический ответ]': 'msg_auto', '[Automatic answer]': 'msg_auto',
};
const FILE_WITH_NAME = '📎 Файл: ';

export function messageLabel(text) {
    const first = String(text || '').split('\n')[0];
    return first.startsWith(FILE_WITH_NAME) ? 'msg_file' : SAVED_LABELS[first] || null;
}

export function messageText(text) {
    if (text === 'Ticket closed by user') return t('msg_closed_by_user');
    const key = messageLabel(text);
    if (!key) return text;
    const [first, ...rest] = text.split('\n');
    const label = first.startsWith(FILE_WITH_NAME) ? `${t(key)}: ${first.slice(FILE_WITH_NAME.length)}` : t(key);
    return [label, ...rest].join('\n');
}

// Категория человеку — словом, а не кодом (М-11). t() на незнакомый ключ отдаёт сам ключ, поэтому проверка — по словарю: в
// старых строках базы бывает что угодно, на экран это не идёт.
export function categoryLabel(code) {
    if (!code || code === 'General' || code === 'Общий') return t('cat_general');
    return translations.en['cat_' + code] ? t('cat_' + code) : t('cat_other');
}

// Состояние идёт и в class="…": только из четырёх известных, а не как прислано.
export function statusKey(status) {
    return ['open', 'in_progress', 'resolved', 'closed'].includes(status) ? status : 'open';
}

// Понятный отказ вместо сырой ошибки: устаревший вход (401 — подпись старше суток или страница не из Telegram),
// 3 открытых, 5 за сутки, длинный текст, большой файл. Остальное — null: у места вызова свой общий текст.
export function refusalKey(error) {
    if (!error) return null;
    if (error.status === 401) return 'refuse_auth';
    const keys = {
        open_limit: 'refuse_open_limit',
        daily_limit: 'refuse_daily_limit',
        text_too_long: 'refuse_text_too_long',
        too_large: 'error_file_too_large',
        file_type: 'refuse_file_type'
    };
    return keys[error.code] || null;
}

export function refusalText(error) {
    const key = refusalKey(error);
    return key ? t(key) : null;
}
