# Maze Worksheet Studio

Минимальный локальный MVP на **React + TypeScript + Vite**. Сейчас проект специально упрощён до стабильной базы: один квадратный SVG-лабиринт, seed, поворот, кнопки Generate / Show Solution / Hide Solution.

## Как запустить локально

1. Открыть папку проекта в терминале.
2. Установить зависимости:

```bash
npm install
```

3. Запустить Vite:

```bash
npm run dev
```

4. Открыть адрес, который покажет Vite, например:

```txt
http://localhost:5173
```

## Что должно быть видно в браузере

На странице должно открыться приложение **Maze Worksheet Studio**:

- слева — панель настроек;
- справа — зона предпросмотра;
- поле `Seed`;
- поле `Rotation Angle`;
- кнопка `Generate`;
- кнопка `Show Solution`;
- кнопка `Hide Solution`;
- простой SVG-лабиринт 12 × 12;
- зелёный старт `START`;
- красный финиш `FINISH`;
- синяя линия решения, которую можно показать и скрыть.

## Как пользоваться

1. Измените `Seed`.
2. Нажмите `Generate` — лабиринт пересоздастся по seed.
3. Введите угол в `Rotation Angle`, например `15`, `30`, `45` или `90`.
4. Нажмите `Show Solution`, чтобы увидеть решение.
5. Нажмите `Hide Solution`, чтобы скрыть решение.

Один и тот же seed создаёт один и тот же лабиринт.

## Если не запускается

Для macOS / Linux:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

Для Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run dev
```

## Текущая структура

```txt
package.json
index.html
tsconfig.json
vite.config.ts
src/main.tsx
src/App.tsx
src/App.css
src/maze/types.ts
src/maze/generateSquareMaze.ts
src/maze/solveMaze.ts
src/maze/renderMazeSvg.tsx
```

## Где находится логика лабиринта

- `src/maze/generateSquareMaze.ts` — генерация квадратного лабиринта recursive backtracking.
- `src/maze/solveMaze.ts` — поиск решения от старта до финиша.
- `src/maze/renderMazeSvg.tsx` — SVG-отрисовка стен, старта, финиша, решения и поворота.
- `src/App.tsx` — простой экран приложения и управление настройками.

## Что временно отключено

Чтобы сначала стабилизировать локальный запуск, временно не добавлены сложные функции: PDF/PNG/SVG export, темы, круговой maze, road maze, batch generation и премиальный дизайн. Их можно возвращать постепенно после того, как базовый проект стабильно запускается через `npm install` и `npm run dev`.
