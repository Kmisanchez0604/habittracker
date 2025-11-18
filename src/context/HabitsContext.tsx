// src/context/HabitsContext.tsx (solo la función updateHabitCompletion necesita cambio)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  useGetAllHabitsQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useDeleteHabitMutation,
  useAddCompletionMutation,
  useRemoveCompletionMutation,
  useGetAllCategoriesQuery
} from '../store/habitsApi';
import { Habit, HabitCompletion } from '../types/Habits.types';



interface HabitsContextType {
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  updateHabitCompletion: (habitId: string, date: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'completions'>) => void;
  updateHabit: (habitId: string, habit: Omit<Habit, 'id' | 'completions'>) => void;
  deleteHabit: (habitId: string) => void;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

// Función para obtener el inicio de la semana (domingo) para una fecha dada
const getWeekStartDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - day);
  return weekStart.toISOString().split('T')[0];
};

// Función para obtener todos los días de la semana para una fecha dada
const getWeekDates = (dateString: string): string[] => {
  const weekStart = new Date(getWeekStartDate(dateString));
  const weekDates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }
  
  return weekDates;
};

export const HabitsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: habitsData = [] } = useGetAllHabitsQuery();
  const { data: categoriesData = [] } = useGetAllCategoriesQuery();
  const [createHabit] = useCreateHabitMutation();
  const [updateHabitMutation] = useUpdateHabitMutation();
  const [deleteHabitMutation] = useDeleteHabitMutation();
  const [addCompletionMutation] = useAddCompletionMutation();
  const [removeCompletionMutation] = useRemoveCompletionMutation();

  const [habits, setHabits] = useState<Habit[]>([]);

  // Keep local context state synced with RTK Query data
  useEffect(() => {
    setHabits(habitsData);
  }, [habitsData]);

  const updateHabitCompletion = (habitId: string, date: string) => {
    // Find the habit in local state
    const habit = habits.find(h => String(h.id) === String(habitId));
    if (!habit) return;

    if (habit.frequency === 'daily') {
      const existing = habit.completions?.find((c: HabitCompletion) => c.date === date);
      if (existing) {
        // remove completion
        removeCompletionMutation({ habitId: Number(habitId), date }).catch(() => {});
      } else {
        // add completion
        addCompletionMutation({ habitId: Number(habitId), date }).catch(() => {});
      }
    } else {
      // weekly: toggle the week's completion by adding/removing entries for the week's dates
      const weekStart = getWeekStartDate(date);
      const existingWeekly = habit.completions?.find((c: HabitCompletion) => getWeekStartDate(c.date) === weekStart);
      const weekDates = getWeekDates(date);
      if (existingWeekly) {
        // remove all week dates
        weekDates.forEach(d => removeCompletionMutation({ habitId: Number(habitId), date: d }).catch(() => {}));
      } else {
        weekDates.forEach(d => addCompletionMutation({ habitId: Number(habitId), date: d }).catch(() => {}));
      }
    }
  };

  const addHabit = (habitData: Omit<Habit, 'id' | 'completions'> & { createdAt?: string }) => {
    // Call RTK mutation to persist 
    (async () => {
      try {
          const created = await createHabit({ 
            name: habitData.name, 
            categoryId: habitData?.categoryId, 
            time: habitData?.time, 
            description: habitData.description, 
            frequency: habitData.frequency,
            isDone: habitData.isDone,
            icon: habitData.icon,
            createdAt: (habitData as any).createdAt ?? undefined,
          }).unwrap();
        if (created) setHabits(prev => [...prev, created as Habit]);
      } catch (e) {
        console.warn('create habit failed', e);
      }
    })();
  };

  const updateHabit = (habitId: string, habitData: Omit<Habit, 'id' | 'completions'>) => {
    (async () => {
      try {
        const updated = await updateHabitMutation({ id: Number(habitId), name: habitData.name, categoryId: habitData.categoryId, time: habitData.time, description: habitData.description, frequency: habitData.frequency } as any).unwrap();
        if (updated) setHabits(prev => prev.map(h => String(h.id) === String(habitId) ? updated as Habit : h));
      } catch (e) {
        console.warn('update habit failed', e);
      }
    })();
  };

  const deleteHabit = (habitId: string) => {
    (async () => {
      try {
        await deleteHabitMutation({ id: Number(habitId) }).unwrap();
        setHabits(prev => prev.filter(h => String(h.id) !== String(habitId)));
      } catch (e) {
        console.warn('delete habit failed', e);
      }
    })();
  };

  return (
    <HabitsContext.Provider value={{
      habits,
      setHabits,
      updateHabitCompletion,
      addHabit,
      updateHabit,
      deleteHabit
    }}>
      {children}
    </HabitsContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
};