-- Add nullable phone column to users for SMS OTP login (PRD 9.2 验收项).
-- The column is nullable so existing rows are preserved; we backfill empty
-- strings to NULL so the unique index treats them as a single bucket.
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
UPDATE "users" SET "phone" = NULL;
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone") WHERE "phone" IS NOT NULL;
