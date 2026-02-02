import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

// Мокаем supabase — кэш возвращает null (cache miss) чтобы тесты шли через YouTube API
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      upsert: vi.fn().mockResolvedValue({ error: null })
    }))
  }
}))

// Мокаем import.meta.env через vi.stubEnv
beforeEach(() => {
  vi.stubEnv('VITE_YOUTUBE_API_KEY', 'test-api-key')
  vi.clearAllMocks()
})

// Ре-импорт модуля для каждого теста с обновлённым env
const loadModule = async () => {
  vi.resetModules()
  return await import('../youtubeApi.js')
}

describe('searchVideos', () => {
  it('возвращает форматированные результаты поиска', async () => {
    const { searchVideos } = await loadModule()

    // Мок ответа search
    axios.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: { videoId: 'vid1' },
            snippet: {
              title: 'Test Video',
              description: 'A test video',
              thumbnails: { medium: { url: 'https://img.youtube.com/vi/vid1/mqdefault.jpg' } },
              channelTitle: 'Test Channel',
              channelId: 'ch1',
              publishedAt: '2024-01-01T00:00:00Z'
            }
          }
        ]
      }
    })

    // Мок ответа videos (детали)
    axios.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'vid1',
            contentDetails: { duration: 'PT5M30S' },
            statistics: { viewCount: '1000' }
          }
        ]
      }
    })

    const results = await searchVideos('kids learning')

    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      id: 'vid1',
      title: 'Test Video',
      description: 'A test video',
      thumbnail: 'https://img.youtube.com/vi/vid1/mqdefault.jpg',
      channel: 'Test Channel',
      channelId: 'ch1',
      publishedAt: '2024-01-01T00:00:00Z',
      duration: '5:30',
      durationSeconds: 330,
      viewCount: '1000'
    })

    // Проверяем что search запрос с safeSearch: 'strict'
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/search'),
      expect.objectContaining({
        params: expect.objectContaining({
          safeSearch: 'strict',
          q: 'kids learning'
        })
      })
    )
  })

  it('выбрасывает ошибку при 403 (quota exceeded)', async () => {
    const { searchVideos } = await loadModule()

    axios.get.mockRejectedValueOnce({
      response: { status: 403 }
    })

    await expect(searchVideos('test')).rejects.toThrow('YouTube API quota exceeded')
  })

  it('выбрасывает ошибку при 400 (invalid query)', async () => {
    const { searchVideos } = await loadModule()

    axios.get.mockRejectedValueOnce({
      response: { status: 400 }
    })

    await expect(searchVideos('test')).rejects.toThrow('Invalid search query')
  })

  it('выбрасывает ошибку при отсутствии API ключа', async () => {
    vi.stubEnv('VITE_YOUTUBE_API_KEY', '')
    const { searchVideos } = await loadModule()

    await expect(searchVideos('test')).rejects.toThrow('YouTube API key is not configured')
  })
})

describe('getVideoDetails', () => {
  it('возвращает детали видео', async () => {
    const { getVideoDetails } = await loadModule()

    axios.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'vid1',
            snippet: {
              title: 'Test Video',
              description: 'Description',
              thumbnails: { medium: { url: 'thumb.jpg' } },
              channelTitle: 'Channel',
              channelId: 'ch1'
            },
            contentDetails: { duration: 'PT10M' },
            statistics: { viewCount: '5000', likeCount: '100' }
          }
        ]
      }
    })

    const result = await getVideoDetails('vid1')

    expect(result.id).toBe('vid1')
    expect(result.title).toBe('Test Video')
    expect(result.duration).toBe('10:00')
    expect(result.viewCount).toBe('5000')
  })

  it('выбрасывает ошибку если видео не найдено', async () => {
    const { getVideoDetails } = await loadModule()

    axios.get.mockResolvedValueOnce({
      data: { items: [] }
    })

    await expect(getVideoDetails('nonexistent')).rejects.toThrow('Failed to fetch video details')
  })
})

describe('getChannelInfo', () => {
  it('возвращает информацию о канале', async () => {
    const { getChannelInfo } = await loadModule()

    axios.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'ch1',
            snippet: {
              title: 'Kids Channel',
              description: 'Educational content',
              thumbnails: { default: { url: 'channel_thumb.jpg' } }
            },
            statistics: { subscriberCount: '1000000' }
          }
        ]
      }
    })

    const result = await getChannelInfo('ch1')

    expect(result).toEqual({
      id: 'ch1',
      name: 'Kids Channel',
      description: 'Educational content',
      thumbnail: 'channel_thumb.jpg',
      subscriberCount: '1000000'
    })
  })
})
