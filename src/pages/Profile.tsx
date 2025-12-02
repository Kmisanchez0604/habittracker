import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonAvatar, IonList, IonSelect, IonSelectOption, IonToast, IonIcon, IonButtons } from '@ionic/react';
import { mailOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser } from '../store/userSlice';
import { useGetUserQuery, useUpdateUserMutation } from '../store/habitsApi';
import { skipToken } from '@reduxjs/toolkit/query/react';

const Profile: React.FC = () => {
  const user = useAppSelector(s => s.user);
  const dispatch = useAppDispatch();
  const history = useHistory();

  const [fullname, setFullname] = useState(user?.fullname ?? '');
  // split birthDate into selects
  const [birthYear, setBirthYear] = useState<string | null>(null);
  const [birthMonth, setBirthMonth] = useState<string | null>(null);
  const [birthDay, setBirthDay] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(user?.weight ? String(user.weight) : null);
  const [toast, setToast] = useState<{ show: boolean; message?: string }>({ show: false });

  // fetch fresh user data via RTK Query (falls back to redux user)
  const { data: freshUser } = useGetUserQuery(user?.id ?? skipToken);
  const [updateUser] = useUpdateUserMutation();

  useEffect(() => {
    const source = freshUser ?? user;
    setFullname(source?.fullname ?? '');
    if (source?.birthDate) {
      const parts = String(source.birthDate).split('-');
      if (parts.length >= 3) {
        setBirthYear(parts[0]);
        setBirthMonth(parts[1]);
        setBirthDay(parts[2]);
      } else {
        setBirthYear(null);
        setBirthMonth(null);
        setBirthDay(null);
      }
    } else {
      setBirthYear(null);
      setBirthMonth(null);
      setBirthDay(null);
    }
    setWeight(source?.weight ? String(source.weight) : null);
  }, [freshUser, user]);

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
      // compose birthDate from selects
      const birthDateVal = birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}` : null;
      // compute age from birthDate
      let ageVal: number | null = null;
      if (birthDateVal) {
        const b = new Date(birthDateVal);
        const now = new Date();
        let age = now.getFullYear() - b.getFullYear();
        const m = now.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
        ageVal = age;
      }

      const res = await updateUser({ id: Number(user.id), fullname, birthDate: birthDateVal ?? null, weight: weight ? Number(weight) : null, age: ageVal }).unwrap();
      if (res) {
        dispatch(setUser({ id: Number(res.id), email: res.email, fullname: res.fullname ?? null, birthDate: res.birthDate ?? null, weight: res.weight ?? null }));
        setToast({ show: true, message: 'Perfil actualizado' });
      } else {
        setToast({ show: true, message: 'Error guardando' });
      }
    } catch (err) {
      console.error('profile save error', err);
      setToast({ show: true, message: 'Error guardando' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>Atrás</IonButton>
          </IonButtons>
          <IonTitle>Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 8 }}>
          <IonAvatar style={{ width: 112, height: 112, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>{user?.fullname ? user.fullname.split(' ').map((p: string) => p[0]).slice(0,2).join('') : (user?.email ? user.email[0].toUpperCase() : 'U')}</div>
          </IonAvatar>
          <h2 style={{ margin: 0 }}>{user?.fullname ?? ''}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#777', fontSize: 13 }}>
            <IonIcon icon={mailOutline} style={{ fontSize: 16, color: '#777' }} />
            <div style={{ color: '#777', fontSize: 13 }}>{user?.email}</div>
          </div>
        </div>

        <IonList style={{ marginTop: 16 }}>
          <IonItem>
            <IonLabel position="stacked" style={{ color: '#222' }}>Nombre Completo*</IonLabel>
            <IonInput value={fullname} onIonChange={e => setFullname(e.detail.value ?? '')} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked" style={{ color: '#222' }}>Fecha de Nacimiento</IonLabel>
            <div style={{ display: 'flex', gap: 8, width: '100%', paddingTop: 8 }}>
              <IonSelect value={birthYear ?? undefined} placeholder="Año" onIonChange={e => setBirthYear(e.detail.value)}>
                {Array.from({length: (new Date().getFullYear() - 1900 + 1)}, (_, i) => (new Date().getFullYear() - i)).map(y => (
                  <IonSelectOption key={y} value={String(y)}>{String(y)}</IonSelectOption>
                ))}
              </IonSelect>

              <IonSelect value={birthMonth ?? undefined} placeholder="Mes" onIonChange={e => setBirthMonth(e.detail.value)}>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <IonSelectOption key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</IonSelectOption>
                ))}
              </IonSelect>

              <IonSelect value={birthDay ?? undefined} placeholder="Día" onIonChange={e => setBirthDay(e.detail.value)}>
                {(() => {
                  const month = birthMonth ? Number(birthMonth) : 1;
                  const year = birthYear ? Number(birthYear) : 2000;
                  const daysInMonth = new Date(year, month, 0).getDate();
                  return Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <IonSelectOption key={d} value={String(d).padStart(2, '0')}>{String(d).padStart(2, '0')}</IonSelectOption>
                  ));
                })()}
              </IonSelect>
            </div>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked" style={{ color: '#222' }}>Peso (kg)</IonLabel>
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
