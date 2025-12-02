import { IonPage, IonContent, IonButton, IonList, IonItem, IonLabel, IonText, IonCard, IonCardContent, IonFab, IonFabButton, IonCheckbox, IonIcon, IonItemDivider, useIonViewWillEnter } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router';
import IconRenderer from '../components/IconRenderer';
import { useGetTodaysHabitsQuery, useGetTodayProgressQuery } from '../store/habitsApi';
import { Habit } from '../types/Habits.types';
import HabitFormModal from '../components/HabitFormModal';
import { useHabits } from '../context/HabitsContext';
import React, { useState } from 'react';
// header moved to shared PrivateLayout in App.tsx
import { useAppSelector } from '../store/hooks';

const CircularProgress: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 96 }) => {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#eee"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#3880ff"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={16} fill="#222">
        {percentage}%
      </text>
    </svg>
  );
};

const formatTime = (time?: string | null) => {
  if (!time) return '';
  const parts = String(time).split(':');
  if (parts.length < 2) return time;
  const h = parseInt(parts[0], 10);
  const m = parts[1].slice(0, 2);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${String(hour12).padStart(2, '0')}:${m} ${ampm}`;
};

const Home: React.FC = () => {
  const history = useHistory();
  const user = useAppSelector(s => s.user);

  const userId = typeof sessionStorage !== 'undefined' ? Number(sessionStorage.getItem('userId')) || undefined : undefined;
  const { data: todaysHabits = [], refetch } = useGetTodaysHabitsQuery(userId, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const { data: progress = { percentage: 0, total: 0, completed: 0 } } = useGetTodayProgressQuery(userId);
  const { updateHabitCompletion } = useHabits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Record<string, boolean>>({});

  useIonViewWillEnter(() => {
    if (typeof refetch === 'function') refetch();
  });

  return (
    <IonPage>
      {/* Header is provided by the PrivateLayout */}

      <IonContent className="ion-padding">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress percentage={progress.percentage} />
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{progress.completed}/{progress.total}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Completados / Hoy</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{`¡Hola! ${user?.fullname ? user.fullname.split(' ')[0] : ''}`}</h2>
            <p style={{ marginTop: 6, marginBottom: 6 }}>Estas son tus tareas pendientes de hoy, ¡Complétalas!</p>
            <IonButton size="small" onClick={() => history.push('/app/habits')}>Ver más hábitos</IonButton>
          </div>
        </div>

        <IonCard style={{ marginTop: 16 }}>
          <IonCardContent>
            {todaysHabits.length === 0 ? (
              <p style={{ color: '#666' }}>No tienes hábitos pendientes para hoy.</p>
            ) : (
              <>
                {/* Pending (not completed) */}
                <div>
                  <h3 style={{ marginTop: 0 }}>Pendientes</h3>
                  <IonList>
                    {todaysHabits.filter(h => {
                      // consider completed presence in completions array
                      const hasCompleted = !!h?.completions?.find(c => c?.date && c?.completed);
                      return !hasCompleted;
                    }).map((h: Habit) => (
                      <IonItem key={h.id} style={animatingIds[h.id] ? { transform: 'translateX(10px)', opacity: 0, transition: 'transform 300ms, opacity 300ms' } : undefined}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                          <IonCheckbox slot="start" checked={false} onIonChange={async () => {
                            // animate then complete
                            setAnimatingIds(a => ({ ...a, [h.id]: true }));
                            setTimeout(async () => {
                              await updateHabitCompletion(h.id, (new Date()).toISOString().split('T')[0]);
                              setAnimatingIds(a => ({ ...a, [h.id]: false }));
                            }, 300);
                          }} />
                          <IconRenderer name={h.icon} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>{h.name}</div>
                            <div style={{ color: '#666', fontSize: 12 }}>{h.description}</div>
                          </div>
                          <div style={{ minWidth: 80, textAlign: 'right' }}>{h.time ? formatTime(h.time) : ''}</div>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </div>

                <IonItemDivider />

                {/* Completed */}
                <div style={{ marginTop: 8 }}>
                  <h3>Completados</h3>
                  <IonList>
                    {todaysHabits.filter(h => {
                      return !!h?.completions?.find(c => c?.date && c?.completed);
                    }).map((h: Habit) => (
                      <IonItem key={h.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                          <IonCheckbox slot="start" checked={true} onIonChange={async () => {
                            // un-complete
                            await updateHabitCompletion(h.id, (new Date()).toISOString().split('T')[0]);
                          }} />
                          <IconRenderer name={h.icon} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', textDecoration: 'line-through', color: '#666' }}>{h.name}</div>
                            <div style={{ color: '#666', fontSize: 12 }}>{h.description}</div>
                          </div>
                          <div style={{ minWidth: 80, textAlign: 'right' }}>{h.time ? formatTime(h.time) : ''}</div>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </div>
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* FAB to create habit from Home */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <HabitFormModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)} initial={null} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
