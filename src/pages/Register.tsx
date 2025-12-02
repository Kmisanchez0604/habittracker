import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonToast,
  IonIcon
} from '@ionic/react';

import { eye, eyeOff } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router';
import "./Register.css";

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showToast, setShowToast] = useState({ open: false, msg: '' });
  const [showPassword, setShowPassword] = useState(false);

  const history = useHistory();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRegister = () => {
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

    const user = { email, password };
    localStorage.setItem('user', JSON.stringify(user));

    history.push('/Login');
  };

  return (
    <IonPage>

<IonContent className="register-container">

  

  <div className="form-wrapper">
    <h1 className="register-title">Crear Cuenta</h1>

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

    </IonPage>
  );
};

export default Register;
