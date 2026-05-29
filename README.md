# Maze Worksheet Studio

Локальный MVP-проект на **React + TypeScript + Vite** для генерации детских лабиринтов в формате готовой worksheet-страницы. Основной рендеринг выполняется в **SVG**, поэтому страницу удобно масштабировать, печатать и экспортировать в SVG/PNG/PDF.

## 1. Установка зависимостей

```bash
npm install
```

## 2. Запуск локально

```bash
npm run dev
```

## 3. Как открыть проект в браузере

После запуска Vite откройте адрес из терминала, обычно:

```txt
http://localhost:5173
```

Проект не требует сервера, базы данных, Docker, авторизации, облачного хранения или деплоя.

## 4. Как пользоваться генератором

1. В левой панели выберите пресет или настройте страницу вручную.
2. Выберите `Maze Type`: `square`, `rectangle`, `circle` или `road`.
3. Настройте `Difficulty`, `Theme`, `Visual Mode`, `Page Format`, `Algorithm`, `Seed`, `Rotation Angle`, `Line Width` и `Path Width`.
4. Нажмите **Generate**.
5. Справа появится предпросмотр печатной страницы с заголовком, инструкцией, рамкой, именем ребёнка, стартом, финишем и тематическим декором.
6. Для автоматической журнальной композиции нажмите **Create Worksheet Page**.

## 5. Как включить и выключить решение

- Нажмите **Show Solution**, чтобы показать цветную линию решения поверх лабиринта.
- Нажмите **Hide Solution**, чтобы скрыть решение.
- В поле `Solution Mode` доступны режимы:
  - `none` — без решения;
  - `overlay` — решение поверх лабиринта;
  - `separatePage` — при PDF-экспорте добавляется отдельная страница с ответом;
  - `teacher` — зарезервировано для будущего teacher-view режима.

## 6. Как экспортировать PNG/SVG/PDF

В верхней части предпросмотра есть кнопки:

- **Export SVG** — сохраняет текущую worksheet-страницу как SVG.
- **Export PNG** — конвертирует текущий SVG в canvas и сохраняет PNG выбранного размера страницы.
- **Export PDF** — создаёт PDF через `jsPDF`.

Если выбран `solutionMode: separatePage`, PDF содержит:

1. страницу с лабиринтом без решения;
2. страницу с тем же лабиринтом и решением.

## 7. Где находятся генераторы лабиринтов

Генераторы находятся в папке:

```txt
src/maze/generators/
```

Основные файлы:

- `squareMaze.ts` — квадратный лабиринт;
- `rectangleMaze.ts` — прямоугольный лабиринт;
- `circleMaze.ts` — круговой лабиринт на кольцах и секторах;
- `roadMaze.ts` — широкая дорожка для малышей;
- `backtracking.ts` — алгоритм recursive backtracking;
- `prim.ts` — алгоритм Prim;
- `index.ts` — единая точка выбора генератора по `settings.mazeType`.

## 8. Где находятся темы

Темы находятся в папке:

```txt
src/maze/themes/
```

В MVP добавлены 5 тем:

- `space.ts`;
- `forest.ts`;
- `ocean.ts`;
- `dinosaurs.ts`;
- `cats.ts`.

Общие типы темы находятся в `src/maze/themes/themeTypes.ts`.

## 9. Как добавить новый тип лабиринта

1. Добавьте новое значение в тип `MazeType` или `FutureMazeType` в `src/maze/core/types.ts`.
2. Создайте генератор в `src/maze/generators/newMaze.ts`.
3. Верните объект `MazeModel` со стартом, финишем и массивом `solution`.
4. Подключите генератор в `src/maze/generators/index.ts`.
5. Добавьте SVG-отрисовку в `src/maze/render/renderMazeSvg.ts` или вынесите отдельный renderer.
6. Добавьте пункт в UI в `src/components/ControlsPanel.tsx`.

Архитектура уже разделяет генерацию, валидацию, решение, рендеринг, трансформации и экспорт, поэтому можно добавлять hex, triangle, spiral, shape, collect-items, number/letter maze и другие типы.

## 10. Как добавить новую визуальную тему

1. Создайте файл темы в `src/maze/themes/`, например `robots.ts`.
2. Опишите объект `WorksheetTheme`: цвета, подписи, иконки старта/финиша, декор, заголовок и инструкцию.
3. Импортируйте тему в `src/maze/themes/index.ts`.
4. Добавьте новое значение в тип `MazeTheme` в `src/maze/core/types.ts`.
5. Добавьте пункт в список `themes` в `src/components/ControlsPanel.tsx`.

## Структура проекта

```txt
src/
  app/
  components/
  export/
  maze/
    core/
    generators/
    render/
    solver/
    themes/
    transform/
  presets/
  styles/
```

## Локальная проверка

Рекомендуемые команды:

```bash
npm install
npm run dev
npm run build
```

Проверьте в браузере: выбор типа лабиринта, сложности, темы, seed, поворот 15/30/45/90 градусов, показ/скрытие решения, SVG/PNG/PDF экспорт и режим coloring.
