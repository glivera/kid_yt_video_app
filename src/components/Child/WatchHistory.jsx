import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChildComponents.css'

const WatchHistory = () => {
  const [history, setHistory] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // TODO: Загрузить историю просмотров
    setHistory([])
  }, [])

  const handleVideoClick = (videoId) => {
    navigate(`/child/player/${videoId}`)
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return 'Сегодня'
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Вчера'
    } else {
      return d.toLocaleDateString('ru-RU')
    }
  }

  return (
    <div className="watch-history">
      <h2 className="history-title">История просмотров</h2>

      {history.length > 0 ? (
        <div className="history-list">
          {history.map((item) => (
            <div
              key={item.id}
              className="history-item"
              onClick={() => handleVideoClick(item.videoId)}
            >
              <img
                src={item.thumbnail}
                alt={item.title}
                className="history-thumbnail"
              />
              <div className="history-info">
                <h3 className="history-video-title">{item.title}</h3>
                <p className="history-channel">{item.channel}</p>
                <p className="history-date">{formatDate(item.watchedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-child">
          <div className="empty-icon">🕐</div>
          <p>История просмотров пуста</p>
          <p className="empty-subtitle">Посмотри свои первые видео!</p>
        </div>
      )}
    </div>
  )
}

export default WatchHistory
