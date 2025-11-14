
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string (contains image or video data)
  mediaType?: 'image' | 'video'; // To determine how to render
  timestamp: number;
  feedback?: 'like' | 'dislike';
}

export interface ChatSession {
  id: string;
  title: string;
  date: string; // ISO String
  timestamp: number; // For sorting
  messages: Message[];
}
