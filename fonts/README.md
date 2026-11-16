# Шрифты страницы мини-приложения

Те же файлы, что в приложении METLA (`res/font`, `res/font-ru`; коммит сборки 15 `483560c2`), урезанные до нужных знаков и
переведённые в WOFF сценарием `tools/fonts.py` (fontTools 4.65, 16.11.2026). С чужих серверов страница шрифтов не грузит
(решение владельца 15.11.2026 в 12:29:28, вариант «А»).

| Файл | Шрифт | Для чего | Знаки | Авторы | Лицензия |
|---|---|---|---|---|---|
| `space-grotesk-400.woff`, `-700.woff` | Space Grotesk 2.000 | текст по-английски | латиница, знаки препинания, ₽, № и все знаки текстов страницы и справки | © 2020 The Space Grotesk Project Authors | SIL OFL 1.1 — `LICENSE-spacegrotesk.txt` |
| `onest-400.woff`, `-700.woff` | Onest 2.001 | текст по-русски, кириллица в английском | то же и кириллица | © 2021 The Onest Project Authors | SIL OFL 1.1 — `LICENSE-onest.txt` |
| `syne-800.woff` | Syne ExtraBold 2.200 | слово METLA | латиница ASCII | © 2019 The Syne Project Authors | SIL OFL 1.1 — `LICENSE-syne.txt` |
| `syncopate-400.woff` | Syncopate 001.001 | слово CLEANER | латиница ASCII | © 2010 Brian J. Bonislawsky DBA Astigmatic (AOETI) | Apache 2.0 — `LICENSE-syncopate.txt` |

Тексты лицензий — те же файлы, что у сайта metla-site (из репозитория google/fonts). Зарезервированных имён у этих шрифтов нет.

Modified files notice: all six fonts here are modified versions of the original font files — subset to the characters this page
uses and converted to WOFF by Al Badu team (tools/fonts.py, fontTools 4.65, 16.11.2026). Space Grotesk, Onest, Syne — SIL Open
Font License 1.1; Syncopate — Apache License 2.0. No other changes.
Пересобрать: `py -B tools/fonts.py <METLA_Cleaner> <коммит> <metla-support-bot>`; сверить с файлами здесь — то же с `--check`.
