import React from 'react';
import { IonButton, IonAvatar, IonIcon, IonButtons } from '@ionic/react';
import { personCircle } from 'ionicons/icons';
import { useHistory } from 'react-router';
import { useAppSelector } from '../store/hooks';

const AvatarButton: React.FC = () => {
  const history = useHistory();
  const user = useAppSelector(s => s.user);
  const initials = user?.fullname ? user.fullname.split(' ').map(p=>p[0]).slice(0,2).join('') : (user?.email ? user.email[0].toUpperCase() : 'U');

  return (
    <IonButtons slot="end">
      <IonButton fill="clear" onClick={() => history.push('/Profile')}>
        <IonAvatar style={{ width: 32, height: 32, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
          {initials}
        </IonAvatar>
      </IonButton>
    </IonButtons>
  );
};

export default AvatarButton;
