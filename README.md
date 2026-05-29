# Maze Worksheet Studio

Локальный генератор детских лабиринтов для журналов, worksheets, раскрасок и печати.

Проект сделан максимально просто: **только HTML, CSS и чистый JavaScript**. Никакая сборка не нужна.

## Как запустить

1. Скачайте или откройте папку проекта.
2. Откройте файл `index.html` в браузере двойным кликом.
3. Пользуйтесь генератором.

Никакая установка не нужна.

```txt
npm install не нужен.
npm run dev не нужен.
Vite не используется.
React не используется.
TypeScript не используется.
Проект работает локально как обычная HTML-страница.
```

Можно также открыть проект через Live Server в VS Code, но это необязательно.

## Что есть в MVP

- Квадратный лабиринт `square maze`.
- Recursive backtracking генерация.
- Сложности:
  - `easy` — 8 × 8;
  - `medium` — 12 × 12;
  - `hard` — 18 × 18.
- Seed-генерация: одинаковый seed даёт одинаковый лабиринт.
- Если seed пустой, приложение создаёт новый случайный seed.
- Кнопка `Generate Maze`.
- Кнопка `Show Solution`.
- Кнопка `Hide Solution`.
- Поле `Rotation Angle`.
- SVG-предпросмотр worksheet-страницы.
- Старт и финиш.
- Экспорт `Download SVG`.
- Экспорт `Download PNG` через canvas.
- Темы: `basic`, `space`, `forest`, `cats`.
- Режимы: `color`, `coloring`, `minimal`.

## Как пользоваться

1. Выберите сложность или размер лабиринта.
2. Введите `Seed` или оставьте поле пустым.
3. Введите угол в `Rotation Angle`, например `0`, `15`, `30`, `45`, `90` или `180`.
4. Выберите тему и визуальный режим.
5. Нажмите `Generate Maze`.
6. Нажмите `Show Solution`, чтобы увидеть путь.
7. Нажмите `Hide Solution`, чтобы скрыть путь.
8. Нажмите `Download SVG` или `Download PNG`, чтобы сохранить страницу.

## Как работать через GitHub Desktop

1. Откройте репозиторий в GitHub Desktop.
2. Внесите изменения в файлы.
3. Проверьте `index.html` в браузере.
4. Сделайте commit.

## Структура проекта

```txt
index.html
README.md
css/
  style.css
js/
  app.js
  maze-generator.js
  maze-solver.js
  maze-renderer.js
  export.js
  themes.js
```

## Где что находится

- `index.html` — разметка приложения и подключение обычных JS-файлов без `type="module"`.
- `css/style.css` — стили интерфейса и предпросмотра.
- `js/themes.js` — темы `basic`, `space`, `forest`, `cats` и режимы `color`, `coloring`, `minimal`.
- `js/maze-generator.js` — seed random и генерация квадратного лабиринта.
- `js/maze-solver.js` — поиск решения от старта до финиша.
- `js/maze-renderer.js` — сборка SVG worksheet-страницы.
- `js/export.js` — скачивание SVG и PNG.
- `js/app.js` — связывает UI, генерацию, рендер и экспорт.

## Важно

В проекте нет:

- Vite;
- React;
- TypeScript;
- npm-зависимостей;
- `package.json`;
- `node_modules`;
- backend;
- Docker;
- сервера;
- деплоя.

Проект должен работать локально при простом открытии `index.html`.
