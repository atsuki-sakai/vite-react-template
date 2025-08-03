-- Migration number: 0001 	 2025-08-03T16:26:12.056Z
-- Create line_messages table
CREATE TABLE line_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image')),
  message_content TEXT,
  image_url TEXT,
  dify_response TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
-- Basic single-column indexes
CREATE INDEX idx_line_messages_conversation_id ON line_messages(conversation_id);
CREATE INDEX idx_line_messages_user_id ON line_messages(user_id);
CREATE INDEX idx_line_messages_created_at ON line_messages(created_at);

-- Performance-critical composite indexes
-- Index for user conversation lookup (most frequent query)
CREATE INDEX IF NOT EXISTS idx_line_messages_user_created
ON line_messages(user_id, created_at DESC);

-- Index for conversation_id lookups
CREATE INDEX IF NOT EXISTS idx_line_messages_conversation
ON line_messages(conversation_id);

-- Composite index for efficient user message history queries
CREATE INDEX IF NOT EXISTS idx_line_messages_user_type_created
ON line_messages(user_id, message_type, created_at DESC);