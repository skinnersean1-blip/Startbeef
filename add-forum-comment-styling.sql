-- Add textColor and fontStyle columns to ForumComment table
-- Run this in your Turso SQL console

ALTER TABLE ForumComment ADD COLUMN textColor TEXT;
ALTER TABLE ForumComment ADD COLUMN fontStyle TEXT;
