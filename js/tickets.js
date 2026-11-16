// Список обращений: вкладки, поиск, «Показать ещё». Текст с сервера — только как текст: узлы и textContent.
import {apiFetch, categoryLabel, element, lastRequest, messageText, refusalKey, refusalText, statusKey} from './core.js?v=99f2eb87';
import {openTicket} from './conversation.js?v=99f2eb87';
import {currentLang, t} from './i18n.js?v=99f2eb87';

const PAGE_SIZE = 10;
const MAX_LIMIT = 50; // как на сервере (MAX_TICKETS_LIMIT)
const SEARCH_MIN_LENGTH = 2;

// Что сейчас в списке: смена языка рисует это заново, без запроса к серверу.
let redrawList = null;
let shownTickets = [];
let currentPage = 1;
let isLoadingTickets = false;
let currentStatusFilter = 'all';
let searchTimeout = null;

const listBox = () => document.getElementById('tickets-list');
const moreButton = () => document.getElementById('loadMoreBtn');

function showInList(draw) {
    redrawList = draw;
    draw();
}

export function redrawCurrentList() {
    if (redrawList) redrawList();
}

function showNote(className, words) {
    showInList(() => listBox().replaceChildren(element('div', className, words())));
}

export function updateTabCounts(data) {
    document.getElementById('count-all').textContent = data.total || 0;
    document.getElementById('count-open').textContent = data.open || 0;
    document.getElementById('count-in_progress').textContent = data.in_progress || 0;
    document.getElementById('count-resolved').textContent = data.resolved || 0;
    document.getElementById('count-closed').textContent = data.closed || 0;
}

function shiftCount(status, delta) {
    const box = document.getElementById(`count-${status}`);
    box.textContent = Math.max(0, (parseInt(box.textContent, 10) || 0) + delta);
}

// Обращение закрыто со страницы: карточка и счётчики меняются сразу, не дожидаясь обновления с сервера (живая проверка 16.11.2026,
// #80: пока шло обновление, список ещё показывал «Открыто»). Во вкладке, где закрытому не место, карточка уходит. Обновление с
// сервера потом рисует то, что в базе.
export function markClosed(ticketId) {
    const index = shownTickets.findIndex(ticket => ticket.id === ticketId);
    if (index < 0) return;
    const ticket = shownTickets[index];
    if (ticket.status !== 'closed') {
        shiftCount(statusKey(ticket.status), -1);
        shiftCount('closed', 1);
    }
    const searching = document.getElementById('statusTabs').classList.contains('hidden');
    if (!searching && !['all', 'closed'].includes(currentStatusFilter)) shownTickets.splice(index, 1);
    else ticket.status = 'closed';
    redrawCurrentList();
}

