# Ендпоінти

Усі відповіді у форматі JSON. Повна інтерактивна документація: http://localhost:3000/reference

| Метод | Маршрут | Вхід | Вихід | Помилки |
|---|---|---|---|---|
| GET | /health | нічого | `{ status, database }` | 500, якщо база не відповідає |
| GET | /authors | query: `page`, `pageSize` | сторінка авторів | 400 |
| GET | /authors/:id | id в URL | автор | 404 |
| POST | /authors | `{ name, country }` | 201, автор | 400 |
| PATCH | /authors/:id | `{ name?, country? }` | автор | 400, 404 |
| DELETE | /authors/:id | id в URL | 204, без тіла | 404, 409 (в автора є книги) |
| GET | /books | query: `page`, `pageSize`, `authorId`, `q` (частина назви, 1-100 символів) | сторінка книг | 400 |
| GET | /books/:id | id в URL | книга разом з `author` | 404 |
| POST | /books | `{ title, year, authorId, copiesTotal }` | 201, книга | 400, 404 (автора немає) |
| PATCH | /books/:id | `{ title?, year?, authorId? }` | книга | 400, 404 |
| DELETE | /books/:id | id в URL | 204, без тіла | 404, 409 (книга має видачі) |
| GET | /loans | query: `page`, `pageSize`, `active` (true або false) | сторінка видач | 400 |
| POST | /loans | `{ bookId, readerName }` | 201, видача | 400, 404 (книги немає), 409 (немає вільних примірників) |
| POST | /loans/:id/return | id видачі в URL | видача з `returnedAt` | 404, 409 (вже повернули) |

Службові адреси, не частина API: `GET /openapi.json` (OpenAPI-документ), `GET /reference` (сторінка документації).

## Сторінка списку

Усі списки повертають однакову обгортку:

```json
{
  "items": [],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

`page` починається з 1. `pageSize` від 1 до 100, за замовчуванням 10.

## Помилка

Будь-яка помилка повертає однакову обгортку:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Немає вільних примірників",
  "requestId": "3f0fe3fd-afcc-4d83-8f48-ac27f192e382"
}
```

Для 400 поле `message` є масивом рядків, по одному на кожне проблемне поле.
