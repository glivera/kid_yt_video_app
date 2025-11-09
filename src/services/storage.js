// Локальное хранилище данных (в будущем можно заменить на API)

const STORAGE_KEYS = {
  APPROVED_VIDEOS: 'approvedVideos',
  BLOCKED_VIDEOS: 'blockedVideos',
  BLOCKED_CHANNELS: 'blockedChannels',
  WATCH_HISTORY: 'watchHistory'
}

// Утвержденные видео
export const getApprovedVideos = () => {
  const data = localStorage.getItem(STORAGE_KEYS.APPROVED_VIDEOS)
  return data ? JSON.parse(data) : []
}

export const addApprovedVideo = (video) => {
  const videos = getApprovedVideos()
  const exists = videos.find(v => v.id === video.id)

  if (!exists) {
    videos.push({
      ...video,
      approvedAt: new Date().toISOString()
    })
    localStorage.setItem(STORAGE_KEYS.APPROVED_VIDEOS, JSON.stringify(videos))
  }

  return videos
}

export const removeApprovedVideo = (videoId) => {
  const videos = getApprovedVideos()
  const filtered = videos.filter(v => v.id !== videoId)
  localStorage.setItem(STORAGE_KEYS.APPROVED_VIDEOS, JSON.stringify(filtered))
  return filtered
}

// Заблокированные видео
export const getBlockedVideos = () => {
  const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_VIDEOS)
  return data ? JSON.parse(data) : []
}

export const addBlockedVideo = (video) => {
  const videos = getBlockedVideos()
  const exists = videos.find(v => v.id === video.id)

  if (!exists) {
    videos.push({
      ...video,
      blockedAt: new Date().toISOString()
    })
    localStorage.setItem(STORAGE_KEYS.BLOCKED_VIDEOS, JSON.stringify(videos))
  }

  return videos
}

export const removeBlockedVideo = (videoId) => {
  const videos = getBlockedVideos()
  const filtered = videos.filter(v => v.id !== videoId)
  localStorage.setItem(STORAGE_KEYS.BLOCKED_VIDEOS, JSON.stringify(filtered))
  return filtered
}

// Заблокированные каналы
export const getBlockedChannels = () => {
  const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_CHANNELS)
  return data ? JSON.parse(data) : []
}

export const addBlockedChannel = (channel) => {
  const channels = getBlockedChannels()
  const exists = channels.find(c => c.id === channel.id)

  if (!exists) {
    channels.push({
      ...channel,
      blockedAt: new Date().toISOString()
    })
    localStorage.setItem(STORAGE_KEYS.BLOCKED_CHANNELS, JSON.stringify(channels))
  }

  return channels
}

export const removeBlockedChannel = (channelId) => {
  const channels = getBlockedChannels()
  const filtered = channels.filter(c => c.id !== channelId)
  localStorage.setItem(STORAGE_KEYS.BLOCKED_CHANNELS, JSON.stringify(filtered))
  return filtered
}

export const isChannelBlocked = (channelId) => {
  const channels = getBlockedChannels()
  return channels.some(c => c.id === channelId)
}

// История просмотров
export const getWatchHistory = () => {
  const data = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY)
  return data ? JSON.parse(data) : []
}

export const addToWatchHistory = (video) => {
  const history = getWatchHistory()

  // Удаляем дубликат, если видео уже было в истории
  const filtered = history.filter(h => h.videoId !== video.id)

  // Добавляем в начало
  filtered.unshift({
    videoId: video.id,
    title: video.title,
    channel: video.channel,
    thumbnail: video.thumbnail,
    watchedAt: new Date().toISOString()
  })

  // Храним только последние 50 записей
  const trimmed = filtered.slice(0, 50)

  localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(trimmed))
  return trimmed
}

export const clearWatchHistory = () => {
  localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify([]))
  return []
}
