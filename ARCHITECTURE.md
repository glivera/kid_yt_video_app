# Архитектура приложения

## Обзор

Приложение "Детские YouTube Видео" построено на React с использованием современного стека технологий. Архитектура спроектирована с учетом разделения обязанностей, безопасности и масштабируемости.

## Диаграмма компонентов

```
┌─────────────────────────────────────────────────────────┐
│                      Application                        │
│                    (App.jsx)                            │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │   AuthProvider         │
        │   (AuthContext)        │
        └───────────┬────────────┘
                    │
        ┌───────────┴────────────┐
        │   React Router         │
        └───────────┬────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐   ┌──────▼──────┐  ┌────▼─────┐
│ Login  │   │   Parent    │  │  Child   │
│  Page  │   │  Dashboard  │  │Dashboard │
└────────┘   └──────┬──────┘  └────┬─────┘
                    │              │
         ┌──────────┼──────────┐   │
         │          │          │   │
    ┌────▼───┐ ┌───▼────┐ ┌──▼───▼──┐
    │ Search │ │Approved│ │  Video  │
    │        │ │ Videos │ │  List   │
    └────────┘ └────────┘ └─────────┘
```

## Слои приложения

### 1. Presentation Layer (Представление)

**Components** - React компоненты для отображения UI
- `components/Parent/` - Компоненты родительской панели
- `components/Child/` - Компоненты детской панели
- `components/Common/` - Общие переиспользуемые компоненты

**Pages** - Страницы приложения
- `pages/Auth/` - Страницы авторизации
- `pages/Parent/` - Родительские страницы
- `pages/Child/` - Детские страницы

### 2. Business Logic Layer (Бизнес-логика)

**Contexts** - React Context для управления состоянием
- `AuthContext` - Управление авторизацией и ролями

**Services** - Сервисы для работы с внешними API и данными
- `youtubeApi.js` - Взаимодействие с YouTube Data API
- `storage.js` - Управление локальным хранилищем

**Utils** - Вспомогательные функции
- `helpers.js` - Утилиты для форматирования и валидации

### 3. Routing Layer (Маршрутизация)

React Router управляет навигацией с защищенными роутами:

```
/ (root)
├── /login                    - Публичный
└── Protected Routes
    ├── /parent/*             - Только для родителей
    │   ├── /search
    │   ├── /approved
    │   ├── /blocked
    │   └── /recommendations
    └── /child/*              - Только для детей
        ├── /videos
        ├── /player/:id
        └── /history
```

## Поток данных

### Авторизация

```
User Login
    ↓
Login Component
    ↓
AuthContext.login()
    ↓
localStorage.setItem('user')
    ↓
Navigate to Dashboard
```

### Поиск видео (Parent)

```
Search Query
    ↓
VideoSearch Component
    ↓
youtubeApi.searchVideos()
    ↓
YouTube Data API v3
    ↓
Display Results
    ↓
Approve/Block Actions
    ↓
storage.addApprovedVideo() / storage.addBlockedVideo()
    ↓
localStorage
```

### Просмотр видео (Child)

```
VideoList Component
    ↓
storage.getApprovedVideos()
    ↓
localStorage
    ↓
Display Video Grid
    ↓
User Clicks Video
    ↓
Navigate to VideoPlayer
    ↓
storage.addToWatchHistory()
    ↓
Render YouTube Embed
```

## Хранение данных

### LocalStorage Structure

```javascript
{
  // Пользователь
  "user": {
    "id": "timestamp",
    "username": "string",
    "role": "parent|child"
  },

  // Утвержденные видео
  "approvedVideos": [
    {
      "id": "videoId",
      "title": "string",
      "channel": "string",
      "channelId": "string",
      "thumbnail": "url",
      "approvedAt": "ISO date"
    }
  ],

  // Заблокированные видео
  "blockedVideos": [
    {
      "id": "videoId",
      "title": "string",
      "channel": "string",
      "blockedAt": "ISO date"
    }
  ],

  // Заблокированные каналы
  "blockedChannels": [
    {
      "id": "channelId",
      "name": "string",
      "subscriberCount": "string",
      "blockedAt": "ISO date"
    }
  ],

  // История просмотров
  "watchHistory": [
    {
      "videoId": "string",
      "title": "string",
      "channel": "string",
      "thumbnail": "url",
      "watchedAt": "ISO date"
    }
  ]
}
```

