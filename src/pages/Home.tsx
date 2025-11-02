import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react';
import { useHistory } from 'react-router';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>HabitTracker</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2>👋 Hola Cami</h2>
        <p>Empieza a construir hábitos positivos hoy 💪</p>
        <IonButton expand="block" onClick={() => history.push('/habits')}>
          Ver mis hábitos
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
