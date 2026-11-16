// Первый заход страницы: index.html и этот файл. Всё остальное подгружается отсюда и первый кадр не держит: при плохой связи или обрезке
// (российские операторы режут Cloudflare на первых 16 КБ) человек видит текст, а не пустой экран. Старый синтаксис: файл обязан разобраться
// на любом движке — проба tests/boot.spec.mjs. Адреса файлов — относительные: страница не привязана к хостингу.
(function () {
    var WAIT_BEFORE_FAILURE_MS = 12000;
    var STYLES = ['css/variables.css', 'css/app.css'];
    var MODULES = ['js/i18n.js', 'js/core.js', 'js/screens.js', 'js/form.js', 'js/help.js', 'js/conversation.js', 'js/tickets.js', 'js/motion.js', 'js/app.js'];
    var BOT_CHAT = 'https://t.me/METLA_support_bot';
    var WORDS = {
        ru: {
            loading: 'Загрузка…',
            failed: 'Страница не загрузилась: связь обрывается. Попробуйте ещё раз или напишите в чат бота — он работает и без этой страницы.',
            retry: 'Повторить',
            chat: 'Открыть чат бота'
        },
        en: {
            loading: 'Loading…',
            failed: "The page didn't load: the connection keeps dropping. Try again or write to the bot chat — it works without this page.",
            retry: 'Try again',
            chat: 'Open the bot chat'
        }
    };

    var stylesLeft = STYLES.length;
    var started = false;
    var shown = false;
    var timedOut = false;
    var scriptEvents = {};

    function savedLanguage() {
        try {
            return localStorage.getItem('metla_lang') || '';
        } catch (e) {
            return '';
        }
    }

    function launchParam(name) {
        return new URLSearchParams(location.hash.slice(1)).get(name) || '';
    }

    function telegramLanguage() {
        try {
            return JSON.parse(new URLSearchParams(launchParam('tgWebAppData')).get('user')).language_code || '';
        } catch (e) {
            return '';
        }
    }

    // Правило как у бота (services/cache.py): что начинается с ru — русский, остальное — английский; сохранённый выбор главнее.
    var lang = (savedLanguage() || telegramLanguage() || navigator.language || '').toLowerCase().indexOf('ru') === 0 ? 'ru' : 'en';
    var words = WORDS[lang];

    // Заставку Telegram снимаем и окно разворачиваем сразу, не дожидаясь его файла: он может и не прийти.
    try {
        if (window.TelegramWebviewProxy) {
            window.TelegramWebviewProxy.postEvent('web_app_ready', '');
            window.TelegramWebviewProxy.postEvent('web_app_expand', '');
        }
    } catch (e) {
        console.error('Окно Telegram не настроено:', e);
    }

    // Стили ещё не пришли: фон и текст — отсюда. CSP разрешает el.style, но не атрибут style и не встроенные блоки.
    document.documentElement.style.background = '#0B0D17';

    function note() {
        return document.getElementById('bootNote');
    }

    // Срок мог пройти и раньше конца разбора страницы: тогда текст о сбое рисуется, как только блок готов, и «Загрузка…» его не затирает.
    function showNote() {
        var box = note();
        if (!box || shown) return;
        box.style.cssText = 'padding:48px 24px;text-align:center;color:#F0F3FA;font:15px/1.5 sans-serif;';
        if (timedOut) drawFailure(box);
        else box.textContent = words.loading;
    }

    function drawFailure(box) {
        box.textContent = words.failed;
        var row = document.createElement('div');
        row.style.cssText = 'margin-top:24px;display:flex;flex-direction:column;align-items:center;gap:16px;';
        var retry = document.createElement('button');
        retry.id = 'bootRetry';
        retry.type = 'button';
        retry.textContent = words.retry;
        retry.style.cssText = 'min-height:48px;padding:0 24px;border:0;border-radius:16px;background:#00F0C8;color:#0B0D17;font:700 15px sans-serif;';
        retry.addEventListener('click', function () {
            location.reload();
        });
        var chat = document.createElement('a');
        chat.id = 'bootChat';
        chat.href = BOT_CHAT;
        chat.textContent = words.chat;
        chat.style.cssText = 'color:#00F0C8;font:15px sans-serif;';
        row.appendChild(retry);
        row.appendChild(chat);
        box.appendChild(row);
    }

    // Показываем приложение, когда пришли стили и запустился сценарий; файлы, пришедшие позже срока, снимают текст о сбое.
    function revealIfReady() {
        if (shown || stylesLeft > 0 || !started) return;
        shown = true;
        var box = note();
        if (box) box.remove();
        document.documentElement.style.background = '';
        document.getElementById('app').hidden = false;
    }

    // media="print" на время загрузки: на движке WebKit зависший файл стилей иначе держит весь экран, и текст о сбое тоже.
    function addStyle(href, onload) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.media = 'print';
        link.addEventListener('load', function done() {
            link.removeEventListener('load', done);
            link.media = 'all';
            if (onload) onload();
        });
        document.head.appendChild(link);
    }

    function preloadModule(href) {
        var link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = href;
        document.head.appendChild(link);
    }

    // Событие загрузки файла Telegram записываем отсюда: сценарий страницы начинает позже и своё событие мог бы пропустить.
    // В Telegram Web моста нет: заставку снимает его файл, не дожидаясь сценария, иначе она закрыла бы текст о сбое.
    function rememberScriptEvent(event) {
        var id = event.target && event.target.id;
        if (!id) return;
        scriptEvents[id] = true;
        if (id === 'telegramScript') {
            try {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
            } catch (e) {
                console.error('Окно Telegram не настроено:', e);
            }
        }
    }
    document.addEventListener('load', rememberScriptEvent, true);

    window.metlaBoot = {
        lang: lang,
        launchParam: launchParam,
        savedLanguage: savedLanguage,
        started: function () {
            started = true;
            revealIfReady();
        },
        whenScript: function (id, onLoad) {
            if (scriptEvents[id]) {
                onLoad();
            } else {
                document.getElementById(id).addEventListener('load', onLoad);
            }
        }
    };

    document.addEventListener('DOMContentLoaded', showNote);
    setTimeout(function () {
        timedOut = true;
        showNote();
    }, WAIT_BEFORE_FAILURE_MS);

    STYLES.forEach(function (href) {
        addStyle(href, function () {
            stylesLeft -= 1;
            revealIfReady();
        });
    });
    MODULES.forEach(preloadModule);
    var main = document.createElement('script');
    main.type = 'module';
    main.src = 'js/app.js';
    document.head.appendChild(main);
})();
