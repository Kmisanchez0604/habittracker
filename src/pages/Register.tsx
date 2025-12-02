import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonToast
} from '@ionic/react';

import { eye, eyeOff, arrowBack } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import "./Register.css";
import { useAppDispatch } from '../store/hooks';
import { setUser } from '../store/userSlice';
import { useCreateUserMutation } from '../store/habitsApi';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullname, setFullname] = useState('');
  const [showToast, setShowToast] = useState({ open: false, msg: '' });
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const [createUser] = useCreateUserMutation();

  const history = useHistory();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRegister = async() => {
    if (!email || !password || !confirm) {
      return setShowToast({ open: true, msg: 'Todos los campos son obligatorios ❤️' });
    }

    if (!validateEmail(email)) {
      return setShowToast({ open: true, msg: 'Correo inválido 😅' });
    }

    if (password.length < 6) {
      return setShowToast({ open: true, msg: 'La contraseña debe tener mínimo 6 caracteres 🔐' });
    }

    if (password !== confirm) {
      return setShowToast({ open: true, msg: 'Las contraseñas no coinciden 😓' });
    }

    try {
      if (!fullname || !fullname.trim()) {
        setShowToast({ open: true, msg: 'Ingresa tu nombre completo' });
        return;
      }
      const res = await createUser({ email, password, fullname }).unwrap();
      if (!res) {
        setShowToast({ open: true, msg: 'Error creando usuario' });
        return;
      }
      const u = res;
      sessionStorage.setItem('userId', String(u.id));
      dispatch(setUser({ id: Number(u.id), email: u.email, fullname: u.fullname ?? null, birthDate: u.birthDate ?? null, weight: u.weight ?? null }));
      history.push('/app/home');
    } catch (err) {
      console.error('register error', err);
      setShowToast({ open: true, msg: 'Error creando usuario' });
    }
  };

  return (
    <IonPage>

<IonContent className="auth-page register-container">

  

  <IonButton fill="clear" onClick={() => history.push('/login')} className="back-btn">
    <IonIcon icon={arrowBack} slot="start" />
    Volver
  </IonButton>

  <div className="form-wrapper">
    <h1 className="register-title">Crear Cuenta</h1>

    <IonItem>
      <IonLabel position="floating">Nombre completo</IonLabel>
      <IonInput
        value={fullname}
        onIonChange={(e) => setFullname(e.detail.value!)}
      />
    </IonItem>

    <IonItem>
      <IonLabel position="floating">Correo</IonLabel>
      <IonInput
        type="email"
        value={email}
        onIonChange={(e) => setEmail(e.detail.value!)}
      />
    </IonItem>

    <IonItem>
      <IonLabel position="floating">Contraseña</IonLabel>
      <IonInput
        type={showPassword ? 'text' : 'password'}
        value={password}
        onIonChange={(e) => setPassword(e.detail.value!)}
      />
      <IonIcon
        icon={showPassword ? eyeOff : eye}
        slot="end"
        onClick={() => setShowPassword(!showPassword)}
      />
    </IonItem>

    <IonItem>
      <IonLabel position="floating">Confirmar contraseña</IonLabel>
      <IonInput
        type={showPassword ? 'text' : 'password'}
        value={confirm}
        onIonChange={(e) => setConfirm(e.detail.value!)}
      />
    </IonItem>

    <IonButton expand="block" onClick={handleRegister} className="register-btn">
      Registrarme
    </IonButton>

  </div>

</IonContent>

  <IonToast isOpen={showToast.open} message={showToast.msg} duration={2000} onDidDismiss={() => setShowToast({ open: false, msg: '' })} />

    </IonPage>
  );
};

export default Register;
/* 
import { IonDatetime, IonList } from '@ionic/react';
import React, { useState } from 'react';
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
      history.replace('/app/home');
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
 */