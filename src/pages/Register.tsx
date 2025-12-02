import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonList, IonDatetime } from '@ionic/react';
import { useHistory } from 'react-router';
import sqlite from '../services/sqlite';
import { useAppDispatch } from '../store/hooks';
import { setUser } from '../store/userSlice';

const Register: React.FC = () => {
  const history = useHistory();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullname, setFullname] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message?: string }>({ show: false });

  const startCreate = async () => {
    if (!email || !password) {
      setToast({ show: true, message: 'Email y password requeridos' });
      return;
    }
    if (password !== confirm) {
      setToast({ show: true, message: 'Passwords no coinciden' });
      return;
    }

    try {
      // verify user doesn't exist
      const rows = await sqlite.querySql('SELECT * FROM Users WHERE email = ?', [email]);
      if (rows && rows.length > 0) {
        setToast({ show: true, message: 'Usuario ya existe. Inicia sesión.' });
        return;
      }

      await sqlite.executeSql('INSERT INTO Users (email, password) VALUES (?,?)', [email, password]);
      const created = await sqlite.querySql('SELECT id, email FROM Users WHERE email = ? LIMIT 1', [email]);
      const user = created[0];
      if (user && user.id) {
        sessionStorage.setItem('userId', String(user.id));
        // set basic user in store
        dispatch(setUser({ id: Number(user.id), email: user.email }));
        setStep(2);
      } else {
        setToast({ show: true, message: 'No se pudo crear usuario' });
      }
    } catch (err) {
      console.error('register error', err);
      setToast({ show: true, message: 'Error creando usuario' });
    }
  };

  const finishProfile = async () => {
    if (!fullname || !fullname.trim()) {
      setToast({ show: true, message: 'Nombre requerido' });
      return;
    }
    try {
      const sid = sessionStorage.getItem('userId');
      const userId = sid ? Number(sid) : null;
      if (!userId) {
        setToast({ show: true, message: 'Session ausente' });
        return;
      }
      await sqlite.executeSql('UPDATE Users SET fullname = ?, birthDate = ?, weight = ? WHERE id = ?', [fullname, birthDate ?? null, weight ? Number(weight) : null, userId]);
      // fetch updated
      const updated = await sqlite.querySql('SELECT * FROM Users WHERE id = ? LIMIT 1', [userId]);
      const u = updated[0];
      dispatch(setUser({ id: Number(u.id), email: u.email, fullname: u.fullname ?? null, birthDate: u.birthDate ?? null, weight: u.weight ?? null }));
      history.replace('/Home');
    } catch (err) {
      console.error('finish profile error', err);
      setToast({ show: true, message: 'Error guardando perfil' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Registro</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {step === 1 ? (
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput type="password" value={password} onIonChange={e => setPassword(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Confirmar Password</IonLabel>
              <IonInput type="password" value={confirm} onIonChange={e => setConfirm(e.detail.value!)} />
            </IonItem>
            <div style={{ padding: 16 }}>
              <IonButton expand="block" onClick={startCreate}>Crear usuario</IonButton>
            </div>
          </IonList>
        ) : (
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Nombre Completo*</IonLabel>
              <IonInput value={fullname} onIonChange={e => setFullname(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Fecha de Nacimiento</IonLabel>
              <IonDatetime displayFormat="DD-MM-YYYY" placeholder="Selecciona fecha" value={birthDate ?? undefined} onIonChange={e => setBirthDate(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Peso (kg)</IonLabel>
              <IonInput type="number" value={weight ?? ''} onIonChange={e => setWeight(e.detail.value ?? null)} />
            </IonItem>
            <div style={{ padding: 16 }}>
              <IonButton expand="block" onClick={finishProfile}>Continuar</IonButton>
            </div>
          </IonList>
        )}

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false })} />
      </IonContent>
    </IonPage>
  );
};

export default Register;
