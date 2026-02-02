-- ========================================
-- ТАБЛИЦА ПРОФИЛЕЙ ПОЛЬЗОВАТЕЛЕЙ
-- ========================================

-- Профиль пользователя (расширение auth.users)
CREATE TABLE IF NOT EXISTS kid_app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  family_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kid_app_users_role ON kid_app_users(role);
CREATE INDEX IF NOT EXISTS idx_kid_app_users_family_code ON kid_app_users(family_code);

-- RLS для профилей
ALTER TABLE kid_app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON kid_app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON kid_app_users;
DROP POLICY IF EXISTS "Users can view family members" ON kid_app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON kid_app_users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON kid_app_users;

-- НЕ используем self-referencing подзапрос — вызывает рекурсию RLS и зависание
CREATE POLICY "Users can view own profile"
  ON kid_app_users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON kid_app_users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON kid_app_users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ========================================
-- ТРИГГЕР: автосоздание профиля при регистрации
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role TEXT;
  _family_code TEXT;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'child');

  IF _role = 'parent' THEN
    -- Родитель: генерируем уникальный 6-символьный семейный код
    _family_code := upper(substr(md5(random()::text), 1, 6));
  ELSE
    -- Ребёнок: берём семейный код из метаданных (введённый при регистрации)
    _family_code := NEW.raw_user_meta_data->>'family_code';
  END IF;

  INSERT INTO public.kid_app_users (id, display_name, role, family_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Пользователь'),
    _role,
    _family_code
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- ТАБЛИЦА УТВЕРЖДЕННЫХ ВИДЕО
-- ========================================

CREATE TABLE IF NOT EXISTS kid_app_approved_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  channel TEXT,
  channel_id TEXT,
  duration TEXT,
  view_count TEXT,
  user_id TEXT NOT NULL,
  family_code TEXT,
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kid_app_approved_videos_user_id ON kid_app_approved_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_kid_app_approved_videos_family_code ON kid_app_approved_videos(family_code);

ALTER TABLE kid_app_approved_videos ENABLE ROW LEVEL SECURITY;

-- RLS политики
DROP POLICY IF EXISTS "Users can view their own approved videos" ON kid_app_approved_videos;
DROP POLICY IF EXISTS "Users can view family approved videos" ON kid_app_approved_videos;
DROP POLICY IF EXISTS "Users can insert their own approved videos" ON kid_app_approved_videos;
DROP POLICY IF EXISTS "Users can delete their own approved videos" ON kid_app_approved_videos;

-- SELECT: видео видны всем членам семьи (по family_code)
CREATE POLICY "Users can view family approved videos"
  ON kid_app_approved_videos FOR SELECT
  USING (
    family_code IN (
      SELECT family_code FROM kid_app_users WHERE id = auth.uid()
    )
  );

-- INSERT/DELETE: только автор
CREATE POLICY "Users can insert their own approved videos"
  ON kid_app_approved_videos FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own approved videos"
  ON kid_app_approved_videos FOR DELETE
  USING (user_id = auth.uid()::text);

-- ========================================
-- ТАБЛИЦА ЗАБЛОКИРОВАННЫХ ВИДЕО
-- ========================================

CREATE TABLE IF NOT EXISTS kid_app_blocked_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  channel TEXT,
  channel_id TEXT,
  user_id TEXT NOT NULL,
  family_code TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kid_app_blocked_videos_user_id ON kid_app_blocked_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_kid_app_blocked_videos_family_code ON kid_app_blocked_videos(family_code);

ALTER TABLE kid_app_blocked_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own blocked videos" ON kid_app_blocked_videos;
DROP POLICY IF EXISTS "Users can view family blocked videos" ON kid_app_blocked_videos;
DROP POLICY IF EXISTS "Users can insert their own blocked videos" ON kid_app_blocked_videos;
DROP POLICY IF EXISTS "Users can delete their own blocked videos" ON kid_app_blocked_videos;

-- SELECT: видны всей семье
CREATE POLICY "Users can view family blocked videos"
  ON kid_app_blocked_videos FOR SELECT
  USING (
    family_code IN (
      SELECT family_code FROM kid_app_users WHERE id = auth.uid()
    )
  );

-- INSERT/DELETE: только автор
CREATE POLICY "Users can insert their own blocked videos"
  ON kid_app_blocked_videos FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own blocked videos"
  ON kid_app_blocked_videos FOR DELETE
  USING (user_id = auth.uid()::text);

-- ========================================
-- ТАБЛИЦА ЗАБЛОКИРОВАННЫХ КАНАЛОВ
-- ========================================

CREATE TABLE IF NOT EXISTS kid_app_blocked_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  subscriber_count TEXT,
  user_id TEXT NOT NULL,
  family_code TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kid_app_blocked_channels_user_id ON kid_app_blocked_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_kid_app_blocked_channels_family_code ON kid_app_blocked_channels(family_code);

ALTER TABLE kid_app_blocked_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own blocked channels" ON kid_app_blocked_channels;
DROP POLICY IF EXISTS "Users can view family blocked channels" ON kid_app_blocked_channels;
DROP POLICY IF EXISTS "Users can insert their own blocked channels" ON kid_app_blocked_channels;
DROP POLICY IF EXISTS "Users can delete their own blocked channels" ON kid_app_blocked_channels;

-- SELECT: видны всей семье
CREATE POLICY "Users can view family blocked channels"
  ON kid_app_blocked_channels FOR SELECT
  USING (
    family_code IN (
      SELECT family_code FROM kid_app_users WHERE id = auth.uid()
    )
  );

-- INSERT/DELETE: только автор
CREATE POLICY "Users can insert their own blocked channels"
  ON kid_app_blocked_channels FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own blocked channels"
  ON kid_app_blocked_channels FOR DELETE
  USING (user_id = auth.uid()::text);

-- ========================================
-- ТАБЛИЦА ИСТОРИИ ПРОСМОТРОВ
-- ========================================

CREATE TABLE IF NOT EXISTS kid_app_watch_history (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT,
  thumbnail TEXT,
  user_id TEXT NOT NULL,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kid_app_watch_history_user_id ON kid_app_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_kid_app_watch_history_watched_at ON kid_app_watch_history(watched_at DESC);

ALTER TABLE kid_app_watch_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own watch history" ON kid_app_watch_history;
DROP POLICY IF EXISTS "Users can insert their own watch history" ON kid_app_watch_history;
DROP POLICY IF EXISTS "Users can delete their own watch history" ON kid_app_watch_history;

CREATE POLICY "Users can view their own watch history"
  ON kid_app_watch_history FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own watch history"
  ON kid_app_watch_history FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own watch history"
  ON kid_app_watch_history FOR DELETE
  USING (user_id = auth.uid()::text);

-- ========================================
-- КЭШ ПОИСКОВЫХ ЗАПРОСОВ YOUTUBE
-- ========================================
-- Общий кэш для всех пользователей.
-- Экономит квоту YouTube API (~100 ед. на каждый повторный запрос).

CREATE TABLE IF NOT EXISTS kid_app_search_cache (
  id SERIAL PRIMARY KEY,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'search',
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_search_cache_hash_type
  ON kid_app_search_cache(query_hash, search_type);
CREATE INDEX IF NOT EXISTS idx_search_cache_created
  ON kid_app_search_cache(created_at);

ALTER TABLE kid_app_search_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read cache" ON kid_app_search_cache;
DROP POLICY IF EXISTS "Authenticated users can insert cache" ON kid_app_search_cache;
DROP POLICY IF EXISTS "Authenticated users can update cache" ON kid_app_search_cache;

CREATE POLICY "Authenticated users can read cache"
  ON kid_app_search_cache FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cache"
  ON kid_app_search_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cache"
  ON kid_app_search_cache FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Функция очистки старых записей (вызывать через cron или вручную)
CREATE OR REPLACE FUNCTION public.cleanup_search_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM kid_app_search_cache
  WHERE created_at < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ТРИГГЕР: каскадное удаление данных пользователя
-- ========================================
-- Таблицы данных используют user_id TEXT (не FK),
-- поэтому нужен триггер для очистки при удалении из kid_app_users.

CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.kid_app_approved_videos WHERE user_id = OLD.id::text;
  DELETE FROM public.kid_app_blocked_videos WHERE user_id = OLD.id::text;
  DELETE FROM public.kid_app_blocked_channels WHERE user_id = OLD.id::text;
  DELETE FROM public.kid_app_watch_history WHERE user_id = OLD.id::text;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_kid_app_user_deleted ON kid_app_users;
CREATE TRIGGER on_kid_app_user_deleted
  BEFORE DELETE ON kid_app_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deleted();
