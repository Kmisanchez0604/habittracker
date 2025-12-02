import {
  IonApp,
  IonHeader,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
  setupIonicReact
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import React, { useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { useEffect } from 'react';
import { useAppDispatch } from './store/hooks';
import { Redirect, Route, Switch } from 'react-router-dom';
import Register from './pages/Register';
import { LocalNotifications } from '@capacitor/local-notifications';
import { setUser } from './store/userSlice';
import notificationService from './services/notifications';
import NotificationListener from './components/NotificationListener';
import Habits from './pages/Habits';
import Progress from './pages/Progress';
import { ellipse, square, triangle } from 'ionicons/icons';
import { HabitsProvider } from './context/HabitsContext';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
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
  // SQLite initialization is now started automatically by the sqlite service
  // when the module is imported; App no longer needs to call `sqlite.init()` here.
  return (
    <IonApp>
      <HabitsProvider>
        <IonReactRouter>
          <Switch>
            {/* Private routes mounted under /app - check this first so it doesn't get shadowed by `/` */}
            <Route path="/app">
              <PrivateLayout />
            </Route>

            {/* Public routes mounted under / (login/register) */}
            <Route path="/">
              <PublicLayout />
            </Route>

          </Switch>
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
