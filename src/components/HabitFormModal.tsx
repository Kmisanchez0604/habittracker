import React, { useEffect, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonList,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonIcon,
} from '@ionic/react';
import { add, create } from 'ionicons/icons';
import { useHabits } from '../context/HabitsContext';
import IconRenderer from './IconRenderer';
import { Category } from '../types/Categories.types';
import { Habit } from '../types/Habits.types';
import { useGetAllCategoriesQuery } from '../store/habitsApi';

interface Props {
  isOpen: boolean;
  onDidDismiss: () => void;
  initial?: Omit<Habit, 'id' | 'completions'> | null;
  redirectAfterSave?: string | null; // path to redirect to after save (optional)
  initialDate?: string | null;
}

const DEFAULT_FORM: Omit<Habit, 'id' | 'completions'> = {
  name: '',
  description: '',
  frequency: 'daily',
  categoryId: null,
  isDone: false,
  createdAt: undefined,
  createdBy: undefined,
  icon: undefined,
  time: undefined,
};

type HabitFormModalProps = { 
    isOpen: boolean, 
    onDidDismiss: () => void, 
    initial?: Habit | null, 
    redirectAfterSave?: string | null, 
    initialDate?: string | null 
}

const HabitFormModal: React.FC<HabitFormModalProps> = ({ 
    isOpen, 
    onDidDismiss, 
    initial = null, 
    redirectAfterSave = null, 
    initialDate = null 
}) => {
  const { addHabit, updateHabit } = useHabits();
  const { data: categories = [] as Category[] } = useGetAllCategoriesQuery();

  const [form, setForm] = useState<Omit<Habit, 'id' | 'completions'>>(DEFAULT_FORM);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        description: initial.description || '',
        frequency: initial.frequency || 'daily',
        categoryId: initial.categoryId ?? null,
        isDone: initial.isDone ?? false,
        icon: initial.icon,
        time: initial.time,
        createdAt: initial.createdAt,
        createdBy: initial.createdBy,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [initial, isOpen]);

  const handleChange = (field: keyof typeof form, value: string | number | null | undefined) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.name.trim()) return;

    if (initial && initial?.id) {
      await updateHabit(initial?.id, form);
    } else {
      // pass createdAt if provided so createdAt can be set to selected date
      await addHabit({ ...(form as any), createdAt: initialDate ?? undefined });
    }

    onDidDismiss();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{initial ? 'Editar Hábito' : 'Crear Hábito'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>Cerrar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Nombre</IonLabel>
            <IonInput value={form.name} onIonInput={e => handleChange('name', e.detail.value)} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Categoría</IonLabel>
            <IonSelect value={form.categoryId} placeholder="Selecciona categoría" onIonChange={e => handleChange('categoryId', e.detail.value)}>
              {categories.map((c: Category) => (
                <IonSelectOption key={c.id} value={c.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconRenderer name={c.icon} size={16} />
                    <span>{c.name}</span>
                  </div>
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Descripción</IonLabel>
            <IonTextarea value={form.description} onIonInput={e => handleChange('description', e.detail.value)} rows={2} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Frecuencia</IonLabel>
            <div style={{ display: 'flex', gap: 10, width: '100%', paddingTop: 10 }}>
              <IonButton fill={form.frequency === 'daily' ? 'solid' : 'outline'} onClick={() => handleChange('frequency', 'daily')} style={{ flex: 1 }}>Diaria</IonButton>
              <IonButton fill={form.frequency === 'weekly' ? 'solid' : 'outline'} onClick={() => handleChange('frequency', 'weekly')} style={{ flex: 1 }}>Semanal</IonButton>
            </div>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Hora (opcional)</IonLabel>
            <IonInput type="time" value={form.time || ''} onIonInput={e => handleChange('time', e.detail.value)} />
          </IonItem>

          <div style={{ marginTop: 18, padding: '0 16px' }}>
            <IonButton expand="block" onClick={handleSave} disabled={!form.name || !form.name.trim()}>
              <IonIcon icon={initial ? create : add} slot="start" />
              {initial ? 'Actualizar Hábito' : 'Guardar Hábito'}
            </IonButton>
          </div>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default HabitFormModal;
