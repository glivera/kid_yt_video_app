import { describe, it, expect, vi, beforeEach } from 'vitest'

// Мокаем зависимости
vi.mock('../storage', () => ({
  getApprovedVideos: vi.fn(),
  getBlockedVideos: vi.fn(),
  getBlockedChannels: vi.fn(),
  getWatchHistory: vi.fn()
}))

vi.mock('../youtubeApi', () => ({
  getTrendingVideosForAge: vi.fn()
}))

import { getApprovedVideos, getBlockedVideos, getBlockedChannels } from '../storage'
import { getTrendingVideosForAge } from '../youtubeApi'
import {
  getPreferredChannels,
  getPreferredKeywords,
  getBlockedKeywords,
  filterSearchResults,
  calculateVideoRelevance,
  enhanceSearchQuery,
  getCategoryPreferences,
  getPersonalizedCategories,
  generateSmartTopics,
  getCombinedRecommendations
} from '../preferences'

beforeEach(() => {
  vi.clearAllMocks()
})

const mockVideos = [
  { id: '1', title: 'Учим алфавит для детей', description: 'Обучение буквам', channel: 'Kids Channel', channel_id: 'ch1' },
  { id: '2', title: 'Учим цифры и счет', description: 'Математика для малышей', channel: 'Kids Channel', channel_id: 'ch1' },
  { id: '3', title: 'Science experiments for kids', description: 'Fun science', channel: 'Science Fun', channel_id: 'ch2' }
]

describe('getPreferredChannels', () => {
  it('подсчитывает частоту каналов из утверждённых видео', async () => {
    getApprovedVideos.mockResolvedValue(mockVideos)
    getBlockedChannels.mockResolvedValue([])

    const channels = await getPreferredChannels()

    expect(channels[0].id).toBe('ch1')
    expect(channels[0].count).toBe(2)
    expect(channels[1].id).toBe('ch2')
    expect(channels[1].count).toBe(1)
  })

  it('исключает заблокированные каналы', async () => {
    getApprovedVideos.mockResolvedValue(mockVideos)
    getBlockedChannels.mockResolvedValue([{ id: 'ch1' }])

    const channels = await getPreferredChannels()

    expect(channels).toHaveLength(1)
    expect(channels[0].id).toBe('ch2')
  })
})

describe('getPreferredKeywords', () => {
  it('извлекает ключевые слова из утверждённых видео', async () => {
    getApprovedVideos.mockResolvedValue(mockVideos)

    const keywords = await getPreferredKeywords()

    expect(keywords).toBeInstanceOf(Array)
    expect(keywords.length).toBeGreaterThan(0)
    // Стоп-слова должны быть отфильтрованы (например "для", "детей")
    expect(keywords).not.toContain('для')
    expect(keywords).not.toContain('детей')
  })
})

describe('getBlockedKeywords', () => {
  it('извлекает ключевые слова из заблокированных видео', async () => {
    getBlockedVideos.mockResolvedValue([
      { id: '1', title: 'Опасный контент', description: 'Плохое видео' }
    ])

    const keywords = await getBlockedKeywords()
    expect(keywords).toBeInstanceOf(Array)
  })
})

describe('filterSearchResults', () => {
  it('фильтрует видео с заблокированных каналов', async () => {
    getBlockedChannels.mockResolvedValue([{ id: 'ch_blocked' }])

    const results = [
      { id: '1', channelId: 'ch_ok', title: 'Good' },
      { id: '2', channelId: 'ch_blocked', title: 'Blocked' },
      { id: '3', channelId: 'ch_ok2', title: 'Also good' }
    ]

    const filtered = await filterSearchResults(results)

    expect(filtered).toHaveLength(2)
    expect(filtered.map(v => v.id)).toEqual(['1', '3'])
  })

  it('возвращает все результаты если нет заблокированных каналов', async () => {
    getBlockedChannels.mockResolvedValue([])

    const results = [{ id: '1', channelId: 'ch1', title: 'Video' }]
    const filtered = await filterSearchResults(results)

    expect(filtered).toHaveLength(1)
  })
})

