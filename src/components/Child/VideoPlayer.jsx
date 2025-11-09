import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getApprovedVideos, addToWatchHistory } from '../../services/storage'
import './ChildComponents.css'

const VideoPlayer = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [video, setVideo] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Загружаем информацию о видео из утвержденных
    const approvedVideos = getApprovedVideos()
    const foundVideo = approvedVideos.find(v => v.id === videoId)

    if (foundVideo) {
      const videoData = {
        id: foundVideo.id,
        title: foundVideo.title,
        channel: foundVideo.channel,
        thumbnail: foundVideo.thumbnail,
        embedUrl: `https://www.youtube.com/embed/${foundVideo.id}?autoplay=1`
      }

      setVideo(videoData)

      // Добавляем в историю просмотров
      addToWatchHistory(foundVideo)
    } else {
      setError('Видео не найдено в списке утвержденных')
    }
  }, [videoId])

  const handleBack = () => {
    navigate('/child/videos')
  }

  if (error) {
    return (
      <div className="video-player">
        <button onClick={handleBack} className="back-button">
          ← Назад к видео
        </button>
        <div className="error-message" style={{ textAlign: 'center', padding: '40px' }}>
          <p>{error}</p>
          <p>Попроси родителей одобрить это видео!</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <div className="video-player">
      <button onClick={handleBack} className="back-button">
        ← Назад к видео
      </button>

      <div className="player-container">
        <iframe
          width="100%"
          height="100%"
          src={video.embedUrl}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="video-details">
        <h2>{video.title}</h2>
        <p className="channel-name">{video.channel}</p>
      </div>
    </div>
  )
}

export default VideoPlayer
