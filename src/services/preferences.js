import { getApprovedVideos, getBlockedVideos, getBlockedChannels, getWatchHistory } from './storage'
import { getTrendingVideosForAge } from './youtubeApi'

/**
 * Сервис для анализа предпочтений пользователя и персонализации рекомендаций
 */

// Стоп-слова для русского и английского языка (слова, которые не несут смысловой нагрузки)
const STOP_WORDS = new Set([
  // Русские стоп-слова
  'для', 'детей', 'лет', 'года', 'видео', 'смотреть', 'онлайн', 'бесплатно',
  'развивающее', 'обучающее', 'детское', 'мультик', 'мультфильм', 'серия',
  'эпизод', 'полная', 'новый', 'новая', 'новые', 'лучший', 'лучшая', 'лучшие',
  'смотри', 'все', 'самый', 'самая', 'самые', 'как', 'что', 'это', 'про',
  // Английские стоп-слова (только самые общие)
  'for', 'the', 'and', 'with', 'from', 'are', 'was', 'were',
  'video', 'videos', 'watch', 'online', 'free', 'subscribe', 'like', 'share',
  'episode', 'full', 'new', 'compilation', 'hours', 'hour', 'minutes',
  'channel', 'show', 'series', 'collection', 'official', 'page',
  'how', 'what', 'why', 'when', 'where', 'this', 'that', 'these', 'those'
])

/**
 * Извлекает ключевые слова из текста
 */
const extractKeywords = (text, maxWords = 10) => {
  if (!text) return []

  // Приводим к нижнему регистру и разбиваем на слова
  const words = text
    .toLowerCase()
    .replace(/[^\u0400-\u04FFa-z0-9\s]/gi, ' ') // Оставляем только буквы, цифры и пробелы
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))

  // Подсчитываем частоту слов
  const wordFrequency = {}
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1
  })

  // Сортируем все слова по частоте
  const sortedWords = Object.entries(wordFrequency).sort((a, b) => b[1] - a[1])

  // Берем топ слов
  return sortedWords
    .slice(0, maxWords)
    .map(([word]) => word)
}

/**
 * Анализирует предпочтительные каналы на основе утвержденных видео
 */
export const getPreferredChannels = async () => {
  const approvedVideos = await getApprovedVideos()
  const blockedChannels = await getBlockedChannels()
  const blockedChannelIds = new Set(blockedChannels.map(ch => ch.id))

  // Подсчитываем частоту каналов
  const channelFrequency = {}
  approvedVideos.forEach(video => {
    const channelId = video.channel_id || video.channelId
    const channelName = video.channel

    if (channelId && !blockedChannelIds.has(channelId)) {
      if (!channelFrequency[channelId]) {
        channelFrequency[channelId] = {
          id: channelId,
          name: channelName,
          count: 0
        }
      }
      channelFrequency[channelId].count++
    }
  })

  // Возвращаем топ каналов, отсортированных по частоте
  return Object.values(channelFrequency)
    .sort((a, b) => b.count - a.count)
}

/**
 * Анализирует ключевые слова из утвержденных видео
 */
export const getPreferredKeywords = async () => {
  const approvedVideos = await getApprovedVideos()

  // Собираем все тексты (заголовки + описания)
  const allText = approvedVideos
    .map(video => `${video.title} ${video.description || ''}`)
    .join(' ')

  return extractKeywords(allText, 20)
}

/**
 * Получает ключевые слова из заблокированного контента
 */
export const getBlockedKeywords = async () => {
  const blockedVideos = await getBlockedVideos()

  const allText = blockedVideos
    .map(video => `${video.title} ${video.description || ''}`)
    .join(' ')

  return extractKeywords(allText, 15)
}

/**
 * Анализирует популярные категории на основе утвержденных видео
 */
