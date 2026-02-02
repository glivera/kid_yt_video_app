import axios from 'axios'
import { supabase } from '../config/supabase'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

// ========================================
// Кэширование запросов в Supabase
// ========================================

const CACHE_MAX_AGE_DAYS = 2

// Нормализация запроса для одинакового хэша при похожих запросах
const normalizeQuery = (query) => {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

// Простой строковый хэш (crypto не нужен — это ключ кэша, не безопасность)
const hashQuery = (normalizedQuery) => {
  let hash = 0
  for (let i = 0; i < normalizedQuery.length; i++) {
    const char = normalizedQuery.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return String(hash)
}

// Проверить кэш в Supabase
const getCachedResults = async (queryHash, searchType) => {
  if (!supabase) return null
  try {
    const minDate = new Date(Date.now() - CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('kid_app_search_cache')
      .select('results')
      .eq('query_hash', queryHash)
      .eq('search_type', searchType)
      .gte('created_at', minDate)
      .single()

    if (error || !data) return null
    return data.results
  } catch {
    return null
  }
}

// Сохранить результаты в кэш (upsert по query_hash + search_type)
const setCachedResults = async (queryHash, queryText, searchType, results) => {
  if (!supabase) return
  try {
    await supabase
      .from('kid_app_search_cache')
      .upsert(
        {
          query_hash: queryHash,
          query_text: queryText,
          search_type: searchType,
          results,
          created_at: new Date().toISOString()
        },
        { onConflict: 'query_hash,search_type' }
      )
  } catch (err) {
    console.warn('Не удалось сохранить кэш:', err.message)
  }
}

// Парсинг ISO 8601 длительности в секунды
const parseDurationToSeconds = (isoDuration) => {
  if (!isoDuration) return 0

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = match[1] ? parseInt(match[1]) : 0
  const minutes = match[2] ? parseInt(match[2]) : 0
  const seconds = match[3] ? parseInt(match[3]) : 0

  return hours * 3600 + minutes * 60 + seconds
}

// Функция для форматирования длительности видео из ISO 8601 в читаемый формат
const formatDuration = (isoDuration) => {
  if (!isoDuration) return 'N/A'

  const totalSeconds = parseDurationToSeconds(isoDuration)
  if (totalSeconds === 0) return 'N/A'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const searchVideos = async (query, maxResults = 20) => {
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured. Please add VITE_YOUTUBE_API_KEY to your .env file')
  }

  // Проверяем кэш в Supabase
  const normalized = normalizeQuery(query)
  const queryHash = hashQuery(normalized)
  const cached = await getCachedResults(queryHash, 'search')
  if (cached) {
    console.log(`[cache hit] Поиск "${query}" — из Supabase кэша (${cached.length} видео)`)
    return cached
  }
  console.log(`[cache miss] Поиск "${query}" — запрос к YouTube API`)

  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults,
        key: API_KEY,
        safeSearch: 'strict',
        videoEmbeddable: true,
        videoCategoryId: '27', // Education category
        relevanceLanguage: 'en', // Приоритет английскому контенту
        order: 'relevance' // Сортировка по релевантности
      }
    })

    // Получаем ID всех видео
    const videoIds = response.data.items.map(item => item.id.videoId).join(',')

    // Запрашиваем детали видео для получения длительности
    const detailsResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds,
        key: API_KEY
      }
    })

    // Создаем мапу с деталями видео
    const videoDetailsMap = {}
    detailsResponse.data.items.forEach(item => {
      videoDetailsMap[item.id] = {
        duration: formatDuration(item.contentDetails.duration),
        durationSeconds: parseDurationToSeconds(item.contentDetails.duration),
        viewCount: item.statistics.viewCount
      }
    })

    const results = response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channel: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      duration: videoDetailsMap[item.id.videoId]?.duration || 'N/A',
      durationSeconds: videoDetailsMap[item.id.videoId]?.durationSeconds || 0,
      viewCount: videoDetailsMap[item.id.videoId]?.viewCount || '0'
    }))

    // Сохраняем в Supabase кэш
    setCachedResults(queryHash, query, 'search', results)

    return results
  } catch (error) {
    console.error('Error searching videos:', error)
    if (error.response) {
      // Ошибка от API YouTube
      if (error.response.status === 403) {
        throw new Error('YouTube API quota exceeded or invalid API key')
      } else if (error.response.status === 400) {
        throw new Error('Invalid search query')
      }
    }
    throw new Error('Failed to search videos. Please try again later.')
  }
}

export const getVideoDetails = async (videoId) => {
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured. Please add VITE_YOUTUBE_API_KEY to your .env file')
  }

  try {
    const response = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoId,
        key: API_KEY
      }
    })

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found')
    }

    const video = response.data.items[0]
    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      channel: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      duration: formatDuration(video.contentDetails.duration),
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount
    }
  } catch (error) {
    console.error('Error fetching video details:', error)
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded or invalid API key')
    }
    throw new Error('Failed to fetch video details')
  }
}

