import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import React, { useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import Login from './pages/Login';
import Habits from './pages/Habits';
import Home from './pages/Home';
import Progress from './pages/Progress';
import Register from './pages/Register';
import Welcome from './pages/Welcome';

import { HabitsProvider } from './context/HabitsContext';  // ✔ CORRECTO

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import { SplashScreen } from '@capacitor/splash-screen';
import sqlite from './services/sqlite';
import notificationService from './services/notifications';
import NotificationListener from './components/NotificationListener';
import { LocalNotifications } from '@capacitor/local-notifications';
import './theme/variables.css';



setupIonicReact();

const App: React.FC = () => {
  return (
   <IonApp>
      <HabitsProvider>
        <IonReactRouter>
          <IonRouterOutlet>

            {/* Pantalla inicial */}
            <Route exact path="/welcome">
              <Welcome />
            </Route>

            {/* Login */}
            <Route exact path="/login">
              <Login />
            </Route>

            {/* Registro */}
            <Route exact path="/register">
              <Register />
            </Route>

            {/* Home */}
            <Route exact path="/home">
              <Home />
            </Route>

            {/* Habits */}
            <Route exact path="/habits">
              <Habits />
            </Route>

            {/* Progress */}
            <Route exact path="/progress">
              <Progress />
            </Route>

            {/* Redirección por defecto */}
            <Route exact path="/">
              <Redirect to="/welcome" />
            </Route>

          </IonRouterOutlet>
        </IonReactRouter>
      </HabitsProvider>
    </IonApp>
  );
};

const PrivateLayout: React.FC = () => {
  const userId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userId') : null;
  useEffect(() => {
    (async () => {
      try {
        if (sessionStorage.getItem('userId')) {
          // request notification permissions when entering private area
          try {
            await LocalNotifications.requestPermissions();
          } catch (e) {
            // ignore
          }

          // start notification polling service
          try {
            notificationService.start({ intervalMs: 60_000, lookaheadMin: 10 });
          } catch (e) {
            console.warn('failed to start notificationService', e);
          }
        }
      } catch (err) {
        console.warn('PrivateLayout init failed', err);
      }
    })();

    return () => {
      try { notificationService.stop(); } catch (e) {}
    };
  }, []);

  if (!userId) {
    return <Redirect to="/Login" />;
  }

  return (
    <>
      <NotificationListener />
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/Home">
            <Home />
          </Route>
          <Route exact path="/Habits">
            <Habits />
          </Route>
          <Route path="/Progress">
            <Progress />
          </Route>
          <Route exact path="/">
            <Redirect to="/Home" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="Home" href="/Home">
            <IonIcon aria-hidden="true" icon={triangle} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="Habits" href="/Habits">
            <IonIcon aria-hidden="true" icon={ellipse} />
            <IonLabel>Habits</IonLabel>
          </IonTabButton>
          <IonTabButton tab="Progress" href="/Progress">
            <IonIcon aria-hidden="true" icon={square} />
            <IonLabel>Progress</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </>
  );
};

export default App;