export const getCategoryPreferences = async () => {
  const approvedVideos = await getApprovedVideos()

  // Определяем категории на основе ключевых слов в заголовках
  const categories = {
    learning: ['алфавит', 'цифры', 'буквы', 'счет', 'учим', 'изучаем', 'обучение', 'alphabet', 'numbers', 'letters', 'reading', 'phonics'],
    creativity: ['рисование', 'лепка', 'поделки', 'творчество', 'рисуем', 'мастер-класс', 'drawing', 'crafts', 'music', 'painting', 'origami'],
    science: ['наука', 'эксперимент', 'природа', 'животные', 'космос', 'почему', 'science', 'animals', 'space', 'dinosaurs', 'nature'],
    stories: ['сказка', 'история', 'стих', 'песня', 'басня', 'fairy', 'tales', 'stories', 'lullaby', 'nursery'],
    physical: ['зарядка', 'танец', 'физкультура', 'гимнастика', 'спорт', 'игра', 'exercise', 'dance', 'yoga', 'sports', 'fitness'],
    languages: ['английский', 'испанский', 'французский', 'немецкий', 'китайский', 'english', 'spanish', 'french', 'german', 'chinese', 'language'],
    math: ['сложение', 'вычитание', 'умножение', 'геометрия', 'математика', 'addition', 'subtraction', 'multiplication', 'geometry', 'counting', 'math'],
    life: ['готовка', 'гигиена', 'безопасность', 'вежливость', 'эмоции', 'cooking', 'hygiene', 'safety', 'manners', 'emotions']
  }

  const categoryScores = {
    learning: 0,
    creativity: 0,
    science: 0,
    stories: 0,
    physical: 0,
    languages: 0,
    math: 0,
    life: 0
  }

  approvedVideos.forEach(video => {
    const text = `${video.title} ${video.description || ''}`.toLowerCase()

    Object.entries(categories).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          categoryScores[category]++
        }
      })
    })
  })

  return categoryScores
}

/**
 * Улучшает поисковый запрос на основе предпочтений пользователя
 */
export const enhanceSearchQuery = async (query, ageGroup) => {
  const preferredKeywords = await getPreferredKeywords()

  let enhancedQuery = query

  // Добавляем английское слово для образовательного контента
  enhancedQuery += ' educational kids'

  // Добавляем возрастную группу на английском
  const ageMapping = {
    '0-2': 'baby toddler',
    '3-5': 'preschool',
    '6-8': 'children elementary',
    '9-12': 'kids teens'
  }

  if (ageGroup && ageMapping[ageGroup]) {
    enhancedQuery += ` ${ageMapping[ageGroup]}`
  }

  // Если у пользователя есть история, добавляем топ ключевое слово
  if (preferredKeywords.length > 0) {
    // Берем первое ключевое слово, которого нет в запросе
    const keywordToAdd = preferredKeywords.find(kw => !query.toLowerCase().includes(kw))
    if (keywordToAdd) {
      enhancedQuery += ` ${keywordToAdd}`
    }
  }

  return enhancedQuery.trim()
}

/**
 * Фильтрует результаты поиска на основе заблокированных каналов
 */
export const filterSearchResults = async (results) => {
  const blockedChannels = await getBlockedChannels()
  const blockedChannelIds = new Set(blockedChannels.map(ch => ch.id))

  return results.filter(video => {
    const channelId = video.channelId || video.channel_id
    return !blockedChannelIds.has(channelId)
  })
}

/**
 * Вычисляет релевантность видео на основе предпочтений пользователя
 */
export const calculateVideoRelevance = async (video) => {
  const preferredKeywords = await getPreferredKeywords()
  const preferredChannels = await getPreferredChannels()
  const blockedKeywords = await getBlockedKeywords()

  let score = 0
  const videoText = `${video.title} ${video.description || ''}`.toLowerCase()
  const channelId = video.channelId || video.channel_id

  // Бонус за ключевые слова из предпочтений
  preferredKeywords.forEach(keyword => {
    if (videoText.includes(keyword)) {
      score += 2
    }
  })

  // Большой бонус за предпочтительный канал
  const isPreferredChannel = preferredChannels.some(ch => ch.id === channelId)
  if (isPreferredChannel) {
    score += 10
  }

  // Штраф за ключевые слова из заблокированного контента
  blockedKeywords.forEach(keyword => {
    if (videoText.includes(keyword)) {
      score -= 3
    }
  })

  return Math.max(0, score)
}

