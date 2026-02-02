-- ========================================
-- МИГРАЦИЯ: кэш поисковых запросов YouTube
-- Выполнить в Supabase SQL Editor
-- Безопасно запускать повторно (идемпотентно)
-- ========================================

-- 1. Таблица кэша
CREATE TABLE IF NOT EXISTS kid_app_search_cache (
  id SERIAL PRIMARY KEY,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'search',
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Индексы
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_cache_hash_type
  ON kid_app_search_cache(query_hash, search_type);
CREATE INDEX IF NOT EXISTS idx_search_cache_created
  ON kid_app_search_cache(created_at);

-- 3. RLS
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

-- 4. Функция очистки (удаляет записи старше 3 дней)
CREATE OR REPLACE FUNCTION public.cleanup_search_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM kid_app_search_cache
  WHERE created_at < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. (Опционально) Запустить очистку прямо сейчас
-- SELECT public.cleanup_search_cache();
