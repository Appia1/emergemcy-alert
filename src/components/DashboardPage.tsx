import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  Send, 
  Users, 
  Check, 
  AlertTriangle, 
  X, 
  MessageSquare,
  Clock,
  UserCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { User, EmergencyContact, EmergencyMessage, Notification } from '../types';
import { 
  getUsers, 
  saveUsers, 
  getNotifications, 
  saveNotifications, 
  getMessages, 
  broadcastEmergencyMessage, 
  getUserByEmergencyId 
} from '../lib/mockDb';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  onRefreshUser: (updatedUser: User) => void;
  // Trigger to sync data across user switches
  tickTrigger: number;
}

export default function DashboardPage({ user, onLogout, onRefreshUser, tickTrigger }: DashboardPageProps) {
  const [showContactsDropdown, setShowContactsDropdown] = useState<boolean>(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Message Broadcast States
  const [messageText, setMessageText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Contact list CRUD states
  const [newContactId, setNewContactId] = useState<string>('');
  const [newContactLabel, setNewContactLabel] = useState<string>('');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactIdVal, setEditContactIdVal] = useState<string>('');
  const [editContactLabelVal, setEditContactLabelVal] = useState<string>('');
  const [contactError, setContactError] = useState<string>('');

  const contactsButtonRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLDivElement>(null);

  // Load and filter notifications
  useEffect(() => {
    const allNotifs = getNotifications();
    const userNotifs = allNotifs.filter(n => n.userId === user.id);
    setNotifications(userNotifs);
    setUnreadCount(userNotifs.filter(n => !n.read).length);
  }, [user.id, tickTrigger]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactsButtonRef.current && !contactsButtonRef.current.contains(event.target as Node)) {
        setShowContactsDropdown(false);
      }
      if (notifButtonRef.current && !notifButtonRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // CONTACTS MANAGEMENT (CRUD inside the dropdown)
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    const trimmedId = newContactId.trim();
    const trimmedLabel = newContactLabel.trim();

    if (!/^\d{6}$/.test(trimmedId)) {
      setContactError('Emergency ID must be a 6-digit number.');
      return;
    }

    if (trimmedId === user.emergencyId) {
      setContactError("You cannot add your own Emergency ID.");
      return;
    }

    const contacts = user.emergencyContacts || [];
    if (contacts.length >= 5) {
      setContactError('You can add a maximum of 5 Emergency IDs.');
      return;
    }

    if (contacts.some(c => c.targetEmergencyId === trimmedId)) {
      setContactError('This Emergency ID is already in your contacts.');
      return;
    }

    // Lookup if user exists (to provide high fidelity warning/assistance)
    const matchedUser = getUserByEmergencyId(trimmedId);
    const resolvedLabel = trimmedLabel || (matchedUser ? `${matchedUser.firstName} ${matchedUser.surname}` : `ID: ${trimmedId}`);

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      targetEmergencyId: trimmedId,
      label: resolvedLabel
    };

    const updatedUser = {
      ...user,
      emergencyContacts: [...contacts, newContact]
    };

    // Save to DB
    const users = getUsers();
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsers(updatedUsers);

    // Refresh context
    onRefreshUser(updatedUser);
    
    // Reset state
    setNewContactId('');
    setNewContactLabel('');
    showToast(`Added Emergency ID ${trimmedId} successfully!`);
  };

  const handleStartEdit = (contact: EmergencyContact) => {
    setEditingContactId(contact.id);
    setEditContactIdVal(contact.targetEmergencyId);
    setEditContactLabelVal(contact.label);
    setContactError('');
  };

  const handleSaveEdit = (contactId: string) => {
    setContactError('');
    const trimmedId = editContactIdVal.trim();
    const trimmedLabel = editContactLabelVal.trim();

    if (!/^\d{6}$/.test(trimmedId)) {
      setContactError('Emergency ID must be a 6-digit number.');
      return;
    }

    if (trimmedId === user.emergencyId) {
      setContactError("You cannot add your own Emergency ID.");
      return;
    }

    const contacts = user.emergencyContacts || [];
    // Check duplicates except current being edited
    if (contacts.some(c => c.id !== contactId && c.targetEmergencyId === trimmedId)) {
      setContactError('This Emergency ID is already in your contacts.');
      return;
    }

    const matchedUser = getUserByEmergencyId(trimmedId);
    const resolvedLabel = trimmedLabel || (matchedUser ? `${matchedUser.firstName} ${matchedUser.surname}` : `ID: ${trimmedId}`);

    const updatedContacts = contacts.map(c => {
      if (c.id === contactId) {
        return { ...c, targetEmergencyId: trimmedId, label: resolvedLabel };
      }
      return c;
    });

    const updatedUser = {
      ...user,
      emergencyContacts: updatedContacts
    };

    const users = getUsers();
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsers(updatedUsers);

    onRefreshUser(updatedUser);
    setEditingContactId(null);
    showToast('Emergency contact updated successfully!');
  };

  const handleDeleteContact = (contactId: string, targetId: string) => {
    const contacts = user.emergencyContacts || [];
    const updatedContacts = contacts.filter(c => c.id !== contactId);

    const updatedUser = {
      ...user,
      emergencyContacts: updatedContacts
    };

    const users = getUsers();
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsers(updatedUsers);

    onRefreshUser(updatedUser);
    showToast(`Removed Emergency ID ${targetId}.`);
  };

  // NOTIFICATION ACTIONS
  const handleMarkAllRead = () => {
    const allNotifs = getNotifications();
    const updatedNotifs = allNotifs.map(n => n.userId === user.id ? { ...n, read: true } : n);
    saveNotifications(updatedNotifs);
    
    // Trigger update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    showToast('All messages marked as read.');
  };

  const handleNotificationClick = (notifId: string) => {
    const allNotifs = getNotifications();
    const updatedNotifs = allNotifs.map(n => n.id === notifId ? { ...n, read: true } : n);
    saveNotifications(updatedNotifs);

    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // BROADCAST ACTION
  const handleBroadcast = () => {
    const text = messageText.trim();
    if (!text) {
      showToast('Please type an emergency message before broadcasting.', 'error');
      return;
    }

    const contacts = user.emergencyContacts || [];
    if (contacts.length === 0) {
      showToast('No emergency contacts added! Please add emergency IDs first.', 'error');
      return;
    }

    try {
      const msg = broadcastEmergencyMessage(user.id, text);
      setMessageText('');
      
      const activeTargets = msg.recipientIds.length;
      if (activeTargets === 0) {
        showToast('Emergency broadcast completed! (Note: No registered accounts match your added contact IDs, but the message was logged).', 'success');
      } else {
        showToast(`Emergency Broadcast sent successfully to ${activeTargets} contact(s)!`, 'success');
      }

      // Briefly trigger custom global state refresh if listeners exist
      const event = new CustomEvent('db-update');
      window.dispatchEvent(event);
    } catch (e: any) {
      showToast(e.message || 'Failed to broadcast message.', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-lg flex items-center gap-3 font-sans text-sm max-w-md ${
              toastMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-primary text-brand-bg border-primary/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Brand Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 rounded-2xl border-2 border-primary bg-white shadow-[4px_4px_0px_0px_#A94A4A] gap-4">
        {/* Welcome Section */}
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <h1 className="text-lg md:text-xl font-display font-bold text-primary tracking-tight">
              Welcome, {user.surname}
            </h1>
          </div>
          <p className="text-xs font-mono text-primary/70">
            EMERGENCY ID: <span className="font-bold border border-primary/20 px-1.5 py-0.5 rounded bg-brand-bg text-primary">{user.emergencyId}</span>
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Add Emergency ID Dropdown Container */}
          <div className="relative" ref={contactsButtonRef}>
            <button
              onClick={() => {
                setShowContactsDropdown(!showContactsDropdown);
                setShowNotifDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-mono tracking-wider transition-all duration-200 cursor-pointer border ${
                showContactsDropdown 
                  ? 'bg-primary text-brand-bg border-transparent shadow-inner' 
                  : 'bg-brand-bg text-primary border-primary/20 hover:border-primary/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">EMERGENCY CONTACTS</span>
              <span className="bg-primary text-brand-bg text-[10px] px-1.5 py-0.5 rounded-full font-sans font-bold border border-brand-bg/35">
                {user.emergencyContacts?.length || 0}/5
              </span>
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
              {showContactsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-[340px] md:w-[400px] p-4 bg-white border-2 border-primary rounded-xl shadow-[6px_6px_0px_0px_#A94A4A] z-40 space-y-4 text-primary"
                >
                  <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold">
                      Manage Emergency Contacts
                    </h3>
                    <span className="text-[10px] text-primary/60 font-mono">
                      (Max 5)
                    </span>
                  </div>

                  {contactError && (
                    <div className="p-2 text-[11px] bg-primary text-brand-bg rounded flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  {/* List of Contacts */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {(!user.emergencyContacts || user.emergencyContacts.length === 0) ? (
                      <p className="text-xs font-mono text-primary/50 text-center py-4 border border-dashed border-primary/20 rounded-lg">
                        No active contacts. Add up to 5 Emergency IDs to broadcast alerts.
                      </p>
                    ) : (
                      user.emergencyContacts.map((contact) => {
                        const isEditing = editingContactId === contact.id;
                        const isRegisteredUser = getUserByEmergencyId(contact.targetEmergencyId);

                        return (
                          <div 
                            key={contact.id} 
                            className="flex items-center justify-between p-2.5 rounded-lg border border-primary/15 bg-brand-bg/40 text-xs"
                          >
                            {isEditing ? (
                              <div className="flex-grow space-y-2 pr-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={editContactLabelVal}
                                    onChange={(e) => setEditContactLabelVal(e.target.value)}
                                    placeholder="Label (e.g. Mom)"
                                    className="w-full px-2 py-1 border border-primary/30 rounded focus:outline-none focus:border-primary font-sans text-xs bg-white text-primary"
                                  />
                                  <input
                                    type="text"
                                    maxLength={6}
                                    value={editContactIdVal}
                                    onChange={(e) => setEditContactIdVal(e.target.value.replace(/\D/g, ''))}
                                    placeholder="6-digit ID"
                                    className="w-full px-2 py-1 border border-primary/30 rounded focus:outline-none focus:border-primary font-mono text-xs bg-white text-primary"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setEditingContactId(null)}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono border border-primary/30 hover:bg-primary/5 cursor-pointer"
                                  >
                                    CANCEL
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(contact.id)}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary text-brand-bg cursor-pointer"
                                  >
                                    SAVE
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <span>{contact.label}</span>
                                    {isRegisteredUser ? (
                                      <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-[9px] px-1 rounded-full border border-green-200">
                                        <UserCheck className="w-2.5 h-2.5" /> active
                                      </span>
                                    ) : (
                                      <span className="bg-primary/10 text-primary text-[9px] px-1 rounded-full border border-primary/25">
                                        unassigned ID
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono text-[10px] text-primary/70">
                                    6-Digit ID: <span className="font-bold text-primary">{contact.targetEmergencyId}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleStartEdit(contact)}
                                    className="p-1 rounded text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                    title="Edit contact"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteContact(contact.id, contact.targetEmergencyId)}
                                    className="p-1 rounded text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                    title="Remove contact"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Contact Form (Only shown if less than 5) */}
                  {(!user.emergencyContacts || user.emergencyContacts.length < 5) && (
                    <form onSubmit={handleAddContact} className="border-t border-primary/10 pt-3 space-y-3">
                      <div className="text-[10px] font-mono text-primary/70 uppercase tracking-wider">
                        Add New Emergency ID
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={newContactLabel}
                          onChange={(e) => setNewContactLabel(e.target.value)}
                          placeholder="Label (e.g. Mom)"
                          className="px-2.5 py-1.5 text-xs bg-brand-bg/40 border border-primary/30 rounded-lg focus:outline-none focus:border-primary font-sans text-primary placeholder-primary/40"
                        />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={newContactId}
                          onChange={(e) => setNewContactId(e.target.value.replace(/\D/g, ''))}
                          placeholder="6-Digit ID"
                          className="px-2.5 py-1.5 text-xs bg-brand-bg/40 border border-primary/30 rounded-lg focus:outline-none focus:border-primary font-mono text-primary placeholder-primary/40"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-primary text-brand-bg rounded-lg text-xs font-mono font-medium tracking-wider hover:bg-primary/90 cursor-pointer active:scale-98 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD CONTACT</span>
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Bell Dropdown Container */}
          <div className="relative" ref={notifButtonRef}>
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowContactsDropdown(false);
              }}
              className={`relative p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                showNotifDropdown 
                  ? 'bg-primary text-brand-bg border-transparent' 
                  : 'bg-brand-bg text-primary border-primary/20 hover:border-primary/50'
              }`}
            >
              <Bell className="w-4 h-4 md:w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-brand-bg font-sans font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown List */}
            <AnimatePresence>
              {showNotifDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-[340px] md:w-[400px] p-4 bg-white border-2 border-primary rounded-xl shadow-[6px_6px_0px_0px_#A94A4A] z-40 text-primary space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4" />
                      <h3 className="text-xs font-mono uppercase tracking-wider font-bold">
                        Emergency Messages
                      </h3>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-mono uppercase text-primary hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-primary/50 space-y-1">
                        <MessageSquare className="w-8 h-8 opacity-40" />
                        <p className="text-xs font-mono">No notifications received.</p>
                        <p className="text-[10px] leading-relaxed max-w-[200px]">
                          Add this user's 6-digit ID <strong className="font-mono text-primary">{user.emergencyId}</strong> inside another account, and broadcast a message there!
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`p-3 rounded-lg border text-xs text-left transition-all ${
                            notif.read
                              ? 'bg-brand-bg/25 border-primary/10 text-primary/70'
                              : 'bg-primary/5 border-primary/35 text-primary font-medium shadow-sm'
                          } cursor-pointer hover:bg-primary/10`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-bold text-[12px]">
                              Sender: {notif.senderName} ({notif.senderEmergencyId})
                            </span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="font-sans leading-relaxed text-[11px] mb-2 whitespace-pre-wrap">
                            "{notif.message}"
                          </p>
                          <div className="flex items-center gap-1 font-mono text-[9px] text-primary/50">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(notif.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Secure Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 border-2 border-primary bg-white text-primary hover:bg-primary hover:text-brand-bg rounded-lg text-xs md:text-sm font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">LOGOUT</span>
          </button>
        </div>
      </nav>

      {/* Primary Message Compose Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Composer Board */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 md:p-8 rounded-2xl bg-white border-2 border-primary shadow-[6px_6px_0px_0px_#A94A4A] space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-xl md:text-2xl font-display font-semibold tracking-tight text-primary">
                Add Emergency Message
              </h2>
              <p className="text-xs font-mono text-primary/60 uppercase tracking-widest">
                Draft secure alert broadcast
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your emergency message details here (e.g., location, type of medical assist, status)..."
                className="w-full min-h-[140px] p-4 bg-brand-bg/50 border border-primary/30 rounded-xl focus:outline-none focus:border-primary text-primary placeholder-primary/40 font-sans text-sm md:text-base leading-relaxed resize-none"
              />
              
              {/* Informational guide */}
              <div className="flex items-start gap-2 text-[11px] text-primary/70 bg-brand-bg/30 p-3 rounded-lg border border-primary/10">
                <HelpCircle className="w-4 h-4 flex-shrink-0 text-primary/80" />
                <p className="leading-normal">
                  Your message will be sent to all {user.emergencyContacts?.length || 0} contacts in your emergency list.
                  {user.emergencyContacts?.length === 0 && (
                    <strong className="text-primary block mt-0.5 font-bold">
                      ⚠️ Note: You have no active contacts! Click "EMERGENCY CONTACTS" in the navbar above to add up to 5 IDs.
                    </strong>
                  )}
                </p>
              </div>

              {/* Standard Compose Send Button (in-panel) */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleBroadcast}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/95 text-brand-bg rounded-xl text-xs md:text-sm font-mono font-medium tracking-wider transition-all duration-300 shadow active:scale-98 cursor-pointer"
                >
                  <span>SEND BROADCAST</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Broadcast History Panel */}
          <div className="p-6 rounded-2xl bg-white border border-primary/30 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
              Your Broadcast History
            </h3>
            
            <div className="space-y-3">
              {getMessages().filter(m => m.senderId === user.id).length === 0 ? (
                <p className="text-xs font-mono text-primary/50 text-center py-6">
                  You have not broadcasted any emergency alerts yet.
                </p>
              ) : (
                getMessages()
                  .filter(m => m.senderId === user.id)
                  .map((msg) => (
                    <div key={msg.id} className="p-3.5 bg-brand-bg/10 border border-primary/15 rounded-xl text-xs space-y-2">
                      <p className="font-sans text-primary/90 leading-relaxed">
                        "{msg.message}"
                      </p>
                      <div className="flex flex-wrap justify-between items-center gap-2 pt-1.5 border-t border-primary/5 text-[10px] font-mono text-primary/60">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <div>
                          Sent to: <span className="font-bold">{msg.recipientIds.length} contact(s)</span>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* REQUIRED STANDARD FLOATING BUTTON (FAB) in Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          onClick={handleBroadcast}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-14 h-14 bg-primary hover:bg-primary/95 text-brand-bg rounded-full shadow-[0px_4px_16px_rgba(169,74,74,0.4)] border border-transparent cursor-pointer group relative"
          title="Floating Broadcast Button - Click to Send Typed Message"
        >
          {/* Animated pulsing outer halo */}
          <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping opacity-75 group-hover:animate-none" />
          <Send className="w-5 h-5 relative z-10" />
        </motion.button>
      </div>
    </div>
  );
}
