// Экран обращения: переписка и закрытие. Текст с сервера — только как текст: узлы и textContent.
import {apiFetch, element, lastRequest, messageLabel, messageText, refusalKey, refusalText, state, statusKey, telegramCall, telegramHas, vibrate} from './core.js';
import {currentLang, t} from './i18n.js';
import {drawOnShow, goBack, openScreen, screenIsOpen, setScreenTitle} from './screens.js';

// Бот считает закрытыми оба состояния (CLOSED_STATUSES): кнопки у них нет (Е4).
const FINISHED = ['resolved', 'closed'];

// Номер открытого обращения: раньше он читался из заголовка окна, и смена слова там ломала закрытие.
let openedTicketId = null;
let shown = null;
let failure = null;
let closing = false;

// Файл без подписи бота — пишем сами: человек видит, что к сообщению что-то приложено.
function messageWords(message) {
    const text = messageText(message.message_text);
    if (!text) return t('msg_file');
    return message.file_id && !messageLabel(message.message_text) ? `${t('msg_file')}\n${text}` : text;
}

function messageNode(message) {
    const box = element('div', `message ${message.sender_type === 'user' ? 'message-user' : 'message-admin'}`);
    const time = new Date(message.timestamp * 1000).toLocaleString(currentLang === 'ru' ? 'ru-RU' : 'en-US');
    box.append(element('div', 'message-text', messageWords(message)), element('div', 'message-time', time));
    return box;
}

function drawConversation() {
    const conversation = document.getElementById('ticketConversation');
    const status = document.getElementById('ticketStatus');
    const button = document.getElementById('closeTicketBtn');
    status.replaceChildren();
    if (shown) {
        const key = statusKey(shown.status);
        status.append(element('span', `status-chip status-${key}`, t(`status_${key}`)));
    }
    button.classList.toggle('hidden', !shown || FINISHED.includes(shown.status));
    if (failure) {
        conversation.replaceChildren(element('div', 'no-messages', refusalText(failure) || t('error_loading_messages')));
    } else if (!shown) {
        conversation.replaceChildren(element('div', 'loader', t('loading_messages')));
    } else if (!shown.messages || !shown.messages.length) {
        conversation.replaceChildren(element('div', 'no-messages', t('no_messages')));
    } else {
        conversation.replaceChildren(...shown.messages.map(messageNode));
    }
}

function clearCloseError() {
    const line = document.getElementById('ticketError');
    line.removeAttribute('data-i18n');
    line.textContent = '';
    line.classList.add('hidden');
}

function showCloseError(key) {
    const line = document.getElementById('ticketError');
    line.setAttribute('data-i18n', key);
    line.textContent = t(key);
    line.classList.remove('hidden');
    vibrate('error');
    if (screenIsOpen('ticketScreen')) line.scrollIntoView({block: 'nearest'});
}

async function fetchConversation(run) {
    const data = await apiFetch(`/ticket/${openedTicketId}/messages`);
    if (run !== lastRequest.conversation) return;
    shown = data;
    failure = null;
    drawConversation();
}

export async function openTicket(ticketId) {
    const run = ++lastRequest.conversation;
    openedTicketId = ticketId;
    shown = null;
    failure = null;
    clearCloseError();
    openScreen('ticketScreen');
    try {
        await fetchConversation(run);
    } catch (error) {
        console.error('Ошибка загрузки переписки:', error);
        if (run !== lastRequest.conversation) return;
        failure = error;
        drawConversation();
    }
}

// Окно вернули — открытая переписка обновляется тихо: сбой оставляет на экране то, что было (Б18).
// Показать ещё нечего (первую загрузку вытеснило это обновление) — слова о сбое, а не вечная загрузка.
export async function refreshConversation() {
    if (!screenIsOpen('ticketScreen')) return;
    const run = ++lastRequest.conversation;
    try {
        await fetchConversation(run);
    } catch (error) {
        console.error('Переписка не обновилась:', error);
        if (run === lastRequest.conversation && !shown) {
            failure = error;
            drawConversation();
        }
    }
}

async function closeTicket(ticketId) {
    closing = true;
    document.getElementById('closeTicketBtn').disabled = true;
    clearCloseError();
    try {
        const response = await apiFetch(`/ticket/${ticketId}/close`, {method: 'PUT'});
        if (!response.success) throw new Error('Обращение не закрылось');
        vibrate('success');
        state.reload();
        // Человек мог уйти с экрана, пока шёл запрос: тогда он никуда не перескакивает.
        if (screenIsOpen('ticketScreen') && openedTicketId === ticketId) goBack();
    } catch (error) {
        console.error('Ошибка закрытия обращения:', error);
        // Человек мог уже открыть другое обращение: чужой сбой на его экране читался бы как его собственный.
        if (openedTicketId === ticketId) showCloseError(refusalKey(error) || 'error_closing');
        else vibrate('error');
        refreshConversation();
    } finally {
        closing = false;
        document.getElementById('closeTicketBtn').disabled = false;
    }
}

// Спрашивает окно Telegram; метода нет — обычный вопрос браузера (Б6). Окно уже открыто — повторное нажатие просто ничего не делает.
export function askToCloseTicket() {
    if (closing) return;
    const ticketId = openedTicketId;
    const title = `${t('btn_close_ticket')} #${ticketId}?`;
    const message = t('close_explain');
    if (telegramHas('6.2')) {
        telegramCall('6.2', app => app.showPopup({title, message, buttons: [
            {id: 'keep', type: 'default', text: t('btn_cancel')},
            {id: 'close', type: 'destructive', text: t('btn_close')},
        ]}, answer => {
            if (answer === 'close') closeTicket(ticketId);
        }));
    } else if (window.confirm(`${title}\n\n${message}`)) {
        closeTicket(ticketId);
    }
}

export function initConversation() {
    drawOnShow('ticketScreen', () => {
        setScreenTitle(`${t('ticket')} #${openedTicketId}`);
        drawConversation();
    });
}
