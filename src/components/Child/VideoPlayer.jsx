import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './ChildComponents.css'

const VideoPlayer = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [video, setVideo] = useState(null)

  useEffect(() => {
    // TODO: Загрузить информацию о видео и записать в историю
    console.log('Воспроизведение видео:', videoId)

    // Заглушка
    setVideo({
      id: videoId,
      title: 'Пример видео',
      channel: 'Детский канал',
      embedUrl: `https://www.youtube.com/embed/${videoId}`
    })
  }, [videoId])

  const handleBack = () => {
    navigate('/child/videos')
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
