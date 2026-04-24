-- Redundant if DB already altered; safe for fresh migrate.
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
