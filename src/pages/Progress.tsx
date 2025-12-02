import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
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
import AvatarButton from '../components/AvatarButton';

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
  const userId = typeof sessionStorage !== 'undefined' ? Number(sessionStorage.getItem('userId')) || undefined : undefined;
  const { data: habits = [] } = useGetAllHabitsQuery({ userId });

  // Calcular progreso semanal
  const getWeeklyProgressData = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Domingo
    
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weekDates = [];
    const completionRates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      weekDates.push(weekDays[date.getDay()]);
      
      // Calcular porcentaje de completados para este día
      let completedCount = 0;
      habits.forEach((habit: any) => {
        const completion = habit.completions.find((comp: any) => comp.date === dateString);
        if (completion && completion.completed) {
          completedCount++;
        }
      });
      
      const completionRate = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
      completionRates.push(Math.round(completionRate));
    }

    return { labels: weekDates, data: completionRates };
  };

  // Calcular progreso por hábito
  const getHabitProgressData = () => {
    const habitNames = habits.map((habit: any) => habit.name);
    const completionCounts = habits.map((habit: any) => {
      // Contar completados de los últimos 7 días
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      
      let completed = 0;
      habit.completions.forEach((comp: any) => {
        const compDate = new Date(comp.date);
        if (comp.completed && compDate >= weekAgo && compDate <= today) {
          completed++;
        }
      });
      
      return completed;
    });

    return { labels: habitNames, data: completionCounts };
  };

  // Calcular distribución de frecuencia
  const getFrequencyDistribution = () => {
    const dailyCount = habits.filter((habit: any) => habit.frequency === 'daily').length;
    const weeklyCount = habits.filter((habit: any) => habit.frequency === 'weekly').length;
    
    return {
      labels: ['Diarios', 'Semanales'],
      data: [dailyCount, weeklyCount],
      colors: ['#36A2EB', '#FF6384']
    };
  };

  const weeklyData = getWeeklyProgressData();
  const habitData = getHabitProgressData();
  const frequencyData = getFrequencyDistribution();

  // Gráfico de progreso semanal
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

  // Gráfico de hábitos más completados
  const habitChartData = {
    labels: habitData.labels,
    datasets: [
      { 
        label: 'Completados (últimos 7 días)', 
        data: habitData.data, 
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
    ],
  };

  // Gráfico de distribución de frecuencia
  const frequencyChartData = {
    labels: frequencyData.labels,
    datasets: [
      {
        label: 'Distribución de Hábitos',
        data: frequencyData.data,
        backgroundColor: frequencyData.colors,
        borderColor: frequencyData.colors.map(color => color.replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Progreso Semanal',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
    },
  };

  const habitChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Hábitos Más Completados',
      },
    },
  };

  const averageWeeklyCompletion = Math.round(weeklyData.data.reduce((a, b) => a + b, 0) / 7);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Progreso y Estadísticas</IonTitle>
          <AvatarButton />
          <LogoutButton />
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {habits.length === 0 ? (
          <IonCard>
            <IonCardContent style={{ textAlign: 'center' }}>
              <h3>No hay hábitos registrados</h3>
              <p>Comienza creando algunos hábitos para ver tu progreso aquí.</p>
            </IonCardContent>
          </IonCard>
        ) : (
          <>
            {/* Resumen general */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Resumen General</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <h3 style={{ color: '#36A2EB', margin: 0 }}>{habits.length}</h3>
                    <p style={{ margin: 0 }}>Total Hábitos</p>
                  </div>
                  <div>
                    <h3 style={{ color: '#4BC0C0', margin: 0 }}>
                      {averageWeeklyCompletion}%
                    </h3>
                    <p style={{ margin: 0 }}>Promedio Semanal</p>
                  </div>
                  <div>
                    <h3 style={{ color: '#FF6384', margin: 0 }}>
                      {habits.filter((h: any) => h.frequency === 'daily').length}
                    </h3>
                    <p style={{ margin: 0 }}>Hábitos Diarios</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Gráfico de progreso semanal */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Progreso Semanal</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <Bar data={weeklyChartData} options={chartOptions} />
              </IonCardContent>
            </IonCard>

            {/* Gráfico de hábitos más completados */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Hábitos Más Completados</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <Bar data={habitChartData} options={habitChartOptions} />
              </IonCardContent>
            </IonCard>

            {/* Gráfico de distribución */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Distribución de Hábitos</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ height: '300px' }}>
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