import {
  IonAlert,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem, IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { add, calendar, create, trash } from 'ionicons/icons';
import React, { useMemo, useState } from 'react';
import IconRenderer from '../components/IconRenderer';
import HabitFormModal from '../components/HabitFormModal';
import { useHabits } from '../context/HabitsContext';
import { useGetAllCategoriesQuery, useGetAllHabitsQuery } from '../store/habitsApi';
import { Habit, HabitCompletion } from '../types/Habits.types';
import MonthCalendar from '../components/MonthCalendar';
import { Category } from '../types/Categories.types';
import { formatDate, getWeekStartDate } from '../helpers/dates';
import LogoutButton from '../components/LogoutButton';
import AvatarButton from '../components/AvatarButton';



const Habits: React.FC = () => {
  const { updateHabitCompletion, deleteHabit } = useHabits();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  
  // Obtener fecha actual del sistema (hoy) - CORREGIDO
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    // Asegurarnos de que sea la fecha local, no UTC
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // fetch habits for the selected date (pass selectedDate to refetch when it changes)
  const { data: habits = [] as Habit[] } = useGetAllHabitsQuery(selectedDate);
  const { data: categories = [] as Category[] } = useGetAllCategoriesQuery();

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteHabit(id);
    setShowAlert(false);
    setHabitToDelete(null);
  };

  const confirmDelete = (id: string) => {
    setHabitToDelete(id);
    setShowAlert(true);
  };

  // Verificar si un hábito está completado para una fecha específica
  const getCompletionForDate = (habit: Habit, date: string): boolean => {
    if (habit.frequency === 'daily') {
      const completion = habit?.completions?.find((comp: HabitCompletion) => comp.date === date);
      return completion ? completion?.completed : false;
    } else {
      const weekStart = getWeekStartDate(date);
      const weeklyCompletion = habit?.completions?.find((comp: HabitCompletion) => getWeekStartDate(comp?.date) === weekStart);
      return weeklyCompletion ? true : false;
    }
  };

  // Obtener el número de semanas completadas en el último mes
  const getWeeklyCompletions = (habit: Habit): number => {
    if (habit.frequency === 'daily') {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      let completions = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        if (getCompletionForDate(habit, dateString)) {
          completions++;
        }
      }
      return completions;
    } else {
      const completedWeekStarts = new Set();
      habit?.completions?.forEach((comp: HabitCompletion) => {
        const weekStart = getWeekStartDate(comp.date);
        completedWeekStarts.add(weekStart);
      });
      
      return completedWeekStarts.size;
    }
  };

  const getFrequencyText = (frequency: 'daily' | 'weekly'): string => {
    return frequency === 'daily' ? 'Diario' : 'Semanal';
  };

  const formatTime = (time?: string | null) => {
    if (!time) return '';
    const parts = String(time).split(':');
    if (parts.length < 2) return time;
    const h = parseInt(parts[0], 10);
    const m = parts[1].slice(0,2);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12) + 1;
    return `${String(hour12).padStart(2, '0')}:${m} ${ampm}`;
  };

  const completedToday = useMemo(() => habits.filter(habit => getCompletionForDate(habit, selectedDate)).length, [habits, selectedDate]);

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD - CORREGIDA
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis Hábitos</IonTitle>
          <AvatarButton />
          <LogoutButton />
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Selector de fecha - AHORA PRIMERO */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={calendar} /> Progreso Diario
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
                <IonItem>
                  <IonLabel position="stacked">Seleccionar Fecha</IonLabel>
                  <div style={{ width: '100%' }}>
                    <MonthCalendar value={selectedDate} onChange={(d) => setSelectedDate(d)} />
                  </div>
                </IonItem>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px', fontWeight: 'bold' }}>
              {formatDate(selectedDate)} - Marca los hábitos completados
            </p>
            <IonButton 
              fill="outline" 
              size="small" 
              onClick={() => setSelectedDate(getTodayDate())}
              style={{ marginTop: '10px' }}
            >
              <IonIcon icon={calendar} slot="start" />
              Volver a Hoy
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Use modal for create/update */}
        <div style={{ margin: '12px 0' }}>
          <IonButton onClick={() => { setIsModalOpen(true); setEditingHabit(null); }}>
            <IonIcon icon={add} slot="start" /> Crear Hábito
          </IonButton>
        </div>
        <HabitFormModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)} initial={editingHabit} initialDate={selectedDate} />

        {/* Lista de hábitos con checkboxes */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Mis Hábitos ({habits.length})
              <IonBadge color="success" style={{ marginLeft: '10px' }}>
                {completedToday}/{habits.length} completados
              </IonBadge>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {habits.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>
                No hay hábitos registrados. ¡Crea tu primer hábito!
              </p>
            ) : (
              <IonList>
                {habits.map(habit => {
                  const isCompleted = getCompletionForDate(habit, selectedDate);
                  const completionsCount = getWeeklyCompletions(habit);
                  
                  return (
                    <IonItem key={habit.id}>
                      <IonCheckbox 
                        checked={isCompleted} 
                        onIonChange={() => updateHabitCompletion(habit.id, selectedDate)} 
                        slot="start"
                      />
                      <div style={{ flex: 1 }}>
                            <h3 style={{ 
                          margin: '0 0 5px 0', 
                          fontWeight: 'bold',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          color: isCompleted ? '#666' : '#000'
                        }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <IconRenderer name={habit.icon ?? (categories.find(c => c.id == habit.categoryId)?.icon)} />
                                <span>{habit.name}</span>
                                {habit.time && (
                                  <small style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
                                    {formatTime(habit.time)}
                                  </small>
                                )}
                              </span>
                          {habit.frequency === 'weekly' && isCompleted && (
                            <IonBadge color="success" style={{ marginLeft: '8px', fontSize: '10px' }}>
                              Semana Completada
                            </IonBadge>
                          )}
                        </h3>
                        {habit.description && (
                          <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                            {habit.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ margin: 0, color: '#3880ff', fontSize: '12px', fontWeight: 'bold' }}>
                            Frecuencia: {getFrequencyText(habit.frequency)}
                          </p>
                          <IonBadge color="primary" style={{ fontSize: '10px' }}>
                            {habit.frequency === 'daily' 
                              ? `${completionsCount}/7 días esta semana`
                              : `${completionsCount} semanas completadas`
                            }
                          </IonBadge>
                        </div>
                      </div>

                      <IonButtons slot="end">
                        <IonButton 
                          fill="clear" 
                          color="primary"
                          onClick={() => handleEdit(habit)}
                        >
                          <IonIcon icon={create} />
                        </IonButton>
                        <IonButton 
                          fill="clear" 
                          color="danger"
                          onClick={() => confirmDelete(habit.id)}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </IonButtons>
                    </IonItem>
                  );
                })}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* Alerta de confirmación para eliminar */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => {
            setShowAlert(false);
            setHabitToDelete(null);
          }}
          header={'Eliminar Hábito'}
          message={'¿Estás seguro de que quieres eliminar este hábito? Esta acción no se puede deshacer.'}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => {
                setShowAlert(false);
                setHabitToDelete(null);
              }
            },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: () => {
                if (habitToDelete) {
                  handleDelete(habitToDelete);
                }
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Habits;
