
export type ContentType = 'video' | 'pdf' | 'live' | 'external' | 'gmeet';
export type ThemeMode = 'light' | 'dark' | 'monochrome';
export type LanguageCode = 'en' | 'ta';
export type EmailFrequency = 'off' | 'daily' | 'weekly';
export type UserRole = 'peer'; 

export interface UserSettings {
  theme: ThemeMode;
  language: LanguageCode;
  isPrivateProfile: boolean;
  showEmail: boolean;
  // Notification detail
  enableNotifications: boolean;
  pushNotifications: boolean;
  emailDigest: boolean;
  emailFrequency: EmailFrequency;
  notifyOnLikes: boolean;
  notifyOnComments: boolean;
  notifyOnNewSkills: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  isEditor?: boolean; // Special flag for the person managing the app
  learningSkills: string[];
  teachingSkills: string[];
  settings?: UserSettings;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  createdBy: string;
  prominentResourceId?: string;
}

export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface ContentItem {
  id: string;
  skillId: string;
  type: ContentType;
  title: string;
  description: string;
  url: string;
  uploadedBy: string;
  uploaderName: string;
  timestamp: string;
  likes: number;
}

export type NotificationType = 'message' | 'session' | 'upload' | 'skill';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: {
    tab?: string;
    skillId?: string;
    contentId?: string;
  };
}
