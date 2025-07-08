import { Types } from 'mongoose';

export interface ChatMessageData {
  text: string;
  senderId: string;
  roomId: string;
}

export interface SavedMessage {
  id: string;
  text: string;
  senderId: string;
  roomId: string;
  createdAt: string;
  sender: any;
}

// Định nghĩa interface cho message đã populate
export interface PopulatedMessage {
  _id: string | Types.ObjectId;
  text: string;
  senderId: {
    _id: string | Types.ObjectId;
    username?: string;
    email?: string;
    avatar?: string;
  };
  conversationId: string | Types.ObjectId;
  createdAt: Date;
}
