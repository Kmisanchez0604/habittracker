import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonAvatar, IonList, IonDatetime, IonToast } from '@ionic/react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import sqlite from '../services/sqlite';
import { setUser } from '../store/userSlice';

const Profile: React.FC = () => {
  const user = useAppSelector(s => s.user);
  const dispatch = useAppDispatch();

  const [fullname, setFullname] = useState(user?.fullname ?? '');
  const [birthDate, setBirthDate] = useState<string | null>(user?.birthDate ?? null);
  const [weight, setWeight] = useState<string | null>(user?.weight ? String(user.weight) : null);
  const [toast, setToast] = useState<{ show: boolean; message?: string }>({ show: false });

  useEffect(() => {
    setFullname(user?.fullname ?? '');
    setBirthDate(user?.birthDate ?? null);
    setWeight(user?.weight ? String(user.weight) : null);
  }, [user]);

  const save = async () => {
    if (!user || !user.id) {
      setToast({ show: true, message: 'Usuario no encontrado' });
      return;
    }
    if (!fullname || !fullname.trim()) {
      setToast({ show: true, message: 'Nombre requerido' });
      return;
    }
    try {
      await sqlite.executeSql('UPDATE Users SET fullname = ?, birthDate = ?, weight = ? WHERE id = ?', [fullname, birthDate ?? null, weight ? Number(weight) : null, user.id]);
      const updated = await sqlite.querySql('SELECT * FROM Users WHERE id = ? LIMIT 1', [user.id]);
      const u = updated[0];
      dispatch(setUser({ id: Number(u.id), email: u.email, fullname: u.fullname ?? null, birthDate: u.birthDate ?? null, weight: u.weight ?? null }));
      setToast({ show: true, message: 'Perfil actualizado' });
    } catch (err) {
      console.error('profile save error', err);
      setToast({ show: true, message: 'Error guardando' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 12 }}>
          <IonAvatar style={{ width: 96, height: 96, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {user?.fullname ? user.fullname.split(' ').map(p=>p[0]).slice(0,2).join('') : (user?.email ? user.email[0].toUpperCase() : 'U')}
          </IonAvatar>
          <h2 style={{ margin: 0 }}>{user?.fullname ?? user?.email}</h2>
        </div>

        <IonList style={{ marginTop: 16 }}>
          <IonItem>
            <IonLabel position="stacked">Nombre Completo*</IonLabel>
            <IonInput value={fullname} onIonChange={e => setFullname(e.detail.value ?? '')} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Fecha de Nacimiento</IonLabel>
            <IonDatetime displayFormat="DD-MM-YYYY" value={birthDate ?? undefined} onIonChange={e => setBirthDate(e.detail.value!)} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Peso (kg)</IonLabel>
            <IonInput type="number" value={weight ?? ''} onIonChange={e => setWeight(e.detail.value ?? null)} />
          </IonItem>

          <div style={{ padding: 16 }}>
            <IonButton expand="block" onClick={save}>Guardar</IonButton>
          </div>
        </IonList>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false })} />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
