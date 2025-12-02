import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonPage, IonTitle, IonToast, IonToolbar } from "@ionic/react";
import { useState, useEffect } from "react";
import { useHistory } from "react-router";
import sqlite from '../services/sqlite';
import { useAppDispatch } from '../store/hooks';
import { setUser } from '../store/userSlice';


const Login: React.FC=() => {
    const [Email,setEmail]= useState('');
    const [Password,setPassword]= useState('');
    const [showToast,setShowToast]= useState(false);
    const history=useHistory();

    const dispatch = useAppDispatch();

    const handleRegister = async () => {
        if (!Email || !Password){
            setShowToast(true);
            return;
        }

        try {
            // find user by email
            const existing = await sqlite.querySql('SELECT * FROM Users WHERE email = ?', [Email]);
            if (!existing || existing.length === 0) {
                setShowToast(true);
                return;
            }

            const user = existing[0];
            if (user.password !== Password) {
                setShowToast(true);
                return;
            }

            sessionStorage.setItem('userId', String(user.id));
            // load user into store
            dispatch(setUser({ id: Number(user.id), email: user.email, fullname: user.fullname ?? null, birthDate: user.birthDate ?? null, weight: user.weight ?? null }));
            history.replace('/Home');
        } catch (err) {
            console.error('Failed to login user', err);
            setShowToast(true);
        }
    };
    useEffect(() => {
        // if already logged-in via session, redirect to Home
        (async () => {
                const userId = sessionStorage.getItem('userId');
                if (userId) {
                    try {
                        const rows = await sqlite.querySql('SELECT * FROM Users WHERE id = ? LIMIT 1', [Number(userId)]);
                        if (rows && rows[0]) {
                            // populate global user state
                            dispatch(setUser({ id: Number(rows[0].id), email: rows[0].email, fullname: rows[0].fullname ?? null, birthDate: rows[0].birthDate ?? null, weight: rows[0].weight ?? null }));
                        }
                    } catch (e) {
                        // ignore
                    }
                    history.replace('/Home');
                }
        })();
    }, []);

    return(
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Registro</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent class="ion-padding">
                <IonItem>
                    <IonLabel position="floating" >Correo</IonLabel>
                    <IonInput type="email" value={Email} onIonChange={e=>setEmail(e.detail.value!)}/>
                </IonItem>
                <IonItem>
                    <IonLabel position="floating" >Password</IonLabel>
                    <IonInput type="password" value={Password} onIonChange={e=>setPassword(e.detail.value!)}/>
                </IonItem>
                <IonButton expand="block" onClick={handleRegister}>Login</IonButton>
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={()=> setShowToast(false)}
                    message="Favor Completa Todos Los Campos"
                    duration={2000}
                    color="warning"
                />   
            </IonContent>
        </IonPage>

    );
};
export default Login;