export const getChannelInfo = async (channelId) => {
  try {
    const response = await axios.get(`${BASE_URL}/channels`, {
      params: {
        part: 'snippet,statistics',
        id: channelId,
        key: API_KEY
      }
    })

    const channel = response.data.items[0]
    return {
      id: channel.id,
      name: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.default.url,
      subscriberCount: channel.statistics.subscriberCount
    }
  } catch (error) {
    console.error('Error fetching channel info:', error)
    throw error
  }
}

// Кэш трендов в sessionStorage (TTL 30 мин) — экономит ~200 единиц квоты на каждый повторный запрос
const TRENDING_CACHE_TTL = 30 * 60 * 1000

const getTrendingCache = (ageGroup) => {
  try {
    const raw = sessionStorage.getItem(`trending_${ageGroup}`)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > TRENDING_CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

const setTrendingCache = (ageGroup, data) => {
  try {
    sessionStorage.setItem(`trending_${ageGroup}`, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore quota errors */ }
}

/**
 * Получает трендовые детские видео для определенной возрастной группы
 */
export const getTrendingVideosForAge = async (ageGroup, maxResults = 20) => {
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured')
  }

  // Уровень 1: sessionStorage (30 мин)
  const sessionCached = getTrendingCache(ageGroup)
  if (sessionCached) {
    console.log(`[cache hit] Тренды ${ageGroup}: из sessionStorage (${sessionCached.length} видео)`)
    return sessionCached
  }

  // Уровень 2: Supabase (2 дня)
  const trendingHash = hashQuery(`trending_${ageGroup}`)
  const dbCached = await getCachedResults(trendingHash, 'trending')
  if (dbCached) {
    console.log(`[cache hit] Тренды ${ageGroup}: из Supabase кэша (${dbCached.length} видео)`)
    setTrendingCache(ageGroup, dbCached) // обновляем sessionStorage
    return dbCached
  }
  console.log(`[cache miss] Тренды ${ageGroup}: запрос к YouTube API`)

  try {
    // Формируем английские запросы на основе возраста для получения мировых трендов
    // Делаем запросы короче и проще для лучших результатов
    const ageQueries = {
      '0-2': {
        primary: 'baby songs learning',
        fallback: 'toddler educational'
      },
      '3-5': {
        primary: 'preschool learning kids',
        fallback: 'kindergarten abc numbers'
      },
      '6-8': {
        primary: 'kids science experiments',
        fallback: 'educational videos children'
      },
      '9-12': {
        primary: 'science kids technology',
        fallback: 'educational documentary children'
      }
    }

    const queries = ageQueries[ageGroup] || { primary: 'kids educational', fallback: 'learning children' }

    console.log(`Поиск трендов для возраста ${ageGroup} с запросом: "${queries.primary}"`)

    // Пробуем основной запрос
    let response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: queries.primary,
        type: 'video',
        maxResults,
        key: API_KEY,
        safeSearch: 'strict',
        videoEmbeddable: true,
        videoCategoryId: '27', // Education category
        order: 'viewCount', // Сортируем по популярности
        publishedAfter: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // За последние 14 дней
        relevanceLanguage: 'en' // Приоритет английскому контенту
      }
    })

    // Если мало результатов, пробуем fallback запрос
    if (response.data.items.length < 10) {
      console.log(`Мало результатов (${response.data.items.length}), пробуем fallback: "${queries.fallback}"`)
      const fallbackResponse = await axios.get(`${BASE_URL}/search`, {
        params: {
          part: 'snippet',
          q: queries.fallback,
          type: 'video',
          maxResults,
          key: API_KEY,
          safeSearch: 'strict',
          videoEmbeddable: true,
          videoCategoryId: '27',
          order: 'viewCount',
          publishedAfter: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          relevanceLanguage: 'en'
        }
      })

      // Объединяем результаты
      response.data.items = [...response.data.items, ...fallbackResponse.data.items]
    }

    console.log(`Найдено трендовых видео: ${response.data.items.length}`)

    const videoIds = response.data.items.map(item => item.id.videoId).join(',')

    if (!videoIds) {
      return []
    }

    // Получаем детали видео
    const detailsResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds,
        key: API_KEY
      }
    })

    const videoDetailsMap = {}
    detailsResponse.data.items.forEach(item => {
      videoDetailsMap[item.id] = {
        duration: formatDuration(item.contentDetails.duration),
        durationSeconds: parseDurationToSeconds(item.contentDetails.duration),
        viewCount: item.statistics.viewCount
      }
    })

    const results = response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channel: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      duration: videoDetailsMap[item.id.videoId]?.duration || 'N/A',
      durationSeconds: videoDetailsMap[item.id.videoId]?.durationSeconds || 0,
      viewCount: videoDetailsMap[item.id.videoId]?.viewCount || '0'
    }))

    // Сохраняем в оба кэша
    setTrendingCache(ageGroup, results)
    setCachedResults(trendingHash, `trending_${ageGroup}`, 'trending', results)

    return results
  } catch (error) {
    console.error('Error fetching trending videos:', error)
    throw new Error('Failed to fetch trending videos')
  }
}
