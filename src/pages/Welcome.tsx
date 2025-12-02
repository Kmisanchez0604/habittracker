import {
  IonPage,
  IonContent,
  IonButton
} from "@ionic/react";

import "./Welcome.css";


const Welcome: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="welcome-container">

        
        {/* Títulos */}
        <h1 className="welcome-title">Bienvenido</h1>
        <p className="welcome-subtitle">
          Construye hábitos que transforman tu vida ✨
        </p>

        {/* Botones */}
        <div className="welcome-buttons">
          <IonButton expand="block" className="btn-primary" routerLink="/login">
            Iniciar Sesión
          </IonButton>

          <IonButton expand="block" className="btn-secondary" routerLink="/register">
            Crear Cuenta
          </IonButton>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Welcome;
