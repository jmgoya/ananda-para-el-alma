-- Fixes the online-payment bug where MercadoPago charges correctly but the app
-- never marks the course as paid: course_access had no unique constraint on
-- (user_id, course_id), so repeated checkout/payment attempts created duplicate
-- rows. Once a user/course pair had more than one row, every `.single()` lookup
-- (webhook, access checks) silently failed and access was never granted.

-- 1. Deduplicate existing rows: keep the approved one if there is one, otherwise
--    the most recently created one, for each (user_id, course_id) pair.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, course_id
           ORDER BY (status = 'approved') DESC, created_at DESC
         ) AS rn
  FROM course_access
)
DELETE FROM course_access
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Enforce it going forward.
ALTER TABLE course_access
  ADD CONSTRAINT course_access_user_course_unique UNIQUE (user_id, course_id);