describe('calculateVideoRelevance', () => {
  it('даёт высокий балл видео с предпочтительного канала', async () => {
    getApprovedVideos.mockResolvedValue(mockVideos)
    getBlockedVideos.mockResolvedValue([])
    getBlockedChannels.mockResolvedValue([])

    const score = await calculateVideoRelevance({
      title: 'Новое видео',
      description: '',
      channelId: 'ch1' // предпочтительный канал (2 видео)
    })

    expect(score).toBeGreaterThanOrEqual(10) // бонус за канал = 10
  })

  it('даёт 0 баллов нерелевантному видео', async () => {
    getApprovedVideos.mockResolvedValue([])
    getBlockedVideos.mockResolvedValue([])
    getBlockedChannels.mockResolvedValue([])

    const score = await calculateVideoRelevance({
      title: 'Random video',
      description: '',
      channelId: 'unknown'
    })

    expect(score).toBe(0)
  })
})

describe('enhanceSearchQuery', () => {
  it('добавляет возрастную группу к запросу', async () => {
    getApprovedVideos.mockResolvedValue([])

    const enhanced = await enhanceSearchQuery('рисование', '3-5')

    expect(enhanced).toContain('рисование')
    expect(enhanced).toContain('preschool')
    expect(enhanced).toContain('educational kids')
  })

  it('работает без возрастной группы', async () => {
    getApprovedVideos.mockResolvedValue([])

    const enhanced = await enhanceSearchQuery('наука')

    expect(enhanced).toContain('наука')
    expect(enhanced).toContain('educational kids')
  })
})

describe('getCategoryPreferences', () => {
  it('подсчитывает баллы категорий по ключевым словам', async () => {
    getApprovedVideos.mockResolvedValue([
      { title: 'Учим алфавит буквы', description: '' },
      { title: 'Учим счет цифры', description: '' },
      { title: 'Рисование для детей', description: 'творчество' }
    ])

    const scores = await getCategoryPreferences()

    expect(scores.learning).toBeGreaterThan(0)
    expect(scores.creativity).toBeGreaterThan(0)
  })
})

describe('getPersonalizedCategories', () => {
  it('возвращает null при менее 5 видео', async () => {
    getApprovedVideos.mockResolvedValue(mockVideos) // 3 видео

    const result = await getPersonalizedCategories()
    expect(result).toBeNull()
  })

  it('возвращает категории при 5+ видео', async () => {
    const videos = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      title: 'Учим алфавит буквы',
      description: ''
    }))
    getApprovedVideos.mockResolvedValue(videos)

    const result = await getPersonalizedCategories()
    expect(result).not.toBeNull()
    expect(result.hasEnoughData).toBe(true)
    expect(result.topCategories).toBeInstanceOf(Array)
  })
})

describe('generateSmartTopics', () => {
  it('генерирует темы из ключевых слов и каналов', async () => {
    getApprovedVideos.mockResolvedValue(mockVideos)
    getBlockedChannels.mockResolvedValue([])

    const topics = await generateSmartTopics()

    expect(topics).toBeInstanceOf(Array)
    // Должны быть темы типа keyword и channel
    const types = topics.map(t => t.type)
    expect(types).toContain('keyword')
    expect(types).toContain('channel')
  })
})

describe('getCombinedRecommendations', () => {
  it('объединяет персональные и трендовые рекомендации', async () => {
    getApprovedVideos.mockResolvedValue(mockVideos)
    getBlockedChannels.mockResolvedValue([])
    getTrendingVideosForAge.mockResolvedValue([
      { title: 'Trending Science Video', description: 'Popular science for kids' }
    ])

    const result = await getCombinedRecommendations('3-5')

    expect(result).toHaveProperty('personal')
    expect(result).toHaveProperty('trending')
    expect(result).toHaveProperty('hasPersonal')
    expect(result).toHaveProperty('hasTrending')
  })
})