function markTab(status) {
    document.querySelectorAll('#statusTabs .status-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.status === status));
}

export function setFilter(status) {
    currentStatusFilter = status;
    currentPage = 1;
    markTab(status);
    redrawList = null;
    listBox().replaceChildren();
    loadTickets(1, false);
}

function clearMoreError() {
    const line = document.getElementById('moreError');
    line.removeAttribute('data-i18n');
    line.textContent = '';
    line.classList.add('hidden');
}

function drawMoreButton(hasMore) {
    const button = moreButton();
    button.classList.toggle('hidden', !hasMore);
    button.disabled = false;
    button.setAttribute('data-i18n', 'btn_load_more');
    button.textContent = t('btn_load_more');
}

function ticketCard(ticket) {
    const status = statusKey(ticket.status);
    const date = new Date(ticket.created_at * 1000).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US');
    const card = element('button', 'ticket-item');
    card.type = 'button';
    card.onclick = () => openTicket(ticket.id);
    const info = element('span', 'ticket-info');
    info.append(element('span', 'ticket-title', `${t('ticket')} #${ticket.id}`), element('span', 'ticket-meta', `${categoryLabel(ticket.category)} • ${date}`));
    if (ticket.message_text) info.append(element('span', 'ticket-extra', messageText(ticket.message_text)));
    card.append(info, element('span', `status-chip status-${status}`, t(`status_${status}`)));
    return card;
}

function drawTickets(tickets) {
    showInList(() => {
        if (tickets.length) listBox().replaceChildren(...tickets.map(ticketCard));
        else listBox().replaceChildren(element('div', 'list-note', t('no_tickets')));
    });
}

// quiet — обновление того, что уже на экране: список не мигает, прежний объём сохраняется, сбой оставляет прежнее (Б18).
export async function loadTickets(page, append = false, quiet = false) {
    // «Показать ещё» ждёт идущий запрос; новый список (фильтр, очистка поиска) не ждёт: ответ прежнего уже не нужен.
    if (append && isLoadingTickets) return;
    isLoadingTickets = true;
    const run = append ? lastRequest.list : ++lastRequest.list;
    clearMoreError();
    const button = moreButton();
    if (append) {
        button.setAttribute('data-i18n', 'loading_more');
        button.textContent = t('loading_more');
        button.disabled = true;
    } else if (!quiet) {
        button.classList.add('hidden');
    }
    const limit = quiet ? Math.min(currentPage * PAGE_SIZE, MAX_LIMIT) : PAGE_SIZE;
    const statusParam = currentStatusFilter === 'all' ? '' : `&status=${currentStatusFilter}`;
    try {
        const data = await apiFetch(`/tickets?page=${page}&limit=${limit}${statusParam}`);
        if (run !== lastRequest.list) return;
        const tickets = data.tickets || [];
        shownTickets = append ? shownTickets.concat(tickets) : tickets;
        drawTickets(shownTickets);
        // Обновление показало не больше MAX_LIMIT: следующая страница идёт сразу за показанным, без пропуска.
        currentPage = quiet ? limit / PAGE_SIZE : page;
        drawMoreButton(data.has_more);
    } catch (error) {
        console.error('Ошибка загрузки обращений:', error);
        if (run !== lastRequest.list) return;
        if (append) {
            drawMoreButton(true);
            const line = document.getElementById('moreError');
            const key = refusalKey(error) || 'error_load';
            line.setAttribute('data-i18n', key);
            line.textContent = t(key);
            line.classList.remove('hidden');
        } else if (!quiet) {
            showNote('no-messages', () => refusalText(error) || t('error_load'));
        } else if (button.disabled) {
            // Это обновление вытеснило «Показать ещё», ответ того запроса уже не нужен: кнопка снова работает.
            drawMoreButton(true);
        }
    } finally {
        isLoadingTickets = false;
    }
}

export function loadMoreTickets() {
    loadTickets(currentPage + 1, true);
}

async function performSearch(query, quiet = false) {
    const run = ++lastRequest.list;
    document.getElementById('statusTabs').classList.add('hidden');
    moreButton().classList.add('hidden');
    clearMoreError();
    if (!quiet) showNote('loader', () => t('loading_more'));
    try {
        const data = await apiFetch(`/tickets/search?query=${encodeURIComponent(query)}`);
        if (run !== lastRequest.list) return;
        if (data.tickets.length) {
            shownTickets = data.tickets;
            drawTickets(shownTickets);
        } else {
            showNote('list-note', () => t('no_search_results'));
        }
    } catch (error) {
        console.error('Ошибка поиска:', error);
        // Тихий сбой оставляет то, что на экране; только вечную загрузку заменяет словами.
        if (run !== lastRequest.list || (quiet && !listBox().querySelector('.loader'))) return;
        showNote('list-note failed', () => refusalText(error) || t('error_search'));
    }
}

// Создано, закрыто, окно вернули: обновляется то, что на экране, и в поиске — тоже поиск.
export function refreshTickets() {
    const query = document.getElementById('searchInput').value.trim();
    return query.length >= SEARCH_MIN_LENGTH ? performSearch(query, true) : loadTickets(1, false, Boolean(redrawList));
}

export function initSearch() {
    document.getElementById('searchInput').addEventListener('input', event => {
        const query = event.target.value.trim();
        document.getElementById('clearSearchBtn').classList.toggle('hidden', !query);
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (query.length >= SEARCH_MIN_LENGTH) performSearch(query);
            else if (!query) clearSearch();
        }, 400);
    });
}

export function clearSearch() {
    clearTimeout(searchTimeout);
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    document.getElementById('statusTabs').classList.remove('hidden');
    currentStatusFilter = 'all';
    currentPage = 1;
    markTab('all');
    loadTickets(1, false);
}
