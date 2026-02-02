import { useState, useEffect } from 'react'
import {
  getBlockedVideos,
  removeBlockedVideo,
  getBlockedChannels,
  removeBlockedChannel
} from '../../services/storage'
import Toast from '../Common/Toast'
import './ParentComponents.css'

const BlockedList = () => {
  const [blockedVideos, setBlockedVideos] = useState([])
  const [blockedChannels, setBlockedChannels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [videos, channels] = await Promise.all([
        getBlockedVideos(),
        getBlockedChannels()
      ])
      setBlockedVideos(videos)
      setBlockedChannels(channels)
    } catch (err) {
      console.error('Ошибка загрузки заблокированного контента:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUnblockVideo = async (videoId) => {
    try {
      const updated = await removeBlockedVideo(videoId)
      setBlockedVideos(updated)
      setToast({ message: 'Видео разблокировано', type: 'success' })
    } catch (err) {
      console.error('Ошибка разблокировки видео:', err)
      setToast({ message: 'Ошибка при разблокировке видео', type: 'error' })
    }
  }

  const handleUnblockChannel = async (channelId) => {
    try {
      const updated = await removeBlockedChannel(channelId)
      setBlockedChannels(updated)
      setToast({ message: 'Канал разблокирован', type: 'success' })
    } catch (err) {
      console.error('Ошибка разблокировки канала:', err)
      setToast({ message: 'Ошибка при разблокировке канала', type: 'error' })
    }
  }

  if (isLoading) {
    return (
      <div className="blocked-list">
        <h2>Заблокированный контент</h2>
        <p style={{ textAlign: 'center', color: '#666' }}>Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="blocked-list">
      <h2>Заблокированный контент</h2>

      <section className="blocked-section">
        <h3>Заблокированные видео ({blockedVideos.length})</h3>
        {blockedVideos.length > 0 ? (
          <div className="video-grid">
            {blockedVideos.map((video) => (
              <div key={video.id} className="video-card">
                {video.thumbnail && (
                  <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                )}
                <div className="video-info">
                  <h3 className="video-title">{video.title}</h3>
                  <p className="video-channel">{video.channel}</p>
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
        <h3>Заблокированные каналы ({blockedChannels.length})</h3>
        {blockedChannels.length > 0 ? (
          <div className="video-grid">
            {blockedChannels.map((channel) => (
              <div key={channel.id} className="video-card">
                {channel.thumbnail && (
                  <img src={channel.thumbnail} alt={channel.name} className="video-thumbnail" />
                )}
                <div className="video-info">
                  <h3 className="video-title">{channel.name}</h3>
                  <p className="video-channel">{channel.subscriber_count || channel.subscriberCount || '0'} подписчиков</p>
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

export default BlockedList
