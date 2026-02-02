import { useState, useEffect } from 'react'
import { getApprovedVideos, removeApprovedVideo } from '../../services/storage'
import Toast from '../Common/Toast'
import './ParentComponents.css'

const ApprovedVideos = () => {
  const [approvedVideos, setApprovedVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const loadVideos = async () => {
    setIsLoading(true)
    try {
      const videos = await getApprovedVideos()
      setApprovedVideos(videos)
    } catch (err) {
      console.error('Ошибка загрузки утвержденных видео:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVideos()
  }, [])

  const handleRemove = async (videoId) => {
    try {
      const updated = await removeApprovedVideo(videoId)
      setApprovedVideos(updated)
      setToast({ message: 'Видео удалено из утвержденных', type: 'success' })
    } catch (err) {
      console.error('Ошибка удаления видео:', err)
      setToast({ message: 'Ошибка при удалении видео', type: 'error' })
    }
  }

  if (isLoading) {
    return (
      <div className="approved-videos">
        <h2>Утвержденные видео</h2>
        <p style={{ textAlign: 'center', color: '#666' }}>Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="approved-videos">
      <h2>Утвержденные видео ({approvedVideos.length})</h2>
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
                {video.duration && <p className="video-duration">{video.duration}</p>}
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default ApprovedVideos
