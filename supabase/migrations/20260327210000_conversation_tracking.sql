-- Add engagement tracking columns to conversations table
-- Used by objection classifier and Sales Orchestrator pipeline reporting

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS engagement_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS objection_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_objection_type text;

CREATE INDEX IF NOT EXISTS idx_conversations_objection_type
  ON conversations (last_objection_type)
  WHERE last_objection_type IS NOT NULL;

COMMENT ON COLUMN conversations.engagement_score IS 'Computed: message count + avg length + questions asked';
COMMENT ON COLUMN conversations.objection_count IS 'Incremented when classifier detects an objection';
COMMENT ON COLUMN conversations.last_objection_type IS 'Latest classified objection type (time/price/fit/authority/avoidance/stall)';
