import { useState } from 'react'
import './ParentComponents.css'

const VideoSearchAndRecommendations = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedAge, setSelectedAge] = useState('3-5')
  const [activeCategory, setActiveCategory] = useState(null)
  const [hoveredVideo, setHoveredVideo] = useState(null)
  const [previewVideo, setPreviewVideo] = useState(null)

  const categories = [
    { id: 'learning', name: 'Обучение и развитие', topics: ['Алфавит', 'Цифры', 'Цвета', 'Формы'] },
    { id: 'creativity', name: 'Творчество', topics: ['Рисование', 'Лепка', 'Поделки', 'Музыка'] },
    { id: 'science', name: 'Наука', topics: ['Природа', 'Животные', 'Космос', 'Эксперименты'] },
    { id: 'stories', name: 'Сказки и истории', topics: ['Русские сказки', 'Мировые сказки', 'Стихи'] },
    { id: 'physical', name: 'Физическая активность', topics: ['Зарядка', 'Танцы', 'Игры'] }
  ]

  const ageGroups = [
    { value: '0-2', label: '0-2 года' },
    { value: '3-5', label: '3-5 лет' },
    { value: '6-8', label: '6-8 лет' },
    { value: '9-12', label: '9-12 лет' }
  ]

  const performSearch = (query) => {
    console.log('Поиск:', query, 'возраст:', selectedAge)
    // TODO: Интеграция с YouTube API
    // Заглушка для демонстрации
    setSearchResults([
      {
        id: '1',
        title: `Образовательное видео: ${query}`,
        channel: 'Детский канал',
        thumbnail: 'https://via.placeholder.com/320x180',
        duration: '10:25',
        description: `Обучающее видео для детей ${selectedAge} лет по теме "${query}"`
      },
      {
        id: '2',
        title: `Развивающий контент: ${query}`,
        channel: 'Учимся играя',
        thumbnail: 'https://via.placeholder.com/320x180',
        duration: '8:15',
        description: `Интересное видео про ${query.toLowerCase()}`
      }
    ])
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      performSearch(searchQuery)
    }
  }

  const handleTopicClick = (topic, categoryId) => {
    setSearchQuery(topic)
    setActiveCategory(categoryId)
    performSearch(`${topic} для детей ${selectedAge}`)
  }

  const handlePreview = (video) => {
    setPreviewVideo(video)
  }

  const handleClosePreview = () => {
    setPreviewVideo(null)
  }

  const handleApprove = (video) => {
    console.log('Утвердить видео:', video)
    // TODO: Сохранить в список утвержденных
    if (previewVideo) {
      setPreviewVideo(null)
    }
  }

  const handleBlock = (video) => {
    console.log('Заблокировать видео:', video)
    // TODO: Добавить в список заблокированных
    if (previewVideo) {
      setPreviewVideo(null)
    }
  }

  return (
    <div className="video-search-recommendations">
      <h2>Поиск и рекомендации</h2>

      {/* Поиск */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите ключевые слова или выберите тему ниже..."
            className="search-input"
          />
          <button type="submit" className="button button-primary">
            Искать
          </button>
        </form>
      </div>

      {/* Выбор возраста */}
      <div className="age-selector">
        <label>Возраст ребенка:</label>
        <div className="age-buttons">
          {ageGroups.map((age) => (
            <button
              key={age.value}
              className={`age-button ${selectedAge === age.value ? 'active' : ''}`}
              onClick={() => setSelectedAge(age.value)}
            >
              {age.label}
            </button>
          ))}
        </div>
      </div>

      {/* Рекомендуемые темы */}
      <div className="recommendations-section">
        <h3>Рекомендуемые темы</h3>
        <p className="section-description">
          Выберите тему для поиска подходящих видео
        </p>

        <div className="categories">
          {categories.map((category) => (
            <div key={category.id} className="category-card">
              <h4 className="category-title">{category.name}</h4>
              <div className="topics">
                {category.topics.map((topic) => (
                  <button
                    key={topic}
                    className="topic-button"
                    onClick={() => handleTopicClick(topic, category.id)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Результаты поиска */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Результаты поиска</h3>
          {searchResults.map((video) => (
            <div key={video.id} className="video-card">
              <div
                className="video-thumbnail-container"
                onMouseEnter={() => setHoveredVideo(video.id)}
                onMouseLeave={() => setHoveredVideo(null)}
              >
                {hoveredVideo === video.id ? (
                  <iframe
                    className="video-thumbnail-iframe"
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&controls=0&modestbranding=1`}
                    title={video.title}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                )}
              </div>
              <div className="video-info">
                <h4 className="video-title">{video.title}</h4>
                <p className="video-channel">{video.channel}</p>
                <p className="video-duration">{video.duration}</p>
                <p className="video-description">{video.description}</p>
              </div>
              <div className="video-actions">
                <button
                  onClick={() => handlePreview(video)}
                  className="button button-preview"
                >
                  Просмотреть
                </button>
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
      )}

      {searchResults.length === 0 && (
        <div className="empty-state">
          <p>Введите поисковый запрос или выберите тему для поиска видео</p>
        </div>
      )}

      {/* Модальное окно предпросмотра */}
      {previewVideo && (
        <div className="video-preview-modal" onClick={handleClosePreview}>
          <div className="video-preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview-button" onClick={handleClosePreview}>
              ✕
            </button>
            <div className="preview-player-container">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${previewVideo.id}?autoplay=1`}
                title={previewVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="preview-video-info">
              <h3>{previewVideo.title}</h3>
              <p className="preview-channel">{previewVideo.channel}</p>
              <p className="preview-description">{previewVideo.description}</p>
            </div>
            <div className="preview-actions">
              <button
                onClick={() => handleApprove(previewVideo)}
                className="button button-primary"
              >
                Утвердить
              </button>
              <button
                onClick={() => handleBlock(previewVideo)}
                className="button button-secondary"
              >
                Заблокировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoSearchAndRecommendations
