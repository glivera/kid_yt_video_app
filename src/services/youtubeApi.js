import axios from 'axios'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

export const searchVideos = async (query, maxResults = 20) => {
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
        videoCategoryId: '1' // Film & Animation, Education
      }
    })

    return response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt
    }))
  } catch (error) {
    console.error('Error searching videos:', error)
    throw error
  }
}

export const getVideoDetails = async (videoId) => {
  try {
    const response = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoId,
        key: API_KEY
      }
    })

    const video = response.data.items[0]
    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.medium.url,
      channel: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount
    }
  } catch (error) {
    console.error('Error fetching video details:', error)
    throw error
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