## Безопасность

### 1. Защита роутов

`ProtectedRoute` компонент проверяет:
- Наличие авторизованного пользователя
- Соответствие роли пользователя требуемой роли

```javascript
if (!user) → redirect to /login
if (user.role !== allowedRole) → redirect to appropriate dashboard
```

### 2. YouTube API безопасность

- `safeSearch: 'strict'` - Строгая фильтрация контента
- `videoEmbeddable: true` - Только видео, которые можно встроить
- API ключ хранится в environment variables

### 3. Контроль контента

- Родители должны явно утвердить каждое видео
- Дети видят только утвержденный контент
- Заблокированные каналы полностью исключаются

## API интеграция

### YouTube Data API v3

**Endpoints используемые:**

1. **Search Videos**
```
GET /youtube/v3/search
params: {
  part: 'snippet',
  q: 'search query',
  type: 'video',
  maxResults: 20,
  safeSearch: 'strict',
  videoEmbeddable: true
}
```

2. **Get Video Details**
```
GET /youtube/v3/videos
params: {
  part: 'snippet,contentDetails,statistics',
  id: 'videoId'
}
```

3. **Get Channel Info**
```
GET /youtube/v3/channels
params: {
  part: 'snippet,statistics',
  id: 'channelId'
}
```

## Производительность

### Оптимизации

1. **Code Splitting**
   - Lazy loading для роутов
   - Динамический импорт компонентов

2. **Кэширование**
   - LocalStorage для данных
   - 15-минутный кэш для API запросов (будущее)

3. **Debouncing**
   - Поисковые запросы с задержкой
   - Предотвращение множественных запросов

## Масштабируемость

### Текущее состояние
- Client-side приложение
- LocalStorage для данных
- Прямые запросы к YouTube API

### Будущее развитие

**Backend API**
```
Frontend (React)
    ↓
Backend API (Node.js/Express)
    ↓
    ├→ Database (PostgreSQL/MongoDB)
    └→ YouTube API
```

**Преимущества backend:**
- Централизованное хранение данных
- Аутентификация и авторизация
- Защита API ключей
- Кэширование на сервере
- Множественные пользователи
- Синхронизация между устройствами

## Тестирование

### Стратегия тестирования

1. **Unit Tests**
   - Утилиты и хелперы
   - Функции работы с данными

2. **Component Tests**
   - Рендеринг компонентов
   - Интерактивность

3. **Integration Tests**
   - Роутинг
   - API вызовы
   - Context провайдеры

4. **E2E Tests**
   - Полный user flow
   - Авторизация → Поиск → Утверждение → Просмотр

## Развертывание

### Рекомендуемые платформы

**Frontend:**
- Vercel
- Netlify
- GitHub Pages

**Backend (будущее):**
- Heroku
- Railway
- AWS/GCP

### Environment Variables

```
# Development
VITE_YOUTUBE_API_KEY=dev_key
VITE_API_URL=http://localhost:3001

# Production
VITE_YOUTUBE_API_KEY=prod_key
VITE_API_URL=https://api.example.com
```

## Мониторинг и аналитика

### Будущие метрики

- Количество утвержденных видео
- Время просмотра
- Популярные категории
- Активность пользователей
- Ошибки API

## Accessibility

- Семантический HTML
- ARIA атрибуты
- Keyboard navigation
- Screen reader support
- Контрастность цветов

## Интернационализация

Подготовка к i18n:
- Вынос текстов в константы
- Поддержка множественных языков
- Локализация дат и чисел
