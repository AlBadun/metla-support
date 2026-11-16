// Новое обращение: категория, текст, файл, отправка. Черновик живёт в полях экрана: «Назад» и смена языка его не трогают; в память устройства не пишем: это данные человека.
import {apiFetch, refusalKey, state, telegramApp, telegramCall, telegramInitData, vibrate} from './core.js?v=99f2eb87';
import {t} from './i18n.js?v=99f2eb87';
import {drawOnShow, leaveScreens, openScreen, replaceScreens, screenIsOpen} from './screens.js?v=99f2eb87';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TEXT_LENGTH = 4000; // как на сервере (api/routes/tickets.py бота, Д-181, этап 1)

let selectedFile = null;
let closingAsks = false;
let createdNumber = null;
// Может ли бот писать человеку: 'allowed', 'refused', 'asking' или null — ещё не знаем. Спрашиваем один раз за окно, итог помним (Б11).
let writeAccess = null;

const textField = () => document.getElementById('ticketMessage');

function showFormError(key) {
    const line = document.getElementById('formError');
    line.setAttribute('data-i18n', key);
    line.textContent = t(key);
    line.classList.remove('hidden');
    vibrate('error');
    if (!screenIsOpen('formScreen')) return;
    // Клавиатура не должна закрывать строку: прячем её и показываем строку (Б16).
    if (!telegramCall('9.1', app => app.hideKeyboard()) && document.activeElement) document.activeElement.blur();
    line.scrollIntoView({block: 'center'});
}

function clearFormError() {
    const line = document.getElementById('formError');
    line.removeAttribute('data-i18n');
    line.textContent = '';
    line.classList.add('hidden');
}

// Есть что потерять — закрытие окна спрашивает (Б5). Файл Telegram мог прийти позже: вызова не было — повторим.
function syncClosingQuestion() {
    const asks = Boolean(textField().value.trim() || selectedFile);
    if (asks === closingAsks) return;
    if (telegramCall('6.2', app => (asks ? app.enableClosingConfirmation() : app.disableClosingConfirmation()))) closingAsks = asks;
}

function setCategoryList(open) {
    document.getElementById('categoryOptions').classList.toggle('hidden', !open);
    const trigger = document.getElementById('categoryTrigger');
    trigger.classList.toggle('active', open);
    trigger.setAttribute('aria-expanded', String(open));
}

export function toggleCategoryList() {
    setCategoryList(document.getElementById('categoryOptions').classList.contains('hidden'));
}

export function pickCategory(option) {
    const value = option.dataset.value;
    document.querySelectorAll('.custom-select-option').forEach(item => {
        const chosen = item === option;
        item.classList.toggle('selected', chosen);
        item.setAttribute('aria-selected', String(chosen));
    });
    document.getElementById('categoryTrigger').dataset.value = value;
    const shown = document.getElementById('categoryValue');
    shown.setAttribute('data-i18n', `cat_${value}`);
    shown.textContent = t(`cat_${value}`);
}

function handleFileSelect(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
        input.value = '';
        showFormError('error_file_too_large');
        return;
    }
    clearFormError();
    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('filePreview').classList.remove('hidden');
    syncClosingQuestion();
}

export function pickFile() {
    document.getElementById('fileInput').click();
}

export function removeFile() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreview').classList.add('hidden');
    syncClosingQuestion();
}

function eraseDraft() {
    textField().value = '';
    removeFile();
    clearFormError();
    pickCategory(document.querySelector('.custom-select-option[data-value="question"]'));
}

// Без действующей подписи форма получит отказ только после набора текста: сразу говорим, что делать. Что сказать и где — у места вызова.
export function startNewTicket() {
    if (!telegramInitData() || (state.loadFailure && state.loadFailure.status === 401)) {
        vibrate('error');
        return false;
    }
    setCategoryList(false);
    openScreen('formScreen');
    return true;
}

// Пока идёт отправка, форма показывает это и на новом языке, и после возврата; второй запуск и правки запрещены (Д12).
function setSending(value) {
    document.getElementById('newTicketForm').disabled = value;
    const button = document.getElementById('submitBtn');
    const key = value ? 'creating' : 'btn_create_ticket';
    button.setAttribute('data-i18n', key);
    button.textContent = t(key);
}

function ticketCreated(ticketId) {
    eraseDraft();
    vibrate('success');
    state.reload();
    if (!screenIsOpen('formScreen')) return;
    createdNumber = ticketId;
    askWriteAccess();
    replaceScreens('createdScreen');
}

// Слова экрана создания говорят только то, что будет на самом деле: в чат ответ придёт, если бот может писать; здесь он появится всегда.
function drawCreated() {
    document.getElementById('createdNumber').textContent = `${t('created_number')} #${createdNumber}`;
    const key = {allowed: 'created_chat', asking: 'created_ask'}[writeAccess] || 'created_here';
    document.getElementById('createdText').textContent = t(key);
}

function askWriteAccess() {
    if (writeAccess) return;
    const app = telegramApp();
    const user = app && app.initDataUnsafe && app.initDataUnsafe.user;
    if (user && user.allows_write_to_pm) {
        writeAccess = 'allowed';
        return;
    }
    writeAccess = 'asking';
    const asked = telegramCall('6.9', telegram => telegram.requestWriteAccess(allowed => {
        writeAccess = allowed ? 'allowed' : 'refused';
        if (screenIsOpen('createdScreen')) drawCreated();
    }));
    if (!asked) writeAccess = 'refused';
}

export async function submitTicket() {
    const text = textField().value.trim();
    if (!text && !selectedFile) {
        showFormError('alert_no_description');
        return;
    }
    // Тот же предел, что на сервере: 4000 единиц UTF-16 (length в JavaScript считает так же).
    if (text.length > MAX_TEXT_LENGTH) {
        showFormError('refuse_text_too_long');
        return;
    }
    clearFormError();
    setSending(true);
    vibrate('light');

    const body = new FormData();
    body.append('category', document.getElementById('categoryTrigger').dataset.value);
    body.append('message_text', text);
    if (selectedFile) body.append('file', selectedFile);

    try {
        const data = await apiFetch('/ticket/create', {method: 'POST', body});
        setSending(false);
        if (data.success) ticketCreated(data.ticket_id);
        else showFormError('error_creating');
    } catch (error) {
        console.error('Ошибка создания обращения:', error);
        setSending(false);
        showFormError(refusalKey(error) || 'error_creating');
    }
}

export function formDone() {
    leaveScreens();
}

export function initForm() {
    textField().addEventListener('input', () => {
        clearFormError();
        syncClosingQuestion();
    });
    document.getElementById('fileInput').addEventListener('change', event => handleFileSelect(event.target));
    window.metlaBoot.whenScript('telegramScript', syncClosingQuestion);
    drawOnShow('createdScreen', drawCreated);
    // Нажатие мимо закрывает список категорий; само нажатие на поле открывает его, это решает data-action.
    document.addEventListener('click', event => {
        if (!event.target.closest('#categoryTrigger')) setCategoryList(false);
    });
}
