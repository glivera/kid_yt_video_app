import { supabase } from '../config/supabase'

// Получаем ID текущего пользователя из localStorage (временно, пока не настроена полная авторизация)
const getCurrentUserId = () => {
  const user = localStorage.getItem('user')
  if (user) {
    const userData = JSON.parse(user)
    return userData.username || 'guest'
  }
  return 'guest'
}

// Проверяем, настроен ли Supabase
const isSupabaseConfigured = () => {
  return supabase !== null
}

// ========================================
// УТВЕРЖДЕННЫЕ ВИДЕО
// ========================================

export const getApprovedVideos = async () => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('kid_app_approved_videos')
        .select('*')
        .eq('user_id', userId)
        .order('approved_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching approved videos from Supabase:', error)
      // Fallback to localStorage
      return getApprovedVideosFromLocalStorage()
    }
  } else {
    return getApprovedVideosFromLocalStorage()
  }
}

const getApprovedVideosFromLocalStorage = () => {
  const data = localStorage.getItem('approvedVideos')
  return data ? JSON.parse(data) : []
}

export const addApprovedVideo = async (video) => {
  const userId = getCurrentUserId()
  console.log('addApprovedVideo called with:', video)
  console.log('Current userId:', userId)
  console.log('Supabase configured:', isSupabaseConfigured())

  if (isSupabaseConfigured()) {
    try {
      // Проверяем, существует ли уже видео
      const { data: existing } = await supabase
        .from('kid_app_approved_videos')
        .select('id')
        .eq('id', video.id)
        .eq('user_id', userId)
        .single()

      if (existing) {
        console.log('Video already approved')
        return await getApprovedVideos()
      }

      // Добавляем новое видео
      const { error } = await supabase
        .from('kid_app_approved_videos')
        .insert([{
          id: video.id,
          title: video.title,
          description: video.description || '',
          thumbnail: video.thumbnail || '',
          channel: video.channel || '',
          channel_id: video.channelId || video.channel_id || '',
          duration: video.duration || '',
          view_count: video.viewCount || video.view_count || '0',
          user_id: userId
        }])

      if (error) throw error
      console.log('Video added to Supabase successfully')
      return await getApprovedVideos()
    } catch (error) {
      console.error('Error adding approved video to Supabase:', error)
      // Fallback to localStorage
      console.log('Falling back to localStorage')
      return addApprovedVideoToLocalStorage(video)
    }
  } else {
    console.log('Supabase not configured, using localStorage')
    return addApprovedVideoToLocalStorage(video)
  }
}

const addApprovedVideoToLocalStorage = (video) => {
  console.log('addApprovedVideoToLocalStorage called')
  const videos = getApprovedVideosFromLocalStorage()
  console.log('Current videos in localStorage:', videos.length)
  const exists = videos.find(v => v.id === video.id)

  if (!exists) {
    const videoToAdd = {
      ...video,
      approvedAt: new Date().toISOString()
    }
    videos.push(videoToAdd)
    console.log('Adding video to localStorage:', videoToAdd)
    localStorage.setItem('approvedVideos', JSON.stringify(videos))
    console.log('Video saved. Total videos now:', videos.length)
  } else {
    console.log('Video already exists in localStorage')
  }

  return videos
}

export const removeApprovedVideo = async (videoId) => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('kid_app_approved_videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', userId)

      if (error) throw error
      return await getApprovedVideos()
    } catch (error) {
      console.error('Error removing approved video from Supabase:', error)
      return removeApprovedVideoFromLocalStorage(videoId)
    }
  } else {
    return removeApprovedVideoFromLocalStorage(videoId)
  }
}

const removeApprovedVideoFromLocalStorage = (videoId) => {
  const videos = getApprovedVideosFromLocalStorage()
  const filtered = videos.filter(v => v.id !== videoId)
  localStorage.setItem('approvedVideos', JSON.stringify(filtered))
  return filtered
}

// ========================================
// ЗАБЛОКИРОВАННЫЕ ВИДЕО
// ========================================

export const getBlockedVideos = async () => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('kid_app_blocked_videos')
        .select('*')
        .eq('user_id', userId)
        .order('blocked_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching blocked videos from Supabase:', error)
      return getBlockedVideosFromLocalStorage()
    }
  } else {
    return getBlockedVideosFromLocalStorage()
  }
}

const getBlockedVideosFromLocalStorage = () => {
  const data = localStorage.getItem('blockedVideos')
  return data ? JSON.parse(data) : []
}

export const addBlockedVideo = async (video) => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { data: existing } = await supabase
        .from('kid_app_blocked_videos')
        .select('id')
        .eq('id', video.id)
        .eq('user_id', userId)
        .single()

      if (existing) {
        return await getBlockedVideos()
      }

      const { error } = await supabase
        .from('kid_app_blocked_videos')
        .insert([{
          id: video.id,
          title: video.title,
          description: video.description || '',
          thumbnail: video.thumbnail || '',
          channel: video.channel || '',
          channel_id: video.channelId || video.channel_id || '',
          user_id: userId
        }])

      if (error) throw error
      return await getBlockedVideos()
    } catch (error) {
      console.error('Error adding blocked video to Supabase:', error)
      return addBlockedVideoToLocalStorage(video)
    }
  } else {
    return addBlockedVideoToLocalStorage(video)
  }
}

const addBlockedVideoToLocalStorage = (video) => {
  const videos = getBlockedVideosFromLocalStorage()
  const exists = videos.find(v => v.id === video.id)

  if (!exists) {
    videos.push({
      ...video,
      blockedAt: new Date().toISOString()
    })
    localStorage.setItem('blockedVideos', JSON.stringify(videos))
  }

  return videos
}

