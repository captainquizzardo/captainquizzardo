export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  age: number;
  gender: string;
  district: string;
  state: string;
  createdAt: Date;
  isAdmin?: boolean;
}

export interface UserStats {
  rank: number;
  quizzesPlayed: number;
  totalWinnings: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  type: 'free' | 'paid';
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  questions: number; // total number of questions
  prizeMoney: number[]; // array of prizes [1st, 2nd, 3rd, etc.]
  entryFee?: number;
  maxParticipants?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // admin user id
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  timeSpent: number;
  rank: number;
}

export interface PaymentInfo {
  id: string;
  userId: string;
  quizId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  paymentMethod: string;
  timestamp: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<string | undefined>;
  verifyOTP: (otp: string) => Promise<void>;
}
