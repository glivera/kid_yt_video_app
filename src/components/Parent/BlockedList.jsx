import { useState, useEffect } from 'react'
import './ParentComponents.css'

const BlockedList = () => {
  const [blockedVideos, setBlockedVideos] = useState([])
  const [blockedChannels, setBlockedChannels] = useState([])

  useEffect(() => {
    // TODO: Загрузить заблокированные видео и каналы
    setBlockedVideos([])
    setBlockedChannels([])
  }, [])

  const handleUnblockVideo = (videoId) => {
    console.log('Разблокировать видео:', videoId)
    // TODO: Удалить из списка заблокированных
  }

  const handleUnblockChannel = (channelId) => {
    console.log('Разблокировать канал:', channelId)
    // TODO: Удалить из списка заблокированных каналов
  }

  return (
    <div className="blocked-list">
      <h2>Заблокированный контент</h2>

      <section className="blocked-section">
        <h3>Заблокированные видео</h3>
        {blockedVideos.length > 0 ? (
          <div className="blocked-items">
            {blockedVideos.map((video) => (
              <div key={video.id} className="blocked-item">
                <div className="blocked-info">
                  <p className="blocked-title">{video.title}</p>
                  <p className="blocked-channel">{video.channel}</p>
                </div>
                <button
                  onClick={() => handleUnblockVideo(video.id)}
                  className="button button-secondary"
                >
                  Разблокировать
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Нет заблокированных видео</p>
        )}
      </section>

      <section className="blocked-section">
        <h3>Заблокированные каналы</h3>
        {blockedChannels.length > 0 ? (
          <div className="blocked-items">
            {blockedChannels.map((channel) => (
              <div key={channel.id} className="blocked-item">
                <div className="blocked-info">
                  <p className="blocked-title">{channel.name}</p>
                  <p className="blocked-count">{channel.subscriberCount} подписчиков</p>
                </div>
                <button
                  onClick={() => handleUnblockChannel(channel.id)}
                  className="button button-secondary"
                >
                  Разблокировать
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Нет заблокированных каналов</p>
        )}
      </section>
    </div>
  )
}

export default BlockedList
