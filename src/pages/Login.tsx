import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonPage, IonTitle, IonToast, IonToolbar } from "@ionic/react";
import { useState, useEffect } from "react";
import { useHistory } from "react-router";
import sqlite from '../services/sqlite';


const Login: React.FC=() => {
    const [Email,setEmail]= useState('');
    const [Password,setPassword]= useState('');
    const [showToast,setShowToast]= useState(false);
    const history=useHistory();

    const handleRegister = async () => {
        if (!Email || !Password){
            setShowToast(true);
            return;
        }

        try {
            // find user by email
            const existing = await sqlite.querySql('SELECT * FROM Users WHERE email = ?', [Email]);
            if (existing && existing.length > 0) {
                const user = existing[0];
                // store session and navigate
                sessionStorage.setItem('userId', String(user.id));
                history.replace('/Home');
                return;
            }

            // create new user and store session
            await sqlite.executeSql('INSERT INTO Users (email, password) VALUES (?,?)', [Email, Password]);
            const created = await sqlite.querySql('SELECT id FROM Users WHERE email = ? LIMIT 1', [Email]);
            const userId = created && created[0] ? created[0].id : null;
            if (userId) {
                sessionStorage.setItem('userId', String(userId));
            }
            history.replace('/Home');
        } catch (err) {
            console.error('Failed to save user', err);
            setShowToast(true);
        }
    };
    useEffect(() => {
        // if already logged-in via session, redirect to Home
        (async () => {
            const userId = sessionStorage.getItem('userId');
            if (userId) {
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