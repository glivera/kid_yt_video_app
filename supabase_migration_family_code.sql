-- ========================================
-- МИГРАЦИЯ: добавление family_code
-- Выполнить в Supabase SQL Editor
-- ========================================

-- 1. Добавляем колонку family_code в существующие таблицы
ALTER TABLE kid_app_users ADD COLUMN IF NOT EXISTS family_code TEXT;
ALTER TABLE kid_app_approved_videos ADD COLUMN IF NOT EXISTS family_code TEXT;
ALTER TABLE kid_app_blocked_videos ADD COLUMN IF NOT EXISTS family_code TEXT;
ALTER TABLE kid_app_blocked_channels ADD COLUMN IF NOT EXISTS family_code TEXT;

-- 2. Индексы
CREATE INDEX IF NOT EXISTS idx_kid_app_users_family_code ON kid_app_users(family_code);
CREATE INDEX IF NOT EXISTS idx_kid_app_approved_videos_family_code ON kid_app_approved_videos(family_code);
CREATE INDEX IF NOT EXISTS idx_kid_app_blocked_videos_family_code ON kid_app_blocked_videos(family_code);
CREATE INDEX IF NOT EXISTS idx_kid_app_blocked_channels_family_code ON kid_app_blocked_channels(family_code);

-- 3. Генерируем family_code для существующих родителей
UPDATE kid_app_users
SET family_code = upper(substr(md5(random()::text), 1, 6))
WHERE role = 'parent' AND family_code IS NULL;

-- 4. Обновляем триггер создания пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role TEXT;
  _family_code TEXT;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'child');

  IF _role = 'parent' THEN
    _family_code := upper(substr(md5(random()::text), 1, 6));
  ELSE
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

-- 5. Обновляем RLS-политики для kid_app_users
-- ВАЖНО: НЕ добавляем политику с подзапросом к kid_app_users (self-referencing),
-- иначе Supabase зависнет из-за рекурсивной оценки RLS.
DROP POLICY IF EXISTS "Users can view their own profile" ON kid_app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON kid_app_users;
DROP POLICY IF EXISTS "Users can view family members" ON kid_app_users;

CREATE POLICY "Users can view own profile"
  ON kid_app_users FOR SELECT
  USING (id = auth.uid());

-- 6. Обновляем RLS для kid_app_approved_videos
DROP POLICY IF EXISTS "Users can view their own approved videos" ON kid_app_approved_videos;
DROP POLICY IF EXISTS "Users can view family approved videos" ON kid_app_approved_videos;

CREATE POLICY "Users can view family approved videos"
  ON kid_app_approved_videos FOR SELECT
  USING (
    family_code IN (
      SELECT family_code FROM kid_app_users WHERE id = auth.uid()
    )
  );

-- 7. Обновляем RLS для kid_app_blocked_videos
DROP POLICY IF EXISTS "Users can view their own blocked videos" ON kid_app_blocked_videos;
DROP POLICY IF EXISTS "Users can view family blocked videos" ON kid_app_blocked_videos;

CREATE POLICY "Users can view family blocked videos"
  ON kid_app_blocked_videos FOR SELECT
  USING (
    family_code IN (
      SELECT family_code FROM kid_app_users WHERE id = auth.uid()
    )
  );

-- 8. Обновляем RLS для kid_app_blocked_channels
DROP POLICY IF EXISTS "Users can view their own blocked channels" ON kid_app_blocked_channels;
DROP POLICY IF EXISTS "Users can view family blocked channels" ON kid_app_blocked_channels;

CREATE POLICY "Users can view family blocked channels"
  ON kid_app_blocked_channels FOR SELECT
  USING (
    family_code IN (
      SELECT family_code FROM kid_app_users WHERE id = auth.uid()
    )
  );

-- 9. Триггер каскадного удаления данных пользователя
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

-- 10. Проставляем family_code в существующих данных (привязка к родителю)
UPDATE kid_app_approved_videos av
SET family_code = u.family_code
FROM kid_app_users u
WHERE av.user_id = u.id::text AND av.family_code IS NULL;

UPDATE kid_app_blocked_videos bv
SET family_code = u.family_code
FROM kid_app_users u
WHERE bv.user_id = u.id::text AND bv.family_code IS NULL;

UPDATE kid_app_blocked_channels bc
SET family_code = u.family_code
FROM kid_app_users u
WHERE bc.user_id = u.id::text AND bc.family_code IS NULL;
