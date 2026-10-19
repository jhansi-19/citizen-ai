'use client';

import React, { useState } from 'react';
import CleanLandingPage from '@/components/CleanLandingPage';
import CleanChatApp from '@/components/CleanChatApp';

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'chat'>('landing');

  const handleStartChat = () => {
    setCurrentView('chat');
  };

  const handleBackToHome = () => {
    setCurrentView('landing');
  };

  if (currentView === 'chat') {
    return <CleanChatApp onBackToHome={handleBackToHome} />;
  }

  return <CleanLandingPage onStartChat={handleStartChat} />;
}
