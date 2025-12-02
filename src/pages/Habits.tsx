import {
  IonAlert,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
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
import { formatDate, getWeekStartDate } from '../helpers/dates';
import { useGetAllCategoriesQuery, useGetAllHabitsQuery } from '../store/habitsApi';

import { Habit, HabitCompletion } from '../types/Habits.types';
import { Category } from '../types/Categories.types';

import MonthCalendar from '../components/MonthCalendar';
import LogoutButton from '../components/LogoutButton';

import { formatDate, getWeekStartDate } from '../helpers/dates';

import "./Habits.css";

const Habits: React.FC = () => {

  const { updateHabitCompletion, deleteHabit } = useHabits();

  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  /** Fecha inicial */
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  /** Data */
  const { data: habits = [] } = useGetAllHabitsQuery(selectedDate);
  const { data: categories = [] } = useGetAllCategoriesQuery();

  /** Verifica completado */
  const getCompletionForDate = (habit: Habit, date: string): boolean => {
    if (habit.frequency === "daily") {
      return !!habit.completions?.find(c => c.date === date && c.completed);
    } else {
      const weekStart = getWeekStartDate(date);
      return !!habit.completions?.find(c => getWeekStartDate(c.date) === weekStart);
    }
  };

  /** Conteo semanal */
  const getWeeklyCompletions = (habit: Habit): number => {
    if (habit.frequency === "daily") {
      return habit.completions?.filter(c => c.completed).length || 0;
    }
    const setWeeks = new Set(
      habit.completions?.map(c => getWeekStartDate(c.date))
    );
    return setWeeks.size;
  };

  /** Formato hora */
  const formatTime = (t?: string | null) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hh = parseInt(h);
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${m.slice(0,2)} ${ampm}`;
  };

  /** Cuántos están completos hoy */
  const completedToday = useMemo(
    () => habits.filter(h => getCompletionForDate(h, selectedDate)).length,
    [habits, selectedDate]
  );

  /** Confirm delete */
  const confirmDelete = (id: string) => {
    setHabitToDelete(id);
    setShowAlert(true);
  };

  return (
    <IonPage>
      {/* HEADER */}
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis Hábitos</IonTitle>
          <LogoutButton />
        </IonToolbar>
      </IonHeader>

      {/* CONTENT */}
      <IonContent className="habits-content">

        {/* TARJETA DE CALENDARIO */}
        <IonCard className="glass-card">
          <IonCardHeader>
            <IonCardTitle className="section-title">
              <IonIcon icon={calendar} /> Progreso Diario
            </IonCardTitle>
          </IonCardHeader>

          <IonCardContent>

            <IonItem className="glass-item">
              <IonLabel position="stacked">Seleccionar Fecha</IonLabel>

              <MonthCalendar
                value={selectedDate}
                onChange={(d) => setSelectedDate(d)}
              />

            </IonItem>

            <p className="date-text">
              {formatDate(selectedDate)} — marca los hábitos completados
            </p>

            <IonButton
              fill="outline"
              size="small"
              className="btn-today"
              onClick={() =>
                setSelectedDate(new Date().toISOString().split("T")[0])
              }
            >
              <IonIcon icon={calendar} slot="start" />
              Volver a Hoy
            </IonButton>

          </IonCardContent>
        </IonCard>

        {/* BOTÓN CREAR */}
        <IonButton
          className="btn-create"
          onClick={() => {
            setEditingHabit(null);
            setIsModalOpen(true);
          }}
        >
          <IonIcon icon={add} slot="start" /> Crear Hábito
        </IonButton>

        {/* MODAL */}
        <HabitFormModal
          isOpen={isModalOpen}
          initial={editingHabit}
          initialDate={selectedDate}
          onDidDismiss={() => setIsModalOpen(false)}
        />

        {/* TARJETA LISTA DE HABITOS */}
        <IonCard className="glass-card">
          <IonCardHeader>
            <IonCardTitle className="section-title">
              Mis Hábitos ({habits.length})
              <IonBadge className="badge-progress">
                {completedToday}/{habits.length} completados
              </IonBadge>
            </IonCardTitle>
          </IonCardHeader>

          <IonCardContent>

            {habits.length === 0 ? (
              <p className="no-habits-text">
                No hay hábitos registrados. ¡Crea tu primer hábito!
              </p>
            ) : (
              <IonList>

                {habits.map(habit => {
                  const isCompleted = getCompletionForDate(habit, selectedDate);
                  const wc = getWeeklyCompletions(habit);

                  return (
                    <IonItem key={habit.id} className="glass-item habit-item">

                      <IonCheckbox
                        checked={isCompleted}
                        onIonChange={() =>
                          updateHabitCompletion(habit.id, selectedDate)
                        }
                        slot="start"
                      />

                      {/* INFO */}
                      <div className="habit-info">

                        <h3 className={isCompleted ? "habit-title completed" : "habit-title"}>
                          <IconRenderer name={habit.icon ?? categories.find(c => c.id == habit.categoryId)?.icon} />
                          {habit.name}
                          {habit.time && <span className="habit-time">{formatTime(habit.time)}</span>}
                        </h3>

                        {habit.description && (
                          <p className="habit-description">{habit.description}</p>
                        )}

                        <div className="habit-footer">
                          <span className="habit-frequency">
                            Frecuencia: {habit.frequency === "daily" ? "Diario" : "Semanal"}
                          </span>
                          <IonBadge className="badge-small">
                            {habit.frequency === "daily"
                              ? `${wc}/7 días`
                              : `${wc} semanas`}
                          </IonBadge>
                        </div>

                      </div>

                      <IonButtons slot="end">
                        <IonButton fill="clear" onClick={() => { setEditingHabit(habit); setIsModalOpen(true); }}>
                          <IonIcon icon={create} />
                        </IonButton>

                        <IonButton fill="clear" color="danger" onClick={() => confirmDelete(habit.id)}>
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

        {/* ALERT DELETE */}
        <IonAlert
          isOpen={showAlert}
          header="Eliminar Hábito"
          message="¿Estás seguro? Esta acción no se puede deshacer."
          onDidDismiss={() => setShowAlert(false)}
          buttons={[
            { text: "Cancelar", role: "cancel" },
            {
              text: "Eliminar",
              role: "destructive",
              handler: () => habitToDelete && deleteHabit(habitToDelete)
            }
          ]}
        />

      </IonContent>
    </IonPage>
  );
};

export default Habits;
