import {
  IonPage,
  IonContent,
  IonButton
} from "@ionic/react";

import "./Welcome.css";
import { useHistory } from "react-router-dom";


const Welcome: React.FC = () => {
  const history = useHistory()
  return (
    <IonPage>
      <IonContent className="welcome-container center-screen">

        
        {/* Títulos */}
        <h1 className="welcome-title">Bienvenido</h1>
        <p className="welcome-subtitle">
          Construye hábitos que transforman tu vida ✨
        </p>

        {/* Botones */}
        <div className="welcome-buttons">
          <IonButton expand="block" className="btn-primary" onClick={() => history.push('/login')}>
            Iniciar Sesión
          </IonButton>

          <IonButton expand="block" className="btn-secondary" onClick={() => history.push('/register')}>
            Crear Cuenta
          </IonButton>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Welcome;
