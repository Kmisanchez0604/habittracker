import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle 
} from '@ionic/react';

import { Bar, Doughnut } from 'react-chartjs-2';

import { 
  Chart as ChartJS, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  ArcElement,
  Tooltip,
  Legend,
  Title 
} from 'chart.js';

import { useGetAllHabitsQuery } from '../store/habitsApi';
import LogoutButton from '../components/LogoutButton';
import "./Progress.css";

ChartJS.register(
  BarElement, 
  CategoryScale, 
  LinearScale, 
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const Progress: React.FC = () => {
  const userId = typeof sessionStorage !== 'undefined'
    ? Number(sessionStorage.getItem('userId')) || undefined
    : undefined;

  const { data: habits = [] } = useGetAllHabitsQuery({ userId });

  // ===============================
  //  PROGRESO SEMANAL
  // ===============================
  const getWeeklyProgressData = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const labels: string[] = [];
    const completionRates: number[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);

      const dateString = date.toISOString().split('T')[0];

      labels.push(weekDays[date.getDay()]);

      let done = 0;
      habits.forEach((habit: any) => {
        const comp = habit.completions.find((c: any) => c.date === dateString);
        if (comp?.completed) done++;
      });

      const pct = habits.length > 0 ? (done / habits.length) * 100 : 0;
      completionRates.push(Math.round(pct));
    }

    return { labels, data: completionRates };
  };

  // ===============================
  // PROGRESO POR HÁBITO
  // ===============================
  const getHabitProgressData = () => {
    const labels = habits.map((h: any) => h.name);

    const completedCounts = habits.map((h: any) => {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      let count = 0;
      h.completions.forEach((comp: any) => {
        const compDate = new Date(comp.date);
        if (comp.completed && compDate >= weekAgo && compDate <= today) {
          count++;
        }
      });

      return count;
    });

    return { labels, data: completedCounts };
  };

  // ===============================
  // DISTRIBUCIÓN DIARIO / SEMANAL
  // ===============================
  const getFrequencyDistribution = () => {
    const daily = habits.filter((h: any) => h.frequency === 'daily').length;
    const weekly = habits.filter((h: any) => h.frequency === 'weekly').length;

    return {
      labels: ['Diarios', 'Semanales'],
      data: [daily, weekly],
      colors: ['#36A2EB', '#FF6384']
    };
  };

  const weeklyData = getWeeklyProgressData();
  const habitData = getHabitProgressData();
  const freqData = getFrequencyDistribution();

  const weeklyChartData = {
    labels: weeklyData.labels,
    datasets: [
      {
        label: '% de Completados',
        data: weeklyData.data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
    ],
  };

  const habitChartData = {
    labels: habitData.labels,
    datasets: [
      {
        label: 'Completados (Últimos 7 días)',
        data: habitData.data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
    ],
  };

  const frequencyChartData = {
    labels: freqData.labels,
    datasets: [
      {
        label: 'Distribución de Hábitos',
        data: freqData.data,
        backgroundColor: freqData.colors,
        borderColor: freqData.colors.map(c => c),
        borderWidth: 1,
      },
    ],
  };

  const weeklyOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Progreso Semanal' },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (value: any) => value + '%' }
      },
    },
  };

  const habitOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Hábitos más completados' },
    },
  };

  const avgWeekly = Math.round(weeklyData.data.reduce((a, b) => a + b, 0) / 7);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Progreso y Estadísticas</IonTitle>
          <LogoutButton />
        </IonToolbar>
      </IonHeader>

      <IonContent className="progress-content">

        {habits.length === 0 ? (
          <IonCard className="progress-card">
            <IonCardContent className="center-text">
              <h3>No hay hábitos registrados</h3>
              <p>Crea algunos hábitos para ver estadísticas aquí.</p>
            </IonCardContent>
          </IonCard>
        ) : (
          <>
            {/* ========================== */}
            {/*  RESUMEN GENERAL            */}
            {/* ========================== */}
            <IonCard className="progress-card">
              <IonCardHeader>
                <IonCardTitle className="progress-title">Resumen General</IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                <div className="summary-box">
                  <div>
                    <h3 className="summary-total">{habits.length}</h3>
                    <p>Total Hábitos</p>
                  </div>

                  <div>
                    <h3 className="summary-weekly">{avgWeekly}%</h3>
                    <p>Promedio Semanal</p>
                  </div>

                  <div>
                    <h3 className="summary-daily">
                      {habits.filter((h: any) => h.frequency === 'daily').length}
                    </h3>
                    <p>Hábitos Diarios</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* ========================== */}
            {/*  GRAFICO SEMANAL           */}
            {/* ========================== */}
            <IonCard className="progress-card">
              <IonCardHeader>
                <IonCardTitle className="progress-title">Progreso Semanal</IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                <div className="chart-container">
                  <Bar data={weeklyChartData} options={weeklyOptions} />
                </div>
              </IonCardContent>
            </IonCard>

            {/* ========================== */}
            {/* HABITOS MÁS COMPLETADOS   */}
            {/* ========================== */}
            <IonCard className="progress-card">
              <IonCardHeader>
                <IonCardTitle className="progress-title">Hábitos Más Completados</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="chart-container">
                  <Bar data={habitChartData} options={habitOptions} />
                </div>
              </IonCardContent>
            </IonCard>

            {/* ========================== */}
            {/* DISTRIBUCIÓN              */}
            {/* ========================== */}
            <IonCard className="progress-card">
              <IonCardHeader>
                <IonCardTitle className="progress-title">Distribución de Hábitos</IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                <div className="chart-donut">
                  <Doughnut data={frequencyChartData} />
                </div>
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Progress;
