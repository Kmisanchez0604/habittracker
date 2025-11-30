import { IonPage,IonHeader,IonToolbar,IonTitle,IonContent,IonInput,IonButton,IonItem,IonLabel,IonToast } from "@ionic/react";
import { warning } from "framer-motion";
import { User } from "lucide-react";
import { useState } from "react";
import { useHistory } from "react-router";


const Login: React.FC=() => {
    const [Email,setEmail]= useState('');
    const [Password,setPassword]= useState('');
    const [showToast,setShowToast]= useState(false);
    const history=useHistory();

    const handleRegister =()=> {
        if (!Email || !Password){
            setShowToast(true);
            return;
        }
    const user ={Email,Password};
    localStorage.setItem('user',JSON.stringify(user));
    history.push('/Home');
    };
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