import { User, EmergencyContact, EmergencyMessage, Notification } from '../types';

const USERS_KEY = 'emergency_app_users';
const MESSAGES_KEY = 'emergency_app_messages';
const NOTIFICATIONS_KEY = 'emergency_app_notifications';

// Helper to generate a random 6-digit string
export function generateEmergencyId(existingIds: string[]): string {
  let id = '';
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existingIds.includes(id));
  return id;
}

// Initial seed data
const SEED_USERS: User[] = [
  {
    id: 'user-jane-smith',
    firstName: 'Jane',
    surname: 'Smith',
    email: 'jane@example.com',
    password: 'password123',
    emergencyId: '246810',
    emergencyContacts: [
      { id: 'c-1', targetEmergencyId: '135791', label: 'John Doe' },
      { id: 'c-2', targetEmergencyId: '369258', label: 'Sarah Williams' }
    ]
  },
  {
    id: 'user-john-doe',
    firstName: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    emergencyId: '135791',
    emergencyContacts: [
      { id: 'c-3', targetEmergencyId: '246810', label: 'Jane Smith' }
    ]
  },
  {
    id: 'user-sarah-williams',
    firstName: 'Sarah',
    surname: 'Williams',
    email: 'sarah@example.com',
    password: 'password123',
    emergencyId: '369258',
    emergencyContacts: [
      { id: 'c-4', targetEmergencyId: '246810', label: 'Jane Smith' },
      { id: 'c-5', targetEmergencyId: '135791', label: 'John Doe' }
    ]
  }
];

const SEED_MESSAGES: EmergencyMessage[] = [
  {
    id: 'msg-seed-1',
    senderId: 'user-john-doe',
    senderFirstName: 'John',
    senderSurname: 'Doe',
    senderEmergencyId: '135791',
    message: 'Medical alert! I need assistance at my location as soon as possible.',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    recipientIds: ['user-jane-smith']
  }
];

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-seed-1',
    userId: 'user-jane-smith',
    messageId: 'msg-seed-1',
    senderName: 'Doe',
    senderEmergencyId: '135791',
    message: 'Medical alert! I need assistance at my location as soon as possible.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false
  }
];

export function initializeDatabase(): void {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(MESSAGES_KEY)) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(SEED_MESSAGES));
  }
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(SEED_NOTIFICATIONS));
  }
}

export function getUsers(): User[] {
  initializeDatabase();
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getMessages(): EmergencyMessage[] {
  initializeDatabase();
  const data = localStorage.getItem(MESSAGES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveMessages(messages: EmergencyMessage[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function getNotifications(): Notification[] {
  initializeDatabase();
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveNotifications(notifications: Notification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

// Check if an emergency ID belongs to a registered user
export function getUserByEmergencyId(emergencyId: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.emergencyId === emergencyId);
}

// Broadcast Message Core Logic
export function broadcastEmergencyMessage(senderId: string, messageText: string): EmergencyMessage {
  const users = getUsers();
  const sender = users.find(u => u.id === senderId);
  if (!sender) {
    throw new Error('Sender user not found');
  }

  const messages = getMessages();
  const notifications = getNotifications();

  // Find recipient user IDs by checking who matches the targetEmergencyId in sender's contacts
  const recipientIds: string[] = [];
  const contacts = sender.emergencyContacts || [];

  contacts.forEach(contact => {
    const targetUser = users.find(u => u.emergencyId === contact.targetEmergencyId);
    if (targetUser) {
      recipientIds.push(targetUser.id);
    }
  });

  const messageId = `msg-${Date.now()}`;
  const newMessage: EmergencyMessage = {
    id: messageId,
    senderId: sender.id,
    senderFirstName: sender.firstName,
    senderSurname: sender.surname,
    senderEmergencyId: sender.emergencyId,
    message: messageText,
    timestamp: new Date().toISOString(),
    recipientIds
  };

  messages.unshift(newMessage);
  saveMessages(messages);

  // Generate notifications for each active recipient
  recipientIds.forEach(recipientId => {
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: recipientId,
      messageId: messageId,
      senderName: sender.surname,
      senderEmergencyId: sender.emergencyId,
      message: messageText,
      timestamp: newMessage.timestamp,
      read: false
    };
    notifications.unshift(notif);
  });

  saveNotifications(notifications);
  return newMessage;
}
