import { describe, it, expect, vi } from 'vitest'
import {
  formatDuration,
  formatViewCount,
  truncateText,
  isValidYouTubeUrl,
  extractVideoId,
  debounce
} from '../helpers'

describe('formatDuration', () => {
  it('форматирует часы, минуты и секунды', () => {
    expect(formatDuration('PT1H2M10S')).toBe('1:02:10')
  })

  it('форматирует только минуты и секунды', () => {
    expect(formatDuration('PT5M30S')).toBe('5:30')
  })

  it('форматирует только секунды', () => {
    expect(formatDuration('PT45S')).toBe('0:45')
  })

  it('форматирует только минуты', () => {
    expect(formatDuration('PT10M')).toBe('10:00')
  })

  it('форматирует только часы', () => {
    expect(formatDuration('PT2H')).toBe('2:00:00')
  })

  it('возвращает 0:00 для невалидного формата', () => {
    expect(formatDuration('invalid')).toBe('0:00')
  })

  it('добавляет ведущие нули к минутам и секундам при наличии часов', () => {
    expect(formatDuration('PT1H0M5S')).toBe('1:00:05')
  })
})

describe('formatViewCount', () => {
  it('форматирует миллионы', () => {
    expect(formatViewCount('1500000')).toBe('1.5M')
  })

  it('форматирует тысячи', () => {
    expect(formatViewCount('2500')).toBe('2.5K')
  })

  it('возвращает число как строку для малых значений', () => {
    expect(formatViewCount('500')).toBe('500')
  })

  it('форматирует ровно миллион', () => {
    expect(formatViewCount('1000000')).toBe('1.0M')
  })

  it('форматирует ровно тысячу', () => {
    expect(formatViewCount('1000')).toBe('1.0K')
  })
})

describe('truncateText', () => {
  it('не обрезает текст короче лимита', () => {
    expect(truncateText('Привет', 20)).toBe('Привет')
  })

  it('обрезает текст длиннее лимита и добавляет "..."', () => {
    expect(truncateText('Очень длинный текст для теста', 10)).toBe('Очень длин...')
  })

  it('не обрезает текст ровно на границе', () => {
    expect(truncateText('12345', 5)).toBe('12345')
  })
})

describe('isValidYouTubeUrl', () => {
  it('принимает валидные youtube.com URL', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=abc123')).toBe(true)
    expect(isValidYouTubeUrl('http://youtube.com/watch?v=abc123')).toBe(true)
  })

  it('принимает валидные youtu.be URL', () => {
    expect(isValidYouTubeUrl('https://youtu.be/abc123')).toBe(true)
  })

  it('отклоняет невалидные URL', () => {
    expect(isValidYouTubeUrl('https://google.com')).toBe(false)
    expect(isValidYouTubeUrl('not a url')).toBe(false)
    expect(isValidYouTubeUrl('')).toBe(false)
  })
})

describe('extractVideoId', () => {
  it('извлекает ID из watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('извлекает ID из короткого URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('извлекает ID из embed URL', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('возвращает null для невалидного URL', () => {
    expect(extractVideoId('https://google.com')).toBeNull()
    expect(extractVideoId('not a url')).toBeNull()
  })
})

describe('debounce', () => {
  it('вызывает функцию после задержки', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()

    vi.useRealTimers()
  })

  it('сбрасывает таймер при повторном вызове', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(50)
    debounced() // сброс таймера
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledOnce()

    vi.useRealTimers()
  })

  it('передает аргументы в оборачиваемую функцию', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a', 'b')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('a', 'b')

    vi.useRealTimers()
  })
})
