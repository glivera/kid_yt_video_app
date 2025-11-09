import axios from 'axios'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

// Функция для форматирования длительности видео из ISO 8601 в читаемый формат
const formatDuration = (isoDuration) => {
  if (!isoDuration) return 'N/A'

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 'N/A'

  const hours = match[1] ? parseInt(match[1]) : 0
  const minutes = match[2] ? parseInt(match[2]) : 0
  const seconds = match[3] ? parseInt(match[3]) : 0

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const searchVideos = async (query, maxResults = 20) => {
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured. Please add VITE_YOUTUBE_API_KEY to your .env file')
  }

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
        videoCategoryId: '27' // Education category
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
        viewCount: item.statistics.viewCount
      }
    })

    return response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channel: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      duration: videoDetailsMap[item.id.videoId]?.duration || 'N/A',
      viewCount: videoDetailsMap[item.id.videoId]?.viewCount || '0'
    }))
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
