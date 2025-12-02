import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonCard,
  IonCardContent,
  IonFab,
  IonFabButton,
  IonCheckbox,
  IonIcon,
  IonItemDivider,
  useIonViewWillEnter
} from '@ionic/react';

import { add } from 'ionicons/icons';
import { useHistory } from 'react-router';
import IconRenderer from '../components/IconRenderer';
import { useGetTodaysHabitsQuery, useGetTodayProgressQuery } from '../store/habitsApi';
import { Habit } from '../types/Habits.types';
import HabitFormModal from '../components/HabitFormModal';
import { useHabits } from '../context/HabitsContext';
import LogoutButton from '../components/LogoutButton';

import React, { useState } from 'react';
import "./Home.css";

const CircularProgress: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 96 }) => {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={radius} stroke="#eee" strokeWidth={stroke} fill="none" />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke="#0452d7ff"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={16} fill="#ffffffff">
        {percentage}%
      </text>
    </svg>
  );
};

const formatTime = (time?: string | null) => {
  if (!time) return '';
  const [h, mRaw] = time.split(':');
  const m = mRaw.slice(0, 2);
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour + 11) % 12) + 1;
  return `${String(hour12).padStart(2, '0')}:${m} ${ampm}`;
};


const Home: React.FC = () => {
  const history = useHistory();
  const userId = Number(sessionStorage.getItem('userId')) || undefined;

  const { data: todaysHabits = [], refetch } = useGetTodaysHabitsQuery(userId);
  const { data: progress = { percentage: 0, total: 0, completed: 0 } } = useGetTodayProgressQuery(userId);

  const { updateHabitCompletion } = useHabits();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Record<string, boolean>>({});

  useIonViewWillEnter(() => refetch?.());

  return (
    <IonPage>

      {/* HEADER */}
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>HabitTracker</IonTitle>
          <LogoutButton />
        </IonToolbar>
      </IonHeader>

      {/* CONTENIDO */}
      <IonContent className="ion-padding home-container">

        {/* TITULO SUPERIOR */}
        <h2 className="home-h2">¡Hola!</h2>
        <p className="home-p">Estas son tus tareas pendientes de hoy, ¡Complétalas!</p>

        <IonButton size="small" className="home-small-btn" onClick={() => history.push('/habits')}>
          Ver más hábitos
        </IonButton>

        {/* PROGRESO Y RESUMEN */}
        <div className="home-progress-row">
          <div className="progress-center">
            <CircularProgress percentage={progress.percentage} />

            <div className="progress-text">
              <div className="progress-count">{progress.completed}/{progress.total}</div>
              <div className="progress-sub">Completados / Hoy</div>
            </div>
          </div>
        </div>

        {/* TARJETA DE LISTA */}
        <IonCard className="home-card">
          <IonCardContent>

            {todaysHabits.length === 0 ? (
              <p className="home-empty">No tienes hábitos pendientes para hoy.</p>
            ) : (
              <>
                {/* PENDIENTES */}
                <h3>Pendientes</h3>
                <IonList>
                  {todaysHabits.filter(h => !h?.completions?.some(c => c.completed)).map((h: Habit) => (
                    <IonItem
                      key={h.id}
                      className={animatingIds[h.id] ? 'habit-anim' : ''}
                    >
                      <div className="habit-row">
                        <IonCheckbox
                          slot="start"
                          checked={false}
                          onIonChange={async () => {
                            setAnimatingIds(a => ({ ...a, [h.id]: true }));
                            setTimeout(async () => {
                              await updateHabitCompletion(h.id, new Date().toISOString().split('T')[0]);
                              setAnimatingIds(a => ({ ...a, [h.id]: false }));
                            }, 300);
                          }}
                        />

                        <IconRenderer name={h.icon} />

                        <div className="habit-info">
                          <div className="habit-title">{h.name}</div>
                          <div className="habit-desc">{h.description}</div>
                        </div>

                        <div className="habit-time">{formatTime(h.time)}</div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>

                <IonItemDivider />

                {/* COMPLETADOS */}
                <h3>Completados</h3>
                <IonList>
                  {todaysHabits.filter(h => h?.completions?.some(c => c.completed)).map((h: Habit) => (
                    <IonItem key={h.id}>
                      <div className="habit-row">
                        <IonCheckbox
                          slot="start"
                          checked={true}
                          onIonChange={() =>
                            updateHabitCompletion(h.id, new Date().toISOString().split('T')[0])
                          }
                        />

                        <IconRenderer name={h.icon} />

                        <div className="habit-info">
                          <div className="habit-title completed">{h.name}</div>
                          <div className="habit-desc">{h.description}</div>
                        </div>

                        <div className="habit-time">{formatTime(h.time)}</div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </>
            )}

          </IonCardContent>
        </IonCard>

        {/* BOTÓN FLOTANTE */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <HabitFormModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)} />

      </IonContent>
    </IonPage>
  );
};

export default Home;
