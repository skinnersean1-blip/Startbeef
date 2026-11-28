-- Create Conversation table
CREATE TABLE IF NOT EXISTS Conversation (
    id TEXT NOT NULL PRIMARY KEY,
    participantIds TEXT NOT NULL,
    lastMessageAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create DirectMessage table
CREATE TABLE IF NOT EXISTS DirectMessage (
    id TEXT NOT NULL PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    content TEXT NOT NULL,
    isRead INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS DirectMessage_conversationId_idx ON DirectMessage(conversationId);
CREATE INDEX IF NOT EXISTS DirectMessage_senderId_idx ON DirectMessage(senderId);
CREATE INDEX IF NOT EXISTS DirectMessage_isRead_idx ON DirectMessage(isRead);
CREATE INDEX IF NOT EXISTS Conversation_lastMessageAt_idx ON Conversation(lastMessageAt);
