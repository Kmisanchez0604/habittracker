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
  IonDatetime,
  IonFooter,
  IonButtons,
  IonIcon
} from '@ionic/react';
import { useState } from 'react';
import IconRenderer from '../components/IconRenderer';
import {
  useGetAllHabitsQuery,
  useCreateHabitMutation,
  useGetAllCategoriesQuery,
  useCompleteHabitMutation
} from '../store/sqlApi';
import { checkmarkOutline } from 'ionicons/icons';

const Habits: React.FC = () => {
  const { data: habits = [], isLoading: habitsLoading } = useGetAllHabitsQuery();
  const { data: categories = [] } = useGetAllCategoriesQuery();
  const [createHabit] = useCreateHabitMutation();
  const [completeHabit] = useCompleteHabitMutation();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [time, setTime] = useState<string>('12:00');

  const onCreate = async () => {
    try {
      await createHabit({ name, categoryId, time }).unwrap();
      setShowModal(false);
      setName('');
      setCategoryId(undefined);
      setTime('12:00');
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
          <IonButtons slot="end">
            <IonButton onClick={() => setShowModal(true)}>Nuevo</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {habitsLoading && <IonItem><IonLabel>Cargando...</IonLabel></IonItem>}
          {!habitsLoading && habits.map((habit: any) => {
            const cat = categories.find((c: any) => c.id === habit.categoryId) || null;
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
      </IonContent>

      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Crear hábito</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: 16 }}>
            <IonLabel>Nombre</IonLabel>
            <IonInput value={name} onIonChange={(e: any) => setName(e.detail.value)} placeholder="Ej. Leer 20 minutos" />

            <IonLabel style={{ marginTop: 12 }}>Categoría</IonLabel>
            <IonSelect value={categoryId} onIonChange={(e) => setCategoryId(Number(e.detail.value))} placeholder="Selecciona categoría">
              {categories.map((c: any) => (
                <IonSelectOption key={c.id} value={c.id}>{c.name}</IonSelectOption>
              ))}
            </IonSelect>

            <IonLabel style={{ marginTop: 12 }}>Hora</IonLabel>
            <IonInput type="time" value={time} onIonChange={(e: any) => setTime(e.detail.value)} />

            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <IonButton onClick={() => setShowModal(false)} color="medium">Cancelar</IonButton>
              <IonButton onClick={onCreate}>Crear</IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Habits;
