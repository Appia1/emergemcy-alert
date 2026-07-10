import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Key, Mail, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { getUsers, saveUsers, generateEmergencyId } from '../lib/mockDb';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [firstName, setFirstName] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    const users = getUsers();

    if (isLogin) {
      // Login flow
      const foundUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (foundUser) {
        onAuthSuccess(foundUser);
      } else {
        setError('Invalid email or password.');
      }
    } else {
      // Signup flow
      if (!firstName || !surname) {
        setError('Please enter your first name and surname.');
        return;
      }

      const emailExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        setError('An account with this email already exists.');
        return;
      }

      const existingIds = users.map((u) => u.emergencyId);
      const generatedId = generateEmergencyId(existingIds);

      const newUser: User = {
        id: `user-${Date.now()}`,
        firstName,
        surname,
        email,
        password,
        emergencyId: generatedId,
        emergencyContacts: [],
      };

      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);

      setSuccess(`Account created! Your Emergency ID is ${generatedId}. Logging in...`);
      setTimeout(() => {
        onAuthSuccess(newUser);
      }, 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white border-2 border-primary shadow-[8px_8px_0px_0px_#A94A4A] flex flex-col space-y-6"
      >
        <div className="text-center space-y-2">
          {/* <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Shield className="w-6 h-6" />
          </div> */}
          <h2 className="text-2xl font-display font-semibold text-primary tracking-tight">
            {isLogin ? 'Sign In' : 'Register New Account'}
          </h2>
          {/* <p className="text-xs text-primary/70 font-mono uppercase tracking-wider">
            {isLogin ? 'Access your emergency dashboard' : 'Get your secure 6-digit emergency ID'}
          </p> */}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 text-xs bg-primary text-brand-bg rounded-lg border border-primary/20"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 text-xs bg-green-50 text-green-800 rounded-lg border border-green-200"
          >
            <Shield className="w-4 h-4 flex-shrink-0 text-green-600 animate-pulse" />
            <span className="font-medium">{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-primary/80">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-primary/45" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    
                    className="w-full pl-9 pr-3 py-2 text-sm bg-brand-bg border border-primary/30 rounded-lg focus:outline-none focus:border-primary text-primary placeholder-primary/40 font-sans"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-primary/80">Surname</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-primary/45" />
                  <input
                    type="text"
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}

                    className="w-full pl-9 pr-3 py-2 text-sm bg-brand-bg border border-primary/30 rounded-lg focus:outline-none focus:border-primary text-primary placeholder-primary/40 font-sans"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-primary/80">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-primary/45" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                
                className="w-full pl-9 pr-3 py-2 text-sm bg-brand-bg border border-primary/30 rounded-lg focus:outline-none focus:border-primary text-primary placeholder-primary/40 font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-primary/80">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-primary/45" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-brand-bg border border-primary/30 rounded-lg focus:outline-none focus:border-primary text-primary placeholder-primary/40 font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-brand-bg rounded-lg text-sm font-mono font-medium tracking-wider transition-all duration-300 cursor-pointer border border-transparent shadow-sm active:scale-98"
          >
            <span>{isLogin ? 'SIGN IN' : 'REGISTER ACCOUNT'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-primary/10 pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            className="text-xs font-mono uppercase tracking-wider text-primary hover:underline cursor-pointer"
          >
            {isLogin ? "DON'T HAVE AN ACCOUNT? REGISTER" : 'ALREADY HAVE AN ACCOUNT? SIGN IN'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
