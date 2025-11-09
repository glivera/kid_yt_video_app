-- Создание таблицы для утвержденных видео
CREATE TABLE IF NOT EXISTS approved_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  channel TEXT,
  channel_id TEXT,
  duration TEXT,
  view_count TEXT,
  user_id TEXT NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для заблокированных видео
CREATE TABLE IF NOT EXISTS blocked_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  channel TEXT,
  channel_id TEXT,
  user_id TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для заблокированных каналов
CREATE TABLE IF NOT EXISTS blocked_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  subscriber_count TEXT,
  user_id TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для истории просмотров
CREATE TABLE IF NOT EXISTS watch_history (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT,
  thumbnail TEXT,
  user_id TEXT NOT NULL,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_approved_videos_user_id ON approved_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_videos_user_id ON blocked_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_channels_user_id ON blocked_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON watch_history(watched_at DESC);

-- Политики безопасности Row Level Security (RLS)

-- Включаем RLS для всех таблиц
ALTER TABLE approved_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- Политики для approved_videos
CREATE POLICY "Users can view their own approved videos"
  ON approved_videos FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own approved videos"
  ON approved_videos FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own approved videos"
  ON approved_videos FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- Политики для blocked_videos
CREATE POLICY "Users can view their own blocked videos"
  ON blocked_videos FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own blocked videos"
  ON blocked_videos FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own blocked videos"
  ON blocked_videos FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- Политики для blocked_channels
CREATE POLICY "Users can view their own blocked channels"
  ON blocked_channels FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own blocked channels"
  ON blocked_channels FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own blocked channels"
  ON blocked_channels FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- Политики для watch_history
CREATE POLICY "Users can view their own watch history"
  ON watch_history FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own watch history"
  ON watch_history FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own watch history"
  ON watch_history FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));
