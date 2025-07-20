export interface User {
  id: number;
  username: string;
}

export interface Chat {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  loading: boolean;
}