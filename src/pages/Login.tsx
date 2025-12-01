import React, { useState } from 'react';
import { IonPage, IonInput, IonButton, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import "./Login.css";

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    history.push('/home');
  };

  return (
    <IonPage>
      
      {/* IonContent centrado REAL */}
      <IonContent fullscreen className="center-screen">

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

          <p className="auth-link">
            ¿No tienes cuenta?{' '}
            <span 
              className="auth-link-action"
              onClick={() => history.push('/register')}
            >
              Registrarse
            </span>
          </p>

        </div>
      </IonContent>

    </IonPage>
  );
};

export default Login;
