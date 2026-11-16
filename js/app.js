// Запуск страницы: загрузка главного экрана, смена языка, нажатия. Обработчик нажатий один на страницу: CSP запрещает onclick в разметке.
import {askToCloseTicket, initConversation, refreshConversation} from './conversation.js?v=99f2eb87';
import {apiFetch, refusalText, setupTelegramWindow, state, telegramCall} from './core.js?v=99f2eb87';
import {formDone, initForm, pickCategory, pickFile, removeFile, startNewTicket, submitTicket, toggleCategoryList} from './form.js?v=99f2eb87';
import {clearHelpSearch, initHelp, openHelp} from './help.js?v=99f2eb87';
import {applyTranslations, setLanguage, t} from './i18n.js?v=99f2eb87';
import {initPulsar} from './motion.js?v=99f2eb87';
import {goBack, initScreens, redrawScreen} from './screens.js?v=99f2eb87';
import {clearSearch, initSearch, loadMoreTickets, loadTickets, markClosed, redrawCurrentList, refreshTickets, setFilter, updateTabCounts} from './tickets.js?v=99f2eb87';

// Telegram и вкладка могут сказать о возврате окна оба: одно обновление.
const RETURN_PAUSE_MS = 2000;
let lastReturn = 0;

function switchLanguage(lang) {
    setLanguage(lang);
    try {
        localStorage.setItem('metla_lang', lang);
    } catch (e) {
        console.error('Выбор языка не сохранён:', e);
    }
    applyTranslations();
    if (state.loadFailure) showLoadFailure();
    redrawCurrentList();
    redrawScreen();
}

// У блока загрузки постоянный перевод: смена языка затёрла бы ошибку словом «Загрузка…». Перевод снимаем, ошибку
// помним и показываем заново на новом языке. Сбой повторной загрузки блок не показывает: список остаётся на экране, «Помощь» и кнопка работают всегда.
function showLoadFailure() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.removeAttribute('data-i18n');
    loader.textContent = refusalText(state.loadFailure) || t('error_load');
    loader.classList.add('failed');
}

// Кнопка формы без действующей подписи: блок загрузки сразу говорит, что делать, и видим, даже если обновление списка прошло тихо.
function newTicketFromMain() {
    if (startNewTicket()) return;
    state.loadFailure = state.loadFailure || {status: 401};
    showLoadFailure();
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    loader.scrollIntoView({block: 'nearest'});
}

// Нет обращений — нет и блока «Мои обращения» (и запроса списка): на экране только «Помощь» и кнопка.
// quiet — обновление уже показанного: создано, закрыто, окно вернули.
async function loadData(quiet = false) {
    try {
        const statsData = await apiFetch(`/stats`);
        state.loadFailure = null;

        updateTabCounts(statsData);

        const hasTickets = (statsData.total || 0) > 0;
        if (hasTickets) await (quiet ? refreshTickets() : loadTickets(1, false));

        document.getElementById('loader').classList.add('hidden');
        document.getElementById('content').classList.toggle('hidden', !hasTickets);
    } catch (error) {
        console.error('Ошибка loadData:', error);
        state.loadFailure = error;
        showLoadFailure();
    }
}

// Экраны в памяти, адрес окна не трогаем: в нём подпись входа. Вернули окно — обновляем список и открытую переписку, черновик цел (Б18).
function windowReturned() {
    const now = Date.now();
    if (now - lastReturn < RETURN_PAUSE_MS) return;
    lastReturn = now;
    loadData(true);
    refreshConversation();
}

const ACTIONS = {
    lang: el => switchLanguage(el.dataset.lang),
    'help-open': openHelp,
    'help-search-clear': clearHelpSearch,
    back: goBack,
    'search-clear': clearSearch,
    filter: el => setFilter(el.dataset.status),
    'load-more': loadMoreTickets,
    'ticket-new': newTicketFromMain,
    'ticket-close': askToCloseTicket,
    'form-done': formDone,
    'category-toggle': toggleCategoryList,
    'category-pick': pickCategory,
    'file-pick': pickFile,
    'file-remove': removeFile,
    submit: submitTicket,
};

// Второе нажатие двойного попало бы уже в новый экран: открыло бы тему справки или выбор файла. Страница его не видит.
document.addEventListener('click', event => {
    if (event.detail > 1) {
        event.stopPropagation();
        event.preventDefault();
    }
}, true);

document.addEventListener('click', event => {
    const element = event.target && event.target.closest('[data-action]');
    if (element) ACTIONS[element.dataset.action](element);
});

function start() {
    state.reload = () => loadData(true);
    state.ticketClosed = markClosed;
    window.metlaBoot.whenScript('telegramScript', () => {
        setupTelegramWindow();
        telegramCall('8.0', app => app.onEvent('activated', windowReturned));
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') windowReturned();
    });
    applyTranslations();
    initPulsar();
    initForm();
    initSearch();
    initHelp();
    initConversation();
    initScreens();
    loadData();
    window.metlaBoot.started();
}

// Модуль добавил boot.js: он может выполниться и до конца разбора страницы (медленная связь), и после: тогда DOMContentLoaded уже не придёт.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
