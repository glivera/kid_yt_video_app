import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApprovedVideos } from '../../services/storage'
import './ChildComponents.css'

const VideoList = () => {
  const [videos, setVideos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Загружаем утвержденные видео
    const loadVideos = async () => {
      try {
        const approvedVideos = await getApprovedVideos()
        setVideos(approvedVideos)
      } catch (err) {
        console.error('Ошибка загрузки видео:', err)
      }
    }

    loadVideos()
  }, [])

  const handleVideoClick = (videoId) => {
    navigate(`/child/player/${videoId}`)
  }

  return (
    <div className="video-list">
      <h2 className="video-list-title">Твои видео</h2>

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
