import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox, IonButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonAlert, IonIcon, IonButtons, IonBadge, IonAccordion,
  IonAccordionGroup
} from '@ionic/react';
import { trash, create, add, calendar, chevronDown } from 'ionicons/icons';
import { useHabits } from '../context/HabitsContext';

// Función auxiliar para obtener el inicio de la semana
const getWeekStartDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDay();
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - day);
  return weekStart.toISOString().split('T')[0];
};

const Habits: React.FC = () => {
  const { habits, updateHabitCompletion, addHabit, updateHabit, deleteHabit } = useHabits();
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  
  // Obtener fecha actual del sistema (hoy) - CORREGIDO
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    // Asegurarnos de que sea la fecha local, no UTC
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly'
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'daily'
    });
    setEditingHabit(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingHabit) {
      updateHabit(editingHabit.id, formData);
    } else {
      addHabit(formData);
    }
    resetForm();
  };

  const handleEdit = (habit: any) => {
    setFormData({
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency
    });
    setEditingHabit(habit);
  };

  const handleDelete = (id: string) => {
    deleteHabit(id);
    setShowAlert(false);
    setHabitToDelete(null);
    if (editingHabit && editingHabit.id === id) {
      resetForm();
    }
  };

  const confirmDelete = (id: string) => {
    setHabitToDelete(id);
    setShowAlert(true);
  };

  // Verificar si un hábito está completado para una fecha específica
  const getCompletionForDate = (habit: any, date: string): boolean => {
    if (habit.frequency === 'daily') {
      const completion = habit.completions.find((comp: any) => comp.date === date);
      return completion ? completion.completed : false;
    } else {
      const weekStart = getWeekStartDate(date);
      const weeklyCompletion = habit.completions.find((comp: any) => 
        getWeekStartDate(comp.date) === weekStart
      );
      return weeklyCompletion ? true : false;
    }
  };

  // Obtener el número de semanas completadas en el último mes
  const getWeeklyCompletions = (habit: any): number => {
    if (habit.frequency === 'daily') {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      let completions = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        if (getCompletionForDate(habit, dateString)) {
          completions++;
        }
      }
      return completions;
    } else {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      let completedWeeks = 0;
      
      const completedWeekStarts = new Set();
      habit.completions.forEach((comp: any) => {
        const weekStart = getWeekStartDate(comp.date);
        completedWeekStarts.add(weekStart);
      });
      
      return completedWeekStarts.size;
    }
  };

  const getFrequencyText = (frequency: 'daily' | 'weekly'): string => {
    return frequency === 'daily' ? 'Diario' : 'Semanal';
  };

  const completedToday = habits.filter(habit => getCompletionForDate(habit, selectedDate)).length;

  // Función para formatear la fecha en español - CORREGIDA
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    
    // Comparar solo año, mes y día (ignorar hora)
    const isToday = date.getDate() === today.getDate() && 
                   date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return 'Hoy';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD - CORREGIDA
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis Hábitos</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Selector de fecha - AHORA PRIMERO */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={calendar} /> Progreso Diario
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Seleccionar Fecha</IonLabel>
              <IonInput
                type="date"
                value={selectedDate}
                onIonInput={(e) => setSelectedDate(e.detail.value!)}
              />
            </IonItem>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px', fontWeight: 'bold' }}>
              {formatDate(selectedDate)} - Marca los hábitos completados
            </p>
            <IonButton 
              fill="outline" 
              size="small" 
              onClick={() => setSelectedDate(getTodayDate())}
              style={{ marginTop: '10px' }}
            >
              <IonIcon icon={calendar} slot="start" />
              Volver a Hoy
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Formulario de creación/edición - ACORDEÓN CON UNA SOLA FLECHA */}
        <IonAccordionGroup>
          <IonAccordion value="create-habit">
            <IonItem slot="header" color="light">
              <IonIcon icon={add} style={{ marginRight: '8px' }} />
              <IonLabel>
                <h2 style={{ fontWeight: 'bold', margin: 0 }}>
                  {editingHabit ? 'Editar Hábito' : 'Crear Nuevo Hábito'}
                </h2>
              </IonLabel>
              {/* SOLO UNA FLECHA - removemos el icon duplicado */}
            </IonItem>
            <div className="ion-padding" slot="content">
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">
                    Nombre <span style={{ color: 'red' }}>*</span>
                  </IonLabel>
                  <IonInput
                    value={formData.name}
                    placeholder="Ingresa el nombre del hábito"
                    onIonInput={(e) => handleInputChange('name', e.detail.value!)}
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Descripción</IonLabel>
                  <IonTextarea
                    value={formData.description}
                    placeholder="Descripción opcional del hábito"
                    onIonInput={(e) => handleInputChange('description', e.detail.value!)}
                    rows={2}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Frecuencia</IonLabel>
                  {/* SELECT COMO BOTONES HORIZONTALES */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', width: '100%' }}>
                    <IonButton 
                      fill={formData.frequency === 'daily' ? 'solid' : 'outline'}
                      onClick={() => handleInputChange('frequency', 'daily')}
                      style={{ flex: 1 }}
                    >
                      Diaria
                    </IonButton>
                    <IonButton 
                      fill={formData.frequency === 'weekly' ? 'solid' : 'outline'}
                      onClick={() => handleInputChange('frequency', 'weekly')}
                      style={{ flex: 1 }}
                    >
                      Semanal
                    </IonButton>
                  </div>
                </IonItem>
              </IonList>

              <div style={{ marginTop: '20px' }}>
                <IonButton 
                  expand="block" 
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                >
                  <IonIcon icon={add} slot="start" />
                  {editingHabit ? 'Actualizar Hábito' : 'Guardar Hábito'}
                </IonButton>

                {editingHabit && (
                  <IonButton 
                    expand="block" 
                    fill="outline" 
                    onClick={resetForm}
                    style={{ marginTop: '10px' }}
                  >
                    Cancelar Edición
                  </IonButton>
                )}
              </div>
            </div>
          </IonAccordion>
        </IonAccordionGroup>

        {/* Lista de hábitos con checkboxes */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Mis Hábitos ({habits.length})
              <IonBadge color="success" style={{ marginLeft: '10px' }}>
                {completedToday}/{habits.length} completados
              </IonBadge>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {habits.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>
                No hay hábitos registrados. ¡Crea tu primer hábito!
              </p>
            ) : (
              <IonList>
                {habits.map(habit => {
                  const isCompleted = getCompletionForDate(habit, selectedDate);
                  const completionsCount = getWeeklyCompletions(habit);
                  
                  return (
                    <IonItem key={habit.id}>
                      <IonCheckbox 
                        checked={isCompleted} 
                        onIonChange={() => updateHabitCompletion(habit.id, selectedDate)} 
                        slot="start"
                      />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          margin: '0 0 5px 0', 
                          fontWeight: 'bold',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          color: isCompleted ? '#666' : '#000'
                        }}>
                          {habit.name}
                          {habit.frequency === 'weekly' && isCompleted && (
                            <IonBadge color="success" style={{ marginLeft: '8px', fontSize: '10px' }}>
                              Semana Completada
                            </IonBadge>
                          )}
                        </h3>
                        {habit.description && (
                          <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                            {habit.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ margin: 0, color: '#3880ff', fontSize: '12px', fontWeight: 'bold' }}>
                            Frecuencia: {getFrequencyText(habit.frequency)}
                          </p>
                          <IonBadge color="primary" style={{ fontSize: '10px' }}>
                            {habit.frequency === 'daily' 
                              ? `${completionsCount}/7 días esta semana`
                              : `${completionsCount} semanas completadas`
                            }
                          </IonBadge>
                        </div>
                      </div>

                      <IonButtons slot="end">
                        <IonButton 
                          fill="clear" 
                          color="primary"
                          onClick={() => handleEdit(habit)}
                        >
                          <IonIcon icon={create} />
                        </IonButton>
                        <IonButton 
                          fill="clear" 
                          color="danger"
                          onClick={() => confirmDelete(habit.id)}
                        >
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

        {/* Alerta de confirmación para eliminar */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => {
            setShowAlert(false);
            setHabitToDelete(null);
          }}
          header={'Eliminar Hábito'}
          message={'¿Estás seguro de que quieres eliminar este hábito? Esta acción no se puede deshacer.'}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => {
                setShowAlert(false);
                setHabitToDelete(null);
              }
            },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: () => {
                if (habitToDelete) {
                  handleDelete(habitToDelete);
                }
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Habits;