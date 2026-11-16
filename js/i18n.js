// Переводы страницы. Язык определяет boot.js: правило одно, текст о сбое говорит на том же языке.
export const translations = {
    ru: {
        app_subtitle: 'Поддержка',
        loading: 'Загрузка…',
        search_clear: 'Очистить поиск',
        my_tickets: 'Мои обращения',
        btn_new_ticket: 'Новое обращение',
        btn_help: 'Помощь',
        help_search: 'Поиск по ответам',
        back: 'Назад',
        help_load_error: 'Не удалось загрузить справку. Проверьте связь или напишите в поддержку.',
        help_contact: 'Написать в поддержку',
        ticket: 'Обращение',
        loading_messages: 'Загрузка переписки…',
        new_ticket_title: 'Новое обращение',
        label_category: 'Категория',
        label_description: 'Описание проблемы',
        placeholder_description: 'Опишите вашу проблему подробно…',
        btn_create_ticket: 'Создать обращение',
        ticket_created: 'Обращение создано',
        created_number: 'Номер обращения',
        created_chat: 'Ответ придёт в чат с ботом и появится здесь, в «Моих обращениях».',
        created_ask: 'Разрешите боту писать вам: ответ придёт в чат. Он появится и здесь, в «Моих обращениях».',
        created_here: 'Ответ появится здесь, в «Моих обращениях».',
        btn_close: 'Закрыть',
        cat_question: 'Вопрос',
        cat_bug: 'Ошибка',
        cat_feature: 'Предложение',
        cat_other: 'Другое',
        cat_feedback: 'Отзыв',
        cat_general: 'Общий',
        no_tickets: 'Здесь обращений нет',
        no_messages: 'Нет сообщений',
        msg_closed_by_user: 'Вы закрыли обращение',
        msg_file: 'Файл',
        msg_file_failed: 'Файл не дошёл',
        msg_screenshot: 'Скриншот',
        msg_photo: 'Фото',
        msg_video: 'Видео',
        msg_voice: 'Голосовое сообщение',
        msg_video_note: 'Видеосообщение',
        msg_audio: 'Аудио',
        msg_animation: 'GIF',
        msg_attachment: 'Вложение',
        msg_auto: 'Автоматический ответ',
        error_loading_messages: 'Ошибка загрузки переписки',
        alert_no_description: 'Пожалуйста, опишите вашу проблему',
        creating: 'Отправляется…',
        error_creating: 'Не удалось создать обращение. Попробуйте ещё раз.',
        status_open: 'Открыто',
        status_in_progress: 'В работе',
        status_resolved: 'Решено',
        status_closed: 'Закрыто',
        btn_load_more: 'Показать ещё',
        loading_more: 'Загрузка…',
        filter_all: 'Все',
        filter_open: 'Открытые',
        filter_in_progress: 'В работе',
        filter_resolved: 'Решённые',
        filter_closed: 'Закрытые',
        label_attachment: 'Прикрепить файл (до 20 МБ)',
        btn_attach_file: 'Выбрать файл',
        file_remove: 'Убрать файл',
        error_file_too_large: 'Файл больше 20 МБ. Такой файл можно отправить в чате бота @METLA_support_bot.',
        // Отказы (Д-181, этап 1; слова утвердил владелец 03.11.2026 в 21:39:50)
        refuse_auth: 'Мини-приложение открыто слишком давно или не из Telegram. Закройте его и откройте снова через бота @METLA_support_bot.',
        refuse_open_limit: 'У вас уже 3 открытых обращения. Чтобы создать новое, закройте одно из них — кнопкой «Закрыть обращение» в обращении — или дождитесь, пока его закроет поддержка.',
        refuse_daily_limit: 'За последние сутки вы уже создали 5 обращений — это предел. Новое можно будет создать позже. Если у вас есть открытое обращение — напишите в чат бота @METLA_support_bot, сообщение попадёт в него.',
        refuse_text_too_long: 'Текст длиннее 4000 знаков — сократите его, пожалуйста.',
        refuse_file_type: 'Такой файл прикрепить нельзя. Можно JPG, PNG, PDF, MP4 или MOV.',
        error_load: 'Не удалось загрузить данные. Проверьте связь и откройте мини-приложение снова.',
        error_search: 'Поиск не удался. Попробуйте ещё раз.',
        search_placeholder: 'Номер или слово из переписки',
        no_search_results: 'Ничего не найдено',
        btn_close_ticket: 'Закрыть обращение',
        close_explain: 'После закрытия новые сообщения в это обращение отправить нельзя.',
        btn_cancel: 'Отмена',
        error_closing: 'Не удалось закрыть обращение. Попробуйте ещё раз.'
    },
    en: {
        app_subtitle: 'Support',
        loading: 'Loading…',
        search_clear: 'Clear search',
        my_tickets: 'My requests',
        btn_new_ticket: 'New request',
        btn_help: 'Help',
        help_search: 'Search the answers',
        back: 'Back',
        help_load_error: 'Couldn\'t load the help. Check your connection or contact support.',
        help_contact: 'Contact support',
        ticket: 'Request',
        loading_messages: 'Loading messages…',
        new_ticket_title: 'New request',
        label_category: 'Category',
        label_description: 'Problem description',
        placeholder_description: 'Describe your problem in detail…',
        btn_create_ticket: 'Create request',
        ticket_created: 'Request created',
        created_number: 'Request number',
        created_chat: 'The answer will come to the bot chat and appear here, in “My requests”.',
        created_ask: 'Allow the bot to message you and the answer will come to the chat. It will also appear here, in “My requests”.',
        created_here: 'The answer will appear here, in “My requests”.',
        btn_close: 'Close',
        cat_question: 'Question',
        cat_bug: 'Bug',
        cat_feature: 'Suggestion',
        cat_other: 'Other',
        cat_feedback: 'Feedback',
        cat_general: 'General',
        no_tickets: 'No requests here',
        no_messages: 'No messages',
        msg_closed_by_user: 'You closed this request',
        msg_file: 'File',
        msg_file_failed: 'File not delivered',
        msg_screenshot: 'Screenshot',
        msg_photo: 'Photo',
        msg_video: 'Video',
        msg_voice: 'Voice message',
        msg_video_note: 'Video message',
        msg_audio: 'Audio',
        msg_animation: 'GIF',
        msg_attachment: 'Attachment',
        msg_auto: 'Automatic answer',
        error_loading_messages: 'Error loading messages',
        alert_no_description: 'Please describe your problem',
        creating: 'Sending…',
        error_creating: 'Couldn\'t create the request. Please try again.',
        status_open: 'Open',
        status_in_progress: 'In progress',
        status_resolved: 'Resolved',
        status_closed: 'Closed',
        btn_load_more: 'Load more',
        loading_more: 'Loading…',
        filter_all: 'All',
        filter_open: 'Open',
        filter_in_progress: 'In progress',
        filter_resolved: 'Resolved',
        filter_closed: 'Closed',
        label_attachment: 'Attach file (up to 20 MB)',
        btn_attach_file: 'Choose file',
        file_remove: 'Remove file',
        error_file_too_large: 'The file is larger than 20 MB. You can send it in the @METLA_support_bot chat.',
        refuse_auth: 'The mini app has been open too long or wasn\'t opened from Telegram. Close it and open it again from @METLA_support_bot.',
        refuse_open_limit: 'You already have 3 open requests. To create a new one, close one of them with the “Close request” button in the request, or wait until support closes it.',
        refuse_daily_limit: 'You\'ve created 5 requests in the last 24 hours — that\'s the limit. You can create a new one later. If you have an open request, write to the @METLA_support_bot chat and your message will go to it.',
        refuse_text_too_long: 'The text is longer than 4,000 characters — please shorten it.',
        refuse_file_type: 'This file type can\'t be attached. You can use JPG, PNG, PDF, MP4 or MOV.',
        error_load: 'Couldn\'t load the data. Check your connection and open the mini app again.',
        error_search: 'Search failed. Please try again.',
        search_placeholder: 'Number or word from the conversation',
        no_search_results: 'No results found',
        btn_close_ticket: 'Close request',
        close_explain: 'After closing, you can\'t send new messages to this request.',
        btn_cancel: 'Cancel',
        error_closing: 'Couldn\'t close the request. Please try again.'
    }
};

export let currentLang = window.metlaBoot.lang;

export function setLanguage(lang) {
    currentLang = lang;
}

export function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
}

export function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation && el) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        if (translation && el) {
            el.placeholder = translation;
        }
    });

    document.querySelectorAll('[data-i18n-label]').forEach(el => {
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-label')));
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        }
    });
}
