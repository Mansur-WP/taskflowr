export interface User {
  id: string;
  username: string;
  email: string;
  profile_color: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  due_date: string; // ISO date string or empty
  created_at: string;
  user_id: string;
  position: number;
}

export interface Reminder {
  taskId: string;
  title: string;
  dueDate: string;
  type: string;
  message: string;
}

export interface Analytics {
  total: number;
  completed: number;
  pending: number;
  priorityCounts: {
    low: number;
    medium: number;
    high: number;
  };
  categoryCounts: Record<string, number>;
}