export const removeBlockedVideo = async (videoId) => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('kid_app_blocked_videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', userId)

      if (error) throw error
      return await getBlockedVideos()
    } catch (error) {
      console.error('Error removing blocked video from Supabase:', error)
      return removeBlockedVideoFromLocalStorage(videoId)
    }
  } else {
    return removeBlockedVideoFromLocalStorage(videoId)
  }
}

const removeBlockedVideoFromLocalStorage = (videoId) => {
  const videos = getBlockedVideosFromLocalStorage()
  const filtered = videos.filter(v => v.id !== videoId)
  localStorage.setItem('blockedVideos', JSON.stringify(filtered))
  return filtered
}

// ========================================
// ЗАБЛОКИРОВАННЫЕ КАНАЛЫ
// ========================================

export const getBlockedChannels = async () => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('kid_app_blocked_channels')
        .select('*')
        .eq('user_id', userId)
        .order('blocked_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching blocked channels from Supabase:', error)
      return getBlockedChannelsFromLocalStorage()
    }
  } else {
    return getBlockedChannelsFromLocalStorage()
  }
}

const getBlockedChannelsFromLocalStorage = () => {
  const data = localStorage.getItem('blockedChannels')
  return data ? JSON.parse(data) : []
}

export const addBlockedChannel = async (channel) => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { data: existing } = await supabase
        .from('kid_app_blocked_channels')
        .select('id')
        .eq('id', channel.id)
        .eq('user_id', userId)
        .single()

      if (existing) {
        return await getBlockedChannels()
      }

      const { error } = await supabase
        .from('kid_app_blocked_channels')
        .insert([{
          id: channel.id,
          name: channel.name,
          description: channel.description || '',
          thumbnail: channel.thumbnail || '',
          subscriber_count: channel.subscriberCount || channel.subscriber_count || '0',
          user_id: userId
        }])

      if (error) throw error
      return await getBlockedChannels()
    } catch (error) {
      console.error('Error adding blocked channel to Supabase:', error)
      return addBlockedChannelToLocalStorage(channel)
    }
  } else {
    return addBlockedChannelToLocalStorage(channel)
  }
}

const addBlockedChannelToLocalStorage = (channel) => {
  const channels = getBlockedChannelsFromLocalStorage()
  const exists = channels.find(c => c.id === channel.id)

  if (!exists) {
    channels.push({
      ...channel,
      blockedAt: new Date().toISOString()
    })
    localStorage.setItem('blockedChannels', JSON.stringify(channels))
  }

  return channels
}

export const removeBlockedChannel = async (channelId) => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('kid_app_blocked_channels')
        .delete()
        .eq('id', channelId)
        .eq('user_id', userId)

      if (error) throw error
      return await getBlockedChannels()
    } catch (error) {
      console.error('Error removing blocked channel from Supabase:', error)
      return removeBlockedChannelFromLocalStorage(channelId)
    }
  } else {
    return removeBlockedChannelFromLocalStorage(channelId)
  }
}

const removeBlockedChannelFromLocalStorage = (channelId) => {
  const channels = getBlockedChannelsFromLocalStorage()
  const filtered = channels.filter(c => c.id !== channelId)
  localStorage.setItem('blockedChannels', JSON.stringify(filtered))
  return filtered
}

export const isChannelBlocked = async (channelId) => {
  const channels = await getBlockedChannels()
  return channels.some(c => c.id === channelId)
}

// ========================================
// ИСТОРИЯ ПРОСМОТРОВ
// ========================================

export const getWatchHistory = async () => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('kid_app_watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching watch history from Supabase:', error)
      return getWatchHistoryFromLocalStorage()
    }
  } else {
    return getWatchHistoryFromLocalStorage()
  }
}

const getWatchHistoryFromLocalStorage = () => {
  const data = localStorage.getItem('watchHistory')
  return data ? JSON.parse(data) : []
}

export const addToWatchHistory = async (video) => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      // Удаляем предыдущую запись этого видео, если есть
      await supabase
        .from('kid_app_watch_history')
        .delete()
        .eq('video_id', video.id)
        .eq('user_id', userId)

      // Добавляем новую запись
      const { error } = await supabase
        .from('kid_app_watch_history')
        .insert([{
          video_id: video.id,
          title: video.title,
          channel: video.channel || '',
          thumbnail: video.thumbnail || '',
          user_id: userId
        }])

      if (error) throw error
      return await getWatchHistory()
    } catch (error) {
      console.error('Error adding to watch history in Supabase:', error)
      return addToWatchHistoryToLocalStorage(video)
    }
  } else {
    return addToWatchHistoryToLocalStorage(video)
  }
}

const addToWatchHistoryToLocalStorage = (video) => {
  const history = getWatchHistoryFromLocalStorage()

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

  localStorage.setItem('watchHistory', JSON.stringify(trimmed))
  return trimmed
}

export const clearWatchHistory = async () => {
  const userId = getCurrentUserId()

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('kid_app_watch_history')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      return []
    } catch (error) {
      console.error('Error clearing watch history in Supabase:', error)
      return clearWatchHistoryFromLocalStorage()
    }
  } else {
    return clearWatchHistoryFromLocalStorage()
  }
}

const clearWatchHistoryFromLocalStorage = () => {
  localStorage.setItem('watchHistory', JSON.stringify([]))
  return []
}
