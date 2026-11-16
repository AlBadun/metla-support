// Справка: один источник с ботом, GET /api/help (services/help_content.py бота). Подпись ей не нужна: открывается и в окне старше суток, и вне Telegram.
// Отдельный экран вместо окна: темы → вопросы → ответ, «Назад» проходит тот же путь. Поиск — по уже полученному ответу сервера, запросов не делает.
import {apiFetch} from './core.js';
import {currentLang, t} from './i18n.js';
import {startNewTicket} from './form.js';
import {drawOnShow, openScreen, pushScreen} from './screens.js';

// Текст только как текст: узлы и textContent, разметки из данных здесь нет.
const helpLoaded = {};
let helpScreen = {};
let lastHelpRequest = 0;

const SEARCH_MIN_LENGTH = 2;

function helpRow(label, action, strong) {
    const button = document.createElement('button');
    button.className = strong ? 'help-row strong' : 'help-row';
    button.textContent = label;
    button.onclick = action;
    return button;
}

function helpContactButton(label) {
    const button = document.createElement('button');
    button.className = 'action-btn help-contact';
    button.textContent = label;
    button.onclick = () => {
        if (startNewTicket()) return;
        const note = document.getElementById('helpNote');
        note.classList.remove('hidden');
        note.scrollIntoView({block: 'nearest'});
    };
    return button;
}

function helpHeading(words) {
    const heading = document.createElement('p');
    heading.className = 'help-heading';
    heading.textContent = words;
    return heading;
}

function fillHelp(body, ...nodes) {
    body.textContent = '';
    nodes.forEach(node => body.appendChild(node));
}

function searchBox() {
    return document.getElementById('helpSearchBox');
}

function searchWord() {
    return document.getElementById('helpSearch').value.trim();
}

// Без регистра, е и ё — одно: человек ищет «ещё» и «еще» одинаково. Все слова запроса, в любом порядке.
function plain(text) {
    return String(text).toLowerCase().replace(/ё/g, 'е');
}

function findAnswers(help, word) {
    const words = plain(word).split(/\s+/);
    const found = [];
    help.topics.forEach(topic => topic.questions.forEach(question => {
        const text = plain(`${question.question} ${question.answer}`);
        if (words.every(item => text.includes(item))) found.push({topic, question});
    }));
    return found;
}

function questionRow(topic, question) {
    return helpRow(question.question, () => moveHelp({topic: topic.id, question: question.id}));
}

function drawHelp(help) {
    const body = document.getElementById('helpBody');
    if (!body) return;
    const topic = help.topics.find(item => item.id === helpScreen.topic);
    const question = topic && topic.questions.find(item => item.id === helpScreen.question);
    let nodes;
    if (question) {
        const answer = document.createElement('div');
        answer.className = 'faq-item';
        const title = document.createElement('h3');
        title.textContent = question.question;
        const text = document.createElement('p');
        text.textContent = question.answer;
        answer.appendChild(title);
        answer.appendChild(text);
        nodes = [answer, helpContactButton(help.words.not_helped)];
    } else if (topic) {
        nodes = [helpHeading(topic.title), ...topic.questions.map(item => questionRow(topic, item))];
    } else if (searchWord().length >= SEARCH_MIN_LENGTH) {
        const found = findAnswers(help, searchWord());
        nodes = found.length
            ? [...found.map(item => questionRow(item.topic, item.question)), helpContactButton(help.words.contact)]
            : [helpHeading(t('no_search_results')), helpContactButton(help.words.contact)];
    } else {
        nodes = [helpHeading(help.words.title), ...help.topics.map(item => helpRow(item.title, () => moveHelp({topic: item.id}), true)), helpContactButton(help.words.contact)];
    }
    fillHelp(body, ...nodes);
    searchBox().classList.toggle('hidden', Boolean(helpScreen.topic));
    document.getElementById('helpSearchClear').classList.toggle('hidden', !document.getElementById('helpSearch').value);
}

function showHelpFailure() {
    const body = document.getElementById('helpBody');
    if (!body) return;
    const note = helpHeading(t('help_load_error'));
    note.classList.add('help-failure');
    fillHelp(body, note, helpContactButton(t('help_contact')));
    searchBox().classList.add('hidden');
}

// На новом языке — тот же экран: номера тем и ответов не зависят от языка, слово в поле поиска остаётся. Поздний ответ не затирает новый: смотрит номер запроса.
async function showHelp() {
    const body = document.getElementById('helpBody');
    if (!body) return;
    const lang = currentLang;
    const run = ++lastHelpRequest;
    if (!helpLoaded[lang]) {
        searchBox().classList.add('hidden');
        fillHelp(body, helpHeading(t('loading_more')));
        try {
            const help = await apiFetch(`/help?lang=${lang}`, {noSignature: true});
            if (!help || !Array.isArray(help.topics) || !help.topics.length) throw new Error('Справка пришла неполной');
            helpLoaded[lang] = help;
        } catch (error) {
            console.error('Ошибка загрузки справки:', error);
            if (run === lastHelpRequest) showHelpFailure();
            return;
        }
        if (run !== lastHelpRequest) return;
    }
    try {
        drawHelp(helpLoaded[lang]);
    } catch (error) {
        console.error('Справка пришла неполной:', error);
        delete helpLoaded[lang];
        showHelpFailure();
    }
}

function hideNote() {
    document.getElementById('helpNote').classList.add('hidden');
}

function moveHelp(screen) {
    const previous = helpScreen;
    pushScreen(() => {
        helpScreen = previous;
        hideNote();
        showHelp();
    });
    helpScreen = screen;
    hideNote();
    showHelp();
}

export function openHelp() {
    helpScreen = {};
    document.getElementById('helpSearch').value = '';
    hideNote();
    openScreen('helpScreen');
}

export function clearHelpSearch() {
    document.getElementById('helpSearch').value = '';
    showHelp();
}

export function initHelp() {
    document.getElementById('helpSearch').addEventListener('input', showHelp);
    drawOnShow('helpScreen', showHelp);
}
