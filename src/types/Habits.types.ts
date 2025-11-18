export interface HabitCompletion {
  id: string;
  date: string;
  habitId: string;
  completed: boolean;
}


export interface Habit {
  id: string;
  name: string;
  categoryId?: string | null | undefined;  
  icon?: string;
  description: string;
  frequency: 'daily' | 'weekly';
  time?: string | null | undefined;
  isDone: boolean;
  createdAt?: string;
  createdBy?: number;
  completions: HabitCompletion[];
}


