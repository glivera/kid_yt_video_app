import { useState, useEffect } from 'react'
import './ParentComponents.css'
import { searchVideos } from '../../services/youtubeApi'
import { addApprovedVideo, addBlockedVideo } from '../../services/storage'
import {
  filterSearchResults,
  rankSearchResults,
  getPersonalizedCategories,
  getCombinedRecommendations,
  enhanceSearchQuery
} from '../../services/preferences'
import Toast from '../Common/Toast'

const VideoSearchAndRecommendations = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedAge, setSelectedAge] = useState('3-5')
  const [activeCategory, setActiveCategory] = useState(null)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categoryPreferences, setCategoryPreferences] = useState(null)
  const [smartTopics, setSmartTopics] = useState([])
  const [trendingTopics, setTrendingTopics] = useState([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [toast, setToast] = useState(null)
  const [minDuration, setMinDuration] = useState(0) // минимальная длительность в минутах
  const [topicLang, setTopicLang] = useState('en') // 'ru' или 'en'

  const durationOptions = [
    { value: 0, label: 'Любая' },
    { value: 1, label: '1 мин' },
    { value: 2, label: '2 мин' },
    { value: 5, label: '5 мин' },
    { value: 10, label: '10 мин' },
    { value: 15, label: '15 мин' },
    { value: 20, label: '20 мин' },
    { value: 30, label: '30 мин' }
  ]

  const categoriesData = {
    ru: [
      { id: 'learning', name: 'Обучение и развитие', topics: ['Алфавит', 'Цифры', 'Цвета', 'Формы', 'Чтение', 'Письмо', 'Логика', 'Память', 'Внимание', 'Слова'] },
      { id: 'creativity', name: 'Творчество', topics: ['Рисование', 'Лепка', 'Поделки', 'Музыка', 'Оригами', 'Аппликация', 'Раскраски', 'Пение', 'Театр', 'Конструирование'] },
      { id: 'science', name: 'Наука и познание', topics: ['Природа', 'Животные', 'Космос', 'Эксперименты', 'Динозавры', 'Океан', 'Погода', 'Вулканы', 'Роботы', 'Тело человека'] },
      { id: 'stories', name: 'Сказки и истории', topics: ['Русские сказки', 'Мировые сказки', 'Стихи', 'Басни', 'Колыбельные', 'Аудиосказки', 'Мультфильмы', 'Былины'] },
      { id: 'physical', name: 'Физическая активность', topics: ['Зарядка', 'Танцы', 'Игры', 'Йога для детей', 'Спорт', 'Гимнастика', 'Разминка', 'Фитнес'] },
      { id: 'languages', name: 'Языки', topics: ['Английский для детей', 'Испанский для детей', 'Французский для детей', 'Немецкий для детей', 'Китайский для детей'] },
      { id: 'math', name: 'Математика', topics: ['Сложение', 'Вычитание', 'Умножение', 'Геометрия', 'Дроби', 'Задачи', 'Счёт', 'Таблица умножения'] },
      { id: 'life', name: 'Жизненные навыки', topics: ['Готовка для детей', 'Уборка', 'Гигиена', 'Безопасность', 'Вежливость', 'Дружба', 'Эмоции'] }
    ],
    en: [
      { id: 'learning', name: 'Learning & Development', topics: ['Alphabet', 'Numbers', 'Colors', 'Shapes', 'Reading', 'Writing', 'Logic', 'Memory', 'Phonics', 'Vocabulary'] },
      { id: 'creativity', name: 'Creativity & Arts', topics: ['Drawing', 'Clay', 'Crafts', 'Music', 'Origami', 'Painting', 'Coloring', 'Singing', 'Dance', 'Building'] },
      { id: 'science', name: 'Science & Discovery', topics: ['Nature', 'Animals', 'Space', 'Experiments', 'Dinosaurs', 'Ocean', 'Weather', 'Volcanoes', 'Robots', 'Human body'] },
      { id: 'stories', name: 'Stories & Tales', topics: ['Fairy tales', 'Bedtime stories', 'Nursery rhymes', 'Fables', 'Lullabies', 'Cartoons', 'Animated stories', 'Poems'] },
      { id: 'physical', name: 'Physical Activity', topics: ['Exercise', 'Dance', 'Games', 'Kids yoga', 'Sports', 'Gymnastics', 'Warm up', 'Fitness'] },
      { id: 'languages', name: 'Languages', topics: ['Learn English', 'Learn Spanish', 'Learn French', 'Learn German', 'Learn Chinese', 'Sign language'] },
      { id: 'math', name: 'Math', topics: ['Addition', 'Subtraction', 'Multiplication', 'Geometry', 'Fractions', 'Counting', 'Times tables', 'Problem solving'] },
      { id: 'life', name: 'Life Skills', topics: ['Cooking for kids', 'Cleaning', 'Hygiene', 'Safety', 'Manners', 'Friendship', 'Emotions', 'First aid'] }
    ]
  }

  const categories = categoriesData[topicLang]

  // Загружаем персонализированные данные при монтировании компонента
  useEffect(() => {
    const loadPersonalizedData = async () => {
      setIsLoadingRecommendations(true)
      try {
        const prefs = await getPersonalizedCategories()
        setCategoryPreferences(prefs)
      } catch (err) {
        console.error('Ошибка загрузки персонализированных данных:', err)
      } finally {
        setIsLoadingRecommendations(false)
      }
    }

    loadPersonalizedData()
  }, [])

  // Загружаем рекомендации при изменении возраста
  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoadingRecommendations(true)
      try {
        const recommendations = await getCombinedRecommendations(selectedAge)
        setSmartTopics(recommendations.personal || [])
        setTrendingTopics(recommendations.trending || [])
      } catch (err) {
        console.error('Ошибка загрузки рекомендаций:', err)
      } finally {
        setIsLoadingRecommendations(false)
      }
    }

    loadRecommendations()
  }, [selectedAge])

  const ageGroups = [
    { value: '0-2', label: '0-2 года' },
    { value: '3-5', label: '3-5 лет' },
    { value: '6-8', label: '6-8 лет' },
    { value: '9-12', label: '9-12 лет' }
  ]

  // Функция для показа уведомлений
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  // Сортируем категории по предпочтениям пользователя
  const getSortedCategories = () => {
    if (!categoryPreferences || !categoryPreferences.hasEnoughData) {
      return categories
    }

    const sorted = [...categories].sort((a, b) => {
      const scoreA = categoryPreferences.scores[a.id] || 0
      const scoreB = categoryPreferences.scores[b.id] || 0
      return scoreB - scoreA
    })

    return sorted
  }

  const performSearch = async (query) => {
    console.log('Поиск:', query, 'возраст:', selectedAge)
    setIsLoading(true)
    setError(null)

    try {
      // Улучшаем поисковый запрос на основе предпочтений пользователя
      const enhancedQuery = await enhanceSearchQuery(query, selectedAge)
      console.log('Улучшенный запрос:', enhancedQuery)

      const results = await searchVideos(enhancedQuery, 15)

      // Фильтруем заблокированные каналы
      const filteredResults = await filterSearchResults(results)

      // Фильтруем по минимальной длительности
      const minSeconds = minDuration * 60
      const durationFiltered = minSeconds > 0
        ? filteredResults.filter(v => v.durationSeconds >= minSeconds)
        : filteredResults

      // Ранжируем по релевантности на основе предпочтений
      const rankedResults = await rankSearchResults(durationFiltered)

      // Ограничиваем до 10 результатов
      setSearchResults(rankedResults.slice(0, 10))
    } catch (err) {
      console.error('Ошибка поиска:', err)
      setError(err.message || 'Ошибка при поиске видео. Проверьте API ключ в .env файле.')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
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
    const query = topicLang === 'ru'
      ? `${topic} для детей ${selectedAge}`
      : `${topic} for kids ${selectedAge}`
    performSearch(query)
  }

  const handlePreview = (video) => {
    setPreviewVideo(video)
  }

  const handleClosePreview = () => {
    setPreviewVideo(null)
  }

  const handleApprove = async (video) => {
    console.log('Утвердить видео:', video)
    try {
      await addApprovedVideo(video)
      showToast(`Видео "${video.title}" добавлено в утвержденные`, 'success')
      if (previewVideo) {
        setPreviewVideo(null)
      }
    } catch (err) {
      console.error('Ошибка при сохранении видео:', err)
      showToast('Ошибка при сохранении видео', 'error')
    }
  }

  const handleBlock = async (video) => {
    console.log('Заблокировать видео:', video)
    try {
      await addBlockedVideo(video)
      showToast(`Видео "${video.title}" заблокировано`, 'info')

      // Удаляем заблокированное видео из результатов поиска
      setSearchResults(prev => prev.filter(v => v.id !== video.id))

      if (previewVideo) {
        setPreviewVideo(null)
      }
    } catch (err) {
      console.error('Ошибка при блокировке видео:', err)
      showToast('Ошибка при блокировке видео', 'error')
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

      {/* Состояние загрузки */}
      {isLoading && (
        <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Поиск видео...</p>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="error-state" style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Результаты поиска */}
      {!isLoading && !error && searchResults.length > 0 && (
        <div className="search-results-section">
          <h3>Результаты поиска ({searchResults.length})</h3>
          <div className="search-results-scroll">
            {searchResults.map((video) => {
              const isHighlyRelevant = video.relevanceScore && video.relevanceScore >= 10
              const isRelevant = video.relevanceScore && video.relevanceScore >= 5

              return (
                <div key={video.id} className="search-result-card" style={{
                  borderColor: isHighlyRelevant ? '#4CAF50' : isRelevant ? '#2196F3' : undefined
                }}>
                  {isHighlyRelevant && (
                    <div className="relevance-badge">Рекомендуем</div>
                  )}
                  <div
                    className="search-result-thumbnail"
                    onClick={() => handlePreview(video)}
                  >
                    <img src={video.thumbnail} alt={video.title} />
                  </div>
                  <div className="search-result-info">
                    <h4 className="search-result-title">{video.title}</h4>
                    <p className="search-result-channel">{video.channel}</p>
                    <p className="search-result-duration">{video.duration}</p>
                  </div>
                  <div className="search-result-actions">
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
              )
            })}
          </div>
        </div>
      )}

      {/* Выбор возраста, длительности и языка тегов */}
      <div className="search-filters">
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

        <div className="duration-selector">
          <label>Мин. длительность:</label>
          <div className="duration-buttons">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                className={`duration-button ${minDuration === opt.value ? 'active' : ''}`}
                onClick={() => setMinDuration(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lang-selector">
          <label>Язык тегов:</label>
          <div className="lang-buttons">
            <button
              className={`lang-button ${topicLang === 'ru' ? 'active' : ''}`}
              onClick={() => setTopicLang('ru')}
            >
              RU
            </button>
            <button
              className={`lang-button ${topicLang === 'en' ? 'active' : ''}`}
              onClick={() => setTopicLang('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Загрузка рекомендаций */}
      {isLoadingRecommendations && (
        <div className="recommendations-section">
          <p style={{ textAlign: 'center', color: '#666' }}>Загрузка рекомендаций...</p>
        </div>
      )}

      {/* Трендовые темы из YouTube */}
      {!isLoadingRecommendations && trendingTopics.length > 0 && (
        <div className="recommendations-section">
          <h3>🔥 Сейчас в тренде (для {selectedAge} лет)</h3>
          <p className="section-description">
            Популярные темы на YouTube прямо сейчас
          </p>
          <div className="topics" style={{ marginBottom: '20px' }}>
            {trendingTopics.map((topic, index) => (
              <button
                key={index}
                className="topic-button"
                style={{
                  backgroundColor: '#FF5722',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                onClick={() => handleTopicClick(topic.value, 'trending')}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Умные рекомендации на основе истории */}
      {!isLoadingRecommendations && smartTopics.length > 0 && (
        <div className="recommendations-section">
          <h3>✨ Персональные рекомендации</h3>
          <p className="section-description">
            На основе ваших утвержденных видео
          </p>
          <div className="topics" style={{ marginBottom: '20px' }}>
            {smartTopics.map((topic, index) => (
              <button
                key={index}
                className="topic-button"
                style={{
                  backgroundColor: topic.type === 'channel' ? '#4CAF50' : '#2196F3',
                  color: 'white'
                }}
                onClick={() => handleTopicClick(topic.value, 'smart')}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Рекомендуемые темы */}
      <div className="recommendations-section">
        <h3>Рекомендуемые темы</h3>
        <p className="section-description">
          Выберите тему для поиска подходящих видео
        </p>

        <div className="categories">
          {getSortedCategories().map((category) => {
            const score = categoryPreferences?.scores[category.id] || 0
            const isPopular = categoryPreferences?.hasEnoughData && score > 0

            return (
              <div key={category.id} className="category-card">
                <h4 className="category-title">
                  {isPopular && '⭐ '}{category.name}
                  {isPopular && <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '8px' }}>({score})</span>}
                </h4>
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
            )
          })}
        </div>
      </div>

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

      {/* Toast уведомления */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  )
}

export default VideoSearchAndRecommendations
