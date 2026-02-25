
import { User, Skill, ContentItem, Comment, AppNotification } from './types';

const STORAGE_KEY = 'intellipeer_data';

interface AppData {
  version: string;
  users: User[];
  skills: Skill[];
  contents: ContentItem[];
  comments: Comment[];
  notifications: AppNotification[];
  currentUser: User | null;
}

const APP_VERSION = '2.0.0-clean';

const INITIAL_SKILLSWAP_USERS: User[] = [];

const INITIAL_SKILLS: Skill[] = [];

const INITIAL_CONTENTS: ContentItem[] = [];

export const DEFAULT_DATA: AppData = {
  version: APP_VERSION,
  users: INITIAL_SKILLSWAP_USERS,
  skills: INITIAL_SKILLS,
  contents: INITIAL_CONTENTS,
  comments: [],
  notifications: [],
  currentUser: null,
};

export const loadData = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.version !== APP_VERSION) {
        console.log("Old data version detected. Resetting to clean dataset.");
        return DEFAULT_DATA;
      }
      return {
        ...DEFAULT_DATA,
        ...parsed,
        notifications: parsed.notifications || []
      };
    } catch (e) {
      console.error("Failed to parse stored data", e);
      return DEFAULT_DATA;
    }
  }
  return DEFAULT_DATA;
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
