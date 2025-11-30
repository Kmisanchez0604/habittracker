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
import { Redirect, Route } from 'react-router-dom';
import Habits from './pages/Habits';
import Home from './pages/Home';
import Progress from './pages/Progress';

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
import './theme/variables.css';
import { HabitsProvider } from './context/HabitsContext';
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
      </IonReactRouter>
      </HabitsProvider>
    </IonApp>
  );
};

export default App;