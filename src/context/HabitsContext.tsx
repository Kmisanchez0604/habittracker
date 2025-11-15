// src/context/HabitsContext.tsx (solo la función updateHabitCompletion necesita cambio)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface HabitCompletion {
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  completions: HabitCompletion[];
}

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
  const [habits, setHabits] = useState<Habit[]>([]);

  // Cargar hábitos desde localStorage al montar
  useEffect(() => {
    const storedHabits = localStorage.getItem('habits');
    if (storedHabits) {
      try {
        setHabits(JSON.parse(storedHabits));
      } catch (error) {
        console.error('Error parsing stored habits:', error);
        setHabits([]);
      }
    }
  }, []);

  // Guardar hábitos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  const updateHabitCompletion = (habitId: string, date: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        if (habit.frequency === 'daily') {
          // Lógica para hábitos diarios
          const existingCompletion = habit.completions.find(comp => comp.date === date);
          
          if (existingCompletion) {
            return {
              ...habit,
              completions: habit.completions.map(comp =>
                comp.date === date ? { ...comp, completed: !comp.completed } : comp
              )
            };
          } else {
            return {
              ...habit,
              completions: [...habit.completions, { date, completed: true }]
            };
          }
        } else {
          // Lógica para hábitos semanales - usar la semana completa como unidad
          const weekStart = getWeekStartDate(date);
          const existingWeeklyCompletion = habit.completions.find(comp => 
            getWeekStartDate(comp.date) === weekStart
          );
          
          if (existingWeeklyCompletion) {
            // Si ya existe un registro para esta semana, eliminarlo (desmarcar)
            return {
              ...habit,
              completions: habit.completions.filter(comp => 
                getWeekStartDate(comp.date) !== weekStart
              )
            };
          } else {
            // Si no existe, agregar la semana como completada
            const weekDates = getWeekDates(date);
            const newCompletions = weekDates.map(weekDate => ({
              date: weekDate,
              completed: true
            }));
            
            return {
              ...habit,
              completions: [...habit.completions, ...newCompletions]
            };
          }
        }
      }
      return habit;
    }));
  };

  const addHabit = (habitData: Omit<Habit, 'id' | 'completions'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      completions: []
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const updateHabit = (habitId: string, habitData: Omit<Habit, 'id' | 'completions'>) => {
    setHabits(prev => prev.map(habit =>
      habit.id === habitId
        ? { ...habitData, id: habitId, completions: habit.completions }
        : habit
    ));
  };

  const deleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== habitId));
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