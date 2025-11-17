import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonButton,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButtons
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import IconRenderer from '../components/IconRenderer';
import {
  useGetAllHabitsQuery,
  useGetAllCategoriesQuery,
  useCreateHabitMutation,
  useCompleteHabitMutation
} from '../store/habitsApi';

const Habits: React.FC = () => {
    const { data: habits = [], isLoading: habitsLoading } = useGetAllHabitsQuery();
    const { data: categories = [], isLoading: categoriesLoading } = useGetAllCategoriesQuery();
    const [createHabit, { isLoading: creating }] = useCreateHabitMutation();
    const [completeHabit] = useCompleteHabitMutation();

    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
    const [time, setTime] = useState<string>('');

    console.log({habits});

    const onCreate = async () => {
      try {
        await createHabit({ name, categoryId, time }).unwrap();
        setShowModal(false);
        setName('');
        setCategoryId(undefined);
        setTime('');
      } catch (err) {
        console.warn('Create habit error', err);
      }
    };

    const onToggleDone = async (id: number, done: number) => {
      if (done === 1) return; // already done
      try {
        await completeHabit({ id }).unwrap();
      } catch (err) {
        console.warn('Complete habit error', err);
      }
    };

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Mis Hábitos</IonTitle>
            <IonButtons slot="end" />
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonList>
            {habitsLoading && (
              <IonItem>
                <IonLabel>Cargando...</IonLabel>
              </IonItem>
            )}

            {!habitsLoading && Array.isArray(habits) && habits.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                  <IconRenderer name={'FaRegSmile'} size={48} />
                </div>
                <div style={{ fontWeight: 600 }}>You have not created habits yet. Start creating one!</div>
              </div>
            )}

            {!habitsLoading && habits?.map((habit: any) => {
              const cat = categories?.find((c: any) => c.id === habit.categoryId) || null;
              return (
                <IonItem key={habit.id}>
                  <IonLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IconRenderer name={cat ? cat.icon : null} />
                      <div>
                        <div>{habit.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{cat ? cat.name : ''} {habit.time ? `· ${habit.time}` : ''}</div>
                      </div>
                    </div>
                  </IonLabel>
                  <IonCheckbox checked={Number(habit.isDone) === 1} onIonChange={() => onToggleDone(habit.id, habit.isDone)} />
                </IonItem>
              );
            })}
          </IonList>

          {/* FAB for creating a new habit (bottom-left) */}
          <IonFab vertical="bottom" horizontal="start" slot="fixed">
            <IonFabButton onClick={() => setShowModal(true)}>
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>

          <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Crear hábito</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div style={{ padding: 16 }}>
                <IonLabel>Nombre</IonLabel>
                <IonInput value={name} onIonChange={(e: any) => setName(e.detail.value)} placeholder="Ej. Leer 20 minutos" disabled={creating} />

                <IonLabel style={{ marginTop: 12 }}>Categoría</IonLabel>
                <IonSelect value={categoryId} onIonChange={(e: any) => setCategoryId(Number(e.detail.value))} placeholder={categoriesLoading ? 'Cargando categorías...' : 'Selecciona categoría'} disabled={creating || categoriesLoading}>
                  {categories?.map((c: any) => (
                    <IonSelectOption key={c.id} value={c.id}>{c.name}</IonSelectOption>
                  ))}
                </IonSelect>

                <IonLabel style={{ marginTop: 12 }}>Hora</IonLabel>
                <IonInput type="time" value={time} onIonChange={(e: any) => setTime(e.detail.value)} disabled={creating} />

                <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                  <IonButton onClick={() => setShowModal(false)} color="medium" disabled={creating}>Cancelar</IonButton>
                  <IonButton onClick={onCreate} disabled={creating || !name}>
                    {creating ? 'Creando...' : 'Crear'}
                  </IonButton>
                </div>
              </div>
            </IonContent>
          </IonModal>
        </IonContent>
      </IonPage>
    );
  };

  export default Habits;
