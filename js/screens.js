// Экраны одним стеком: каждый шаг вглубь помнит, как вернуться и где была прокрутка. «Назад» один: кнопка Telegram,
// а если файла Telegram нет или клиент старше 6.1 — своя в общей шапке подэкрана (план этапа 3, Б1–Б3). На главном экране кнопки нет: там «Назад» закрывает окно, как и положено.
import {telegramCall} from './core.js';
import {t} from './i18n.js';

const MAIN = 'mainScreen';
const SCREENS = [MAIN, 'helpScreen', 'ticketScreen', 'formScreen', 'createdScreen'];
// Заголовок шапки. У обращения его ставит сам экран: в нём номер.
const TITLES = {helpScreen: 'btn_help', formScreen: 'new_ticket_title', createdScreen: 'ticket_created'};

const stack = [];
const draws = {};
let current = MAIN;
let boundBack = null;

// На форме и в переписке смахивание вниз сворачивало бы окно посреди набора и чтения (Б17).
const NO_SWIPE = ['formScreen', 'ticketScreen'];

function setSwipes() {
    telegramCall('7.7', app => (NO_SWIPE.includes(current) ? app.disableVerticalSwipes() : app.enableVerticalSwipes()));
}

function showBack() {
    const inner = stack.length > 0;
    // Одна дверь (Б15): вызов не прошёл (нет файла, старый клиент, мост бросил) — остаётся своя кнопка, запуск страницы не обрывается.
    const native = telegramCall('6.1', app => {
        if (boundBack !== app.BackButton) {
            app.BackButton.onClick(goBack);
            boundBack = app.BackButton;
        }
        if (inner) app.BackButton.show();
        else app.BackButton.hide();
    });
    const own = document.getElementById('ownBack');
    if (own) own.classList.toggle('hidden', !inner || native);
}

export function setScreenTitle(text) {
    const title = document.getElementById('screenTitle');
    title.removeAttribute('data-i18n');
    title.textContent = text;
}

function showScreen(id) {
    current = id;
    SCREENS.forEach(name => document.getElementById(name).classList.toggle('hidden', name !== id));
    document.getElementById('screenHead').classList.toggle('hidden', id === MAIN);
    if (TITLES[id]) {
        const title = document.getElementById('screenTitle');
        title.setAttribute('data-i18n', TITLES[id]);
        title.textContent = t(TITLES[id]);
    }
    setSwipes();
    if (draws[id]) draws[id]();
}

// Как нарисовать экран заново: при возврате на него и при смене языка, без лишних запросов.
export function drawOnShow(id, draw) {
    draws[id] = draw;
}

export function redrawScreen() {
    if (draws[current]) draws[current]();
}

export function screenIsOpen(id) {
    return current === id;
}

// leave — как вернуться на предыдущий шаг.
export function pushScreen(leave) {
    stack.push({leave, scroll: window.scrollY});
    window.scrollTo(0, 0);
    showBack();
}

// Шаг вглубь на другой экран: «Назад» вернёт на тот, с которого пришли.
export function openScreen(id) {
    const from = current;
    pushScreen(() => showScreen(from));
    showScreen(id);
}

export function goBack() {
    const step = stack.pop();
    if (!step) return;
    step.leave();
    window.scrollTo(0, step.scroll);
    showBack();
}

// Экран вместо всех шагов вглубь: «Назад» с него — сразу на главный (к отправленной форме и к справке не возвращаемся).
export function replaceScreens(id) {
    const first = stack[0];
    stack.length = 0;
    stack.push({leave: () => showScreen(MAIN), scroll: first ? first.scroll : 0});
    showScreen(id);
    window.scrollTo(0, 0);
    showBack();
}

// Уход сразу на главный экран: шаги вглубь больше не нужны.
export function leaveScreens() {
    const first = stack[0];
    stack.length = 0;
    showScreen(MAIN);
    if (first) window.scrollTo(0, first.scroll);
    showBack();
}

// Файл Telegram мог прийти и после первого экрана: тогда своя кнопка уступает место его.
export function initScreens() {
    window.metlaBoot.whenScript('telegramScript', () => {
        showBack();
        setSwipes();
    });
    showBack();
}
