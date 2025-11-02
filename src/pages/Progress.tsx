import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale);

const Progress: React.FC = () => {
  const data = {
    labels: ['Ejercicio', 'Lectura', 'Agua'],
    datasets: [
      { label: 'Días completados', data: [5, 3, 6], backgroundColor: 'rgba(54, 162, 235, 0.6)' },
    ],
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Progreso</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <Bar data={data} />
      </IonContent>
    </IonPage>
  );
};

export default Progress;
