# ECS Elite Cyber Squad Prototype

Локальный MVP-прототип сайта ECS для Fortnite и CS2 турниров с esports dashboard-интерфейсом.

## Что есть

- ECS branding: тёмный esports dashboard, левое меню, topbar, профиль игрока.
- Отдельные визуальные режимы CS2 и Fortnite.
- Подключены локальные изображения из asset board: ECS logo, CS2/Fortnite hero backgrounds, avatar, tournament thumbnails, card patterns.
- Блок с флагами не используется.
- Список турниров с фильтром Fortnite / CS2.
- Рабочая регистрация/вход на сайте по нику и паролю. В локальном прототипе аккаунты сохраняются в `localStorage`.
- Выдача room code / island code только после регистрации.
- Профиль игрока создаётся после регистрации с нулевой статистикой.
- Раздел `Игроки` убран из интерфейса.
- Таблица лидеров строится из зарегистрированных/добавленных через админку игроков.
- Заготовка под внешнюю Fortnite статистику: PR, placements, earnings и sync status.
- CS2 статистика: K/D, ADR, HS%, maps.
- CS2 2v2 сетка матчей.
- Leaderboard с режимами season / month / week.
- Admin-панель закрыта паролем. Демо-пароль: `ECS2026`.
- Admin-панель для публикации турниров.
- Admin-обновление Fortnite / CS2 code.
- Admin-удаление турниров, чтобы не перегружать раздел турниров.
- Admin-редактирование статистики игрока по нику.
- Admin-редактирование CS2 2v2 матчей: команды, счёт и статус.
- Данные вынесены в `data/mock-api.js`: это локальная имитация будущего сервера для игроков, турниров, матчей и сетки.

## Важно про FortniteTracker

FortniteTracker / Tracker Network сейчас нельзя считать гарантированным публичным источником API для продакшена. В прототипе поэтому заложена безопасная схема:

- локальная статистика турниров хранится у вас и является главным источником рейтинга;
- Epic nickname / FortniteTracker profile привязывается к игроку;
- внешний sync status показывает, можно ли подтянуть PR, placements, earnings;
- backend позже можно подключить к доступному API, партнёрскому доступу или другому провайдеру статистики.

## Как запустить

Откройте файл `index.html` в браузере.

Для локального сервера можно выполнить:

```bash
node -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();const types={'.html':'text/html','.css':'text/css','.js':'text/javascript'};http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/' )p='/index.html';const file=path.join(root,p);fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'});res.end(data)})}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'))"
```

и открыть `http://localhost:4173`.

## Демо-админка

Пароль для локального прототипа:

```text
ECS2026
```

Это только демо-защита для локального MVP. В продакшене пароль и права админа должны проверяться на сервере.

## Следующий технический шаг

1. Перенести UI в Next.js.
2. Создать Supabase проект и применить [supabase/schema.sql](supabase/schema.sql).
3. Подключить серверную регистрацию/вход вместо локального `localStorage`.
4. Сделать API routes из [docs/backend-plan.md](docs/backend-plan.md).
5. Заменить `data/mock-api.js` на реальные API routes / Supabase queries.
