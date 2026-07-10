import React, { useState, useEffect } from 'react';
import { User } from './types';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';

import { HeartHandshake } from 'lucide-react';
import { initializeDatabase } from './lib/mockDb';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickTrigger, setTickTrigger] = useState<number>(0);

  // Initialize local DB and check active session
  useEffect(() => {
    initializeDatabase();
    
    const savedSession = localStorage.getItem('emergency_active_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('emergency_active_session');
      }
    }

    // Listens for message broadcasts to sync unread badges instantly across accounts
    const handleSync = () => {
      setTickTrigger(prev => prev + 1);
    };
    window.addEventListener('db-update', handleSync);
    return () => window.removeEventListener('db-update', handleSync);
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('emergency_active_session', JSON.stringify(user));
    setTickTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('emergency_active_session');
    setTickTrigger(prev => prev + 1);
  };

  const handleRefreshUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('emergency_active_session', JSON.stringify(updatedUser));
    setTickTrigger(prev => prev + 1);
  };

  const handleSwitchUser = (targetUser: User) => {
    setCurrentUser(targetUser);
    localStorage.setItem('emergency_active_session', JSON.stringify(targetUser));
    setTickTrigger(prev => prev + 1);
  };

  const handleForceSync = () => {
    setTickTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-primary flex flex-col justify-between selection:bg-primary selection:text-brand-bg transition-colors duration-300">
      
    
      {/* Main Container */}
      <div className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-6 py-8 flex flex-col justify-center">
        
        {/* Simple Clean Header */}
        <header className="mb-6 text-center space-y-2 select-none">
          {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-white font-mono text-xs uppercase tracking-wider text-primary shadow-sm">
            <HeartHandshake className="w-3.5 h-3.5 animate-pulse text-primary" />
            <span>Secure Broadcast Hub</span>
          </div> */}
          <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-primary">
            EMERGENCY ALERT
          </h1>
        </header>

        {currentUser ? (
          <DashboardPage 
            user={currentUser} 
            onLogout={handleLogout} 
            onRefreshUser={handleRefreshUser}
            tickTrigger={tickTrigger}
          />
        ) : (
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        )}
      </div>

      {/* Unbranded Footer */}
      
    </div>
  );
}
