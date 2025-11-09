import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApprovedVideos } from '../../services/storage'
import './ChildComponents.css'

const VideoList = () => {
  const [videos, setVideos] = useState([])
  const navigate = useNavigate()

  const loadVideos = async () => {
    try {
      console.log('Loading approved videos...')
      const approvedVideos = await getApprovedVideos()
      console.log('Loaded videos:', approvedVideos)
      setVideos(approvedVideos)
    } catch (err) {
      console.error('Ошибка загрузки видео:', err)
    }
  }

  useEffect(() => {
    loadVideos()
  }, [])

  // Обновляем список при каждом возврате на страницу
  useEffect(() => {
    const handleFocus = () => {
      console.log('Page focused, reloading videos')
      loadVideos()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleVideoClick = (videoId) => {
    navigate(`/child/player/${videoId}`)
  }

  return (
    <div className="video-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="video-list-title">Твои видео</h2>
        <button
          onClick={loadVideos}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Обновить
        </button>
      </div>

      {videos.length > 0 ? (
        <div className="video-grid-child">
          {videos.map((video) => (
            <div
              key={video.id}
              className="video-card-child"
              onClick={() => handleVideoClick(video.id)}
            >
              <div className="video-thumbnail-wrapper">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="video-thumbnail-child"
                />
                <div className="video-duration-badge">{video.duration}</div>
              </div>
              <h3 className="video-title-child">{video.title}</h3>
              <p className="video-channel-child">{video.channel}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-child">
          <div className="empty-icon">📺</div>
          <p>Пока нет видео</p>
          <p className="empty-subtitle">Попроси родителей добавить видео для тебя!</p>
        </div>
      )}
    </div>
  )
}

export default VideoList
