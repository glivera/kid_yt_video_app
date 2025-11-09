import { useState } from 'react'
import './ParentComponents.css'

const VideoSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const handleSearch = (e) => {
    e.preventDefault()
    // TODO: Интеграция с YouTube API
    console.log('Поиск:', searchQuery)
    // Заглушка для демонстрации
    setSearchResults([
      {
        id: '1',
        title: 'Пример образовательного видео для детей',
        channel: 'Детский канал',
        thumbnail: 'https://via.placeholder.com/320x180',
        duration: '10:25'
      }
    ])
  }

  const handleApprove = (video) => {
    console.log('Утвердить видео:', video)
    // TODO: Сохранить в список утвержденных
  }

  const handleBlock = (video) => {
    console.log('Заблокировать видео:', video)
    // TODO: Добавить в список заблокированных
  }

  return (
    <div className="video-search">
      <h2>Поиск видео на YouTube</h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Введите ключевые слова для поиска..."
          className="search-input"
        />
        <button type="submit" className="button button-primary">
          Искать
        </button>
      </form>

      <div className="search-results">
        {searchResults.map((video) => (
          <div key={video.id} className="video-card">
            <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
            <div className="video-info">
              <h3 className="video-title">{video.title}</h3>
              <p className="video-channel">{video.channel}</p>
              <p className="video-duration">{video.duration}</p>
            </div>
            <div className="video-actions">
              <button
                onClick={() => handleApprove(video)}
                className="button button-primary"
              >
                Утвердить
              </button>
              <button
                onClick={() => handleBlock(video)}
                className="button button-secondary"
              >
                Заблокировать
              </button>
            </div>
          </div>
        ))}
      </div>

      {searchResults.length === 0 && (
        <p className="empty-state">
          Введите поисковый запрос, чтобы найти видео для детей
        </p>
      )}
    </div>
  )
}

export default VideoSearch
