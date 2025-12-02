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
import sqlite from './services/sqlite';
import './theme/variables.css';
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
import AvatarButton from './components/AvatarButton';
import LogoutButton from './components/LogoutButton';

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

const PublicLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  // if there's a session user, load into store and redirect
  useEffect(() => {
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
  if (sid) return <Redirect to="/app/home" />;

  // render routes for welcome/login/register wrapped with a public header and bottom nav
  return (
    <>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/welcome">
            <Welcome />
          </Route>
          <Route exact path="/login">
            <Login />
          </Route>
          <Route exact path="/register">
            <Register />
          </Route>
          <Route exact path="/">
            <Redirect to="/welcome" />
          </Route>
        </IonRouterOutlet>
      </IonTabs>
    </>
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
    return <Redirect to="/login" />;
  }

  return (
    <>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>HabitTracker</IonTitle>
          <AvatarButton />
          <LogoutButton />
        </IonToolbar>
      </IonHeader>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/app/home">
            <Home />
          </Route>
          <Route exact path="/app/habits">
            <Habits />
          </Route>
          <Route path="/app/progress">
            <Progress />
          </Route>
          <Route exact path="/app/profile">
            <Profile />
          </Route>
          <Route exact path="/app">
            <Redirect to="/app/home" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="Home" href="/app/home">
            <IonIcon aria-hidden="true" icon={triangle} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="Habits" href="/app/habits">
            <IonIcon aria-hidden="true" icon={ellipse} />
            <IonLabel>Habits</IonLabel>
          </IonTabButton>
          <IonTabButton tab="Progress" href="/app/progress">
            <IonIcon aria-hidden="true" icon={square} />
            <IonLabel>Progress</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
      <NotificationListener />
    </>
  );
};

export default App;
