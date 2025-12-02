import React from 'react';
import { IonButtons, IonButton, IonIcon } from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import notificationService from '../services/notifications';

const LogoutButton: React.FC = () => {
  const history = useHistory();

  const onLogout = () => {
    try {
      sessionStorage.removeItem('userId');
    } catch {}
    try { notificationService.stop(); } catch {}
    history.replace('/login');
  };

  return (
    <IonButtons slot="end">
      <IonButton color="medium" fill="clear" onClick={onLogout}>
        <IonIcon icon={logOutOutline} slot="icon-only" />
      </IonButton>
    </IonButtons>
  );
};

export default LogoutButton;
