export enum UserRole {
  ADMIN = 'مدير',
  TEACHER = 'مدرس',
  STAFF = 'موظف'
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  parentPhone: string;
  grade: string;
  balance: number;
  joinedAt: string;
  subscriptionExpiryDate?: string; // ISO Date for subscription tracking
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  percentage: number; // Percentage share per session
  phone: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  schedule: string; // e.g., "Sat, Mon 10:00 AM"
  studentIds: string[];
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  timestamp: string;
}

export interface Session {
  id: string;
  groupId: string;
  date: string; // ISO Date
  startTime: string;
  status: 'scheduled' | 'active' | 'completed';
  topic?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  studentId?: string; // Optional linkage to student
  teacherId?: string; // Optional linkage to teacher
  notes?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}
