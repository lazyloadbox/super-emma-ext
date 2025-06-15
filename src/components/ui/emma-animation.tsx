import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

const emmaMessages = [
  "Hi! I'm Emma 👋",
  "Ready to help! ✨",
  "Let's chat! 💬",
  "Super Emma here! 🚀",
  "How can I assist? 🤖",
  "AI at your service! 💫"
];

const floatingElements = [
  { emoji: "✨", delay: 0 },
  { emoji: "💫", delay: 1000 },
  { emoji: "🌟", delay: 2000 },
  { emoji: "⭐", delay: 3000 },
  { emoji: "💎", delay: 4000 },
];

export function EmmaAnimation() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % emmaMessages.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingElements.map((element, index) => (
          <div
            key={index}
            className="absolute animate-bounce"
            style={{
              left: `${20 + index * 15}%`,
              top: `${10 + (index % 2) * 30}%`,
              animationDelay: `${element.delay}ms`,
              animationDuration: '3s'
            }}
          >
            <span className="text-2xl opacity-20 animate-pulse text-primary">
              {element.emoji}
            </span>
          </div>
        ))}
      </div>

      {/* Main Emma logo/avatar */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
          <img src="/icon/128.png" alt="Emma Icon" className="w-16 h-16 rounded-md object-cover" />
        </div>
        
        {/* Glowing square rings */}
        <div className="absolute inset-0 rounded-lg border-2 border-primary/30 animate-ping opacity-30"></div>
        <div className="absolute inset-2 rounded-md border border-primary/50 animate-pulse opacity-50"></div>
      </div>

      {/* Emma title with gradient */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-pulse">
          Super Emma
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-primary/80 to-primary/60 rounded-full mx-auto mt-2 animate-pulse"></div>
      </div>

      {/* Animated message */}
      <div className="h-8 flex items-center justify-center">
        <p 
          className={cn(
            "text-sm transition-all duration-300 transform",
            "text-primary",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          {emmaMessages[currentMessage]}
        </p>
      </div>

      {/* Typing indicator dots */}
      <div className="flex space-x-1 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary/80 rounded-full animate-bounce opacity-60"
            style={{
              animationDelay: `${i * 200}ms`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-4 left-4 w-8 h-8 border border-primary/30 rounded-md animate-spin" style={{ animationDuration: '20s' }}></div>
        <div className="absolute top-12 right-8 w-6 h-6 border border-primary/30 rounded-sm animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
        <div className="absolute bottom-8 left-12 w-4 h-4 border border-primary/30 rounded-sm animate-spin" style={{ animationDuration: '25s' }}></div>
        <div className="absolute bottom-4 right-4 w-10 h-10 border border-primary/30 rounded-lg animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }}></div>
      </div>
    </div>
  );
} 