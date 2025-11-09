// Утилиты и вспомогательные функции

export const formatDuration = (isoDuration) => {
  // Конвертирует ISO 8601 длительность (PT1H2M10S) в читаемый формат (1:02:10)
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  if (!match) return '0:00'

  const hours = parseInt(match[1]) || 0
  const minutes = parseInt(match[2]) || 0
  const seconds = parseInt(match[3]) || 0

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  } else {
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }
}

export const formatViewCount = (count) => {
  // Форматирует количество просмотров (1234567 -> 1.2M)
  const num = parseInt(count)

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  } else {
    return num.toString()
  }
}

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const isValidYouTubeUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
  return regex.test(url)
}

export const extractVideoId = (url) => {
  // Извлекает ID видео из YouTube URL
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
