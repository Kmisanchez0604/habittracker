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
import Habits from './pages/Habits';
import Home from './pages/Home';
import Progress from './pages/Progress';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import { useAppDispatch } from './store/hooks';
import { setUser } from './store/userSlice';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import { SplashScreen } from '@capacitor/splash-screen';
import sqlite from './services/sqlite';
import notificationService from './services/notifications';
import NotificationListener from './components/NotificationListener';
import { LocalNotifications } from '@capacitor/local-notifications';
import './theme/variables.css';
import { HabitsProvider } from './context/HabitsContext';

setupIonicReact();

const App: React.FC = () => {

  useEffect(() => {
    (async () => {
      try {
        await sqlite.init();
        try {
          await SplashScreen.hide();
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.warn('SQLite init failed', err);
        // Per requirement: do not hide the splash until initialization finishes correctly.
        // This intentionally leaves the native splash visible on native platforms.
      }
    })();
  }, []);

  return (
    <IonApp>
      <HabitsProvider>
        <IonReactRouter>
          <Switch>
            <Route path="/register">
              <PublicLayout />
            </Route>
            <Route path="/login">
              <PublicLayout />
            </Route>

            {/* Private layout (tabs + private routes). The layout requests notification permissions
                and starts the notification service when mounted. */}
            <Route path="/">
              <PrivateLayout />
            </Route>
          </Switch>
        </IonReactRouter>
      </HabitsProvider>
    </IonApp>
  );
};

const PublicLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  // if there's a session user, load into store and redirect
  React.useEffect(() => {
    (async () => {
      try {
        const sid = sessionStorage.getItem('userId');
        if (sid) {
          const id = Number(sid);
          try {
            const rows: any[] = await sqlite.querySql('SELECT * FROM Users WHERE id = ? LIMIT 1', [id]);
            if (rows && rows[0]) {
              const u = rows[0];
              dispatch(setUser({ id: Number(u.id), email: u.email, fullname: u.fullname ?? null, birthDate: u.birthDate ?? null, weight: u.weight ?? null }));
            }
          } catch (e) {
            console.warn('failed to load user in public layout', e);
          }
        }
      } catch (err) {
        console.warn(err);
      }
    })();
  }, [dispatch]);
  const sid = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userId') : null;
  if (sid) return <Redirect to="/" />;

  // render routes for login/register
  return (
    <Switch>
      <Route exact path="/login">
        <Login />
      </Route>
      <Route exact path="/register">
        <Register />
      </Route>
      <Route path="/">
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
};

const PrivateLayout: React.FC = () => {
  const userId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userId') : null;
  const dispatch = useAppDispatch();
  useEffect(() => {
    (async () => {
      try {
        // ensure redux has current user
        try {
          if (userId) {
            const rows: any[] = await sqlite.querySql('SELECT * FROM Users WHERE id = ? LIMIT 1', [Number(userId)]);
            if (rows && rows[0]) {
              const u = rows[0];
              dispatch(setUser({ id: Number(u.id), email: u.email, fullname: u.fullname ?? null, birthDate: u.birthDate ?? null, weight: u.weight ?? null }));
            }
          }
        } catch (e) {}
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
          <Route exact path="/Profile">
            <Profile />
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