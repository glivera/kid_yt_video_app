import { useState, useEffect } from 'react'
import './ParentComponents.css'

const ApprovedVideos = () => {
  const [approvedVideos, setApprovedVideos] = useState([])

  useEffect(() => {
    // TODO: Загрузить утвержденные видео из API/localStorage
    setApprovedVideos([])
  }, [])

  const handleRemove = (videoId) => {
    console.log('Удалить из утвержденных:', videoId)
    // TODO: Удалить из списка утвержденных
  }

  return (
    <div className="approved-videos">
      <h2>Утвержденные видео</h2>
      <p className="section-description">
        Видео, которые ребенок может смотреть
      </p>

      {approvedVideos.length > 0 ? (
        <div className="video-grid">
          {approvedVideos.map((video) => (
            <div key={video.id} className="video-card">
              <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
              <div className="video-info">
                <h3 className="video-title">{video.title}</h3>
                <p className="video-channel">{video.channel}</p>
              </div>
              <button
                onClick={() => handleRemove(video.id)}
                className="button button-secondary"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Список утвержденных видео пуст</p>
          <p>Используйте поиск, чтобы найти и утвердить видео для ребенка</p>
        </div>
      )}
    </div>
  )
}

export default ApprovedVideos
