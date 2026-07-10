export interface EmergencyContact {
  id: string;
  targetEmergencyId: string; // The 6-digit emergency ID of the contact
  label: string; // Label like "Mom", "Doctor", etc.
}

export interface User {
  id: string;
  firstName: string;
  surname: string;
  email: string;
  password?: string;
  emergencyId: string; // Dynamic 6-digit ID generated on signup
  emergencyContacts: EmergencyContact[]; // Up to 5 contacts
}

export interface EmergencyMessage {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderSurname: string;
  senderEmergencyId: string;
  message: string;
  timestamp: string;
  recipientIds: string[]; // List of user IDs this message was broadcasted to
}

export interface Notification {
  id: string;
  userId: string; // Recipient user ID
  messageId: string;
  senderName: string; // Surname of sender
  senderEmergencyId: string;
  message: string;
  timestamp: string;
  read: boolean;
}
