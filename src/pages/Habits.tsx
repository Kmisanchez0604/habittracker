import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonCheckbox } from '@ionic/react';
import { useState } from 'react';

const Habits: React.FC = () => {
  const [habits, setHabits] = useState([
    { id: 1, name: 'Hacer ejercicio', done: false },
    { id: 2, name: 'Leer 20 minutos', done: true },
    { id: 3, name: 'Tomar agua', done: false },
  ]);

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis Hábitos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {habits.map(habit => (
            <IonItem key={habit.id}>
              <IonLabel>{habit.name}</IonLabel>
              <IonCheckbox checked={habit.done} onIonChange={() => toggleHabit(habit.id)} />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Habits;