/**
 * Ранжирует результаты поиска по релевантности
 */
export const rankSearchResults = async (results) => {
  // Вычисляем релевантность для каждого видео
  const videosWithScores = await Promise.all(
    results.map(async video => ({
      ...video,
      relevanceScore: await calculateVideoRelevance(video)
    }))
  )

  // Сортируем по релевантности (сначала самые релевантные)
  return videosWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

/**
 * Получает персонализированные рекомендации категорий
 */
export const getPersonalizedCategories = async () => {
  const categoryScores = await getCategoryPreferences()
  const approvedVideos = await getApprovedVideos()

  // Если видео мало (меньше 5), возвращаем стандартные категории
  if (approvedVideos.length < 5) {
    return null
  }

  // Сортируем категории по популярности
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)

  return {
    scores: categoryScores,
    topCategories: sortedCategories.map(([cat]) => cat),
    hasEnoughData: approvedVideos.length >= 5
  }
}

/**
 * Генерирует умные рекомендации тем на основе истории
 */
export const generateSmartTopics = async () => {
  const keywords = await getPreferredKeywords()
  const channels = await getPreferredChannels()

  const topics = []

  // Добавляем темы на основе популярных ключевых слов
  keywords.slice(0, 5).forEach(keyword => {
    topics.push({
      type: 'keyword',
      value: keyword,
      label: keyword.charAt(0).toUpperCase() + keyword.slice(1)
    })
  })

  // Добавляем темы на основе популярных каналов
  channels.slice(0, 3).forEach(channel => {
    topics.push({
      type: 'channel',
      value: channel.name,
      label: `Больше от ${channel.name}`,
      channelId: channel.id
    })
  })

  return topics
}

/**
 * Получает трендовые темы на основе популярных видео YouTube для определенного возраста
 */
export const getTrendingTopicsForAge = async (ageGroup) => {
  try {
    // Получаем больше трендовых видео для более точного анализа
    const trendingVideos = await getTrendingVideosForAge(ageGroup, 25)

    console.log(`Получено трендовых видео для ${ageGroup}:`, trendingVideos.length)

    if (trendingVideos.length === 0) {
      console.warn(`Нет трендовых видео для возраста ${ageGroup}`)
      return []
    }

    // Собираем все тексты из трендовых видео (приоритет заголовкам)
    const allText = trendingVideos
      .map(video => {
        // Заголовки учитываются 4 раза для большего веса
        const titleRepeated = Array(4).fill(video.title).join(' ')
        return titleRepeated
      })
      .join(' ')

    // Извлекаем больше ключевых слов
    const keywords = extractKeywords(allText, 12)

    console.log(`Трендовые темы для ${ageGroup}:`, keywords)

    // Если ключевых слов мало, логируем предупреждение
    if (keywords.length < 5) {
      console.warn(`Мало ключевых слов для ${ageGroup}: ${keywords.length}`)
    }

    // Формируем темы из ключевых слов
    return keywords.map(keyword => ({
      type: 'trending',
      value: keyword,
      label: `🔥 ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`,
      isTrending: true
    }))
  } catch (error) {
    console.error('Ошибка получения трендовых тем:', error)
    return []
  }
}

/**
 * Генерирует комбинированные рекомендации: персональные + трендовые
 */
export const getCombinedRecommendations = async (ageGroup) => {
  const personalTopics = await generateSmartTopics()
  const trendingTopics = await getTrendingTopicsForAge(ageGroup)

  // Объединяем: сначала персональные, потом трендовые
  return {
    personal: personalTopics,
    trending: trendingTopics,
    hasPersonal: personalTopics.length > 0,
    hasTrending: trendingTopics.length > 0
  }
}
