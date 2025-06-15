import React from 'react';
import { ChatInterface } from '../components/chat/chat-interface';

export function ChatFeature() {
  return (
    <div className="h-[calc(100vh-17rem)] w-full overflow-hidden">
      <ChatInterface className="h-full w-full" />
    </div>
  );
} 