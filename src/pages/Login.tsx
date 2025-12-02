import { IonButton, IonContent, IonInput, IonPage, IonToast } from "@ionic/react";
import React, { useState } from 'react';
import { useHistory } from "react-router-dom";
import "./Login.css";
import "./Register.css"; // shared auth styles (scoped to .auth-page)
import { useLoginUserMutation } from '../store/habitsApi';
import { useAppDispatch } from '../store/hooks';
import { setUser } from '../store/userSlice';

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message?: string }>({ show: false });
  const dispatch = useAppDispatch();

  const [loginUser] = useLoginUserMutation();

  const handleLogin = async () => {
    if (!email || !password) {
      setToast({ show: true, message: 'Completa correo y contraseña' });
      return;
    }
    try {
      const res = await loginUser({ email, password }).unwrap();
      if (!res) {
        setToast({ show: true, message: 'Usuario o contraseña incorrectos' });
        return;
      }
      const u = res;
      sessionStorage.setItem('userId', String(u.id));
      dispatch(setUser({ id: Number(u.id), email: u.email, fullname: u.fullname ?? null, birthDate: u.birthDate ?? null, weight: u.weight ?? null }));
      history.push('/app/home');
    } catch (err) {
      console.error('login error', err);
      setToast({ show: true, message: 'Error al iniciar sesión' });
    }
  };

  return (
    <IonPage>
      
      {/* IonContent centrado REAL */}
      <IonContent fullscreen className="auth-page center-screen">

        {/* Caja centrada */}
        <div className="center-box">

          <h2 className="auth-title">Ingresar</h2>

          <IonInput
            className="auth-input"
            placeholder="Correo electrónico"
            value={email}
            onIonChange={(e) => setEmail(String(e.detail.value))}
            type="email"
            fill="outline"
          />

          <IonInput
            className="auth-input"
            placeholder="Contraseña"
            value={password}
            onIonChange={(e) => setPassword(String(e.detail.value))}
            type="password"
            fill="outline"
          />

          <IonButton
            expand="block"
            className="auth-button"
            onClick={handleLogin}
          >
            Entrar
          </IonButton>

          <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false })} />

          <p className="auth-link">
            ¿No tienes cuenta?{' '}
            <IonButton 
              className="auth-link-action"
              href="/register"
            >
              Registrarse
            </IonButton>
          </p>

        </div>
      </IonContent>

    </IonPage>
  );
};

export default Login;
