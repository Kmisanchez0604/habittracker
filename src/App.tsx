import { Redirect, Route } from 'react-router-dom';
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

import Login from './pages/Login';
import Home from './pages/Home';
import Habits from './pages/Habits';
import Progress from './pages/Progress';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      {/* 🔹 Rutas principales */}
      <IonRouterOutlet id="main">
        {/* Rutas sin tabs */}
        <Route exact path="/login" component={Login} />

        {/* Rutas con tabs */}
        <Route path="/tabs">
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/tabs/home" component={Home} />
              <Route exact path="/tabs/habits" component={Habits} />
              <Route exact path="/tabs/progress" component={Progress} />
              <Route exact path="/tabs">
                <Redirect to="/tabs/home" />
              </Route>
            </IonRouterOutlet>

            <IonTabBar slot="bottom">
              <IonTabButton tab="home" href="/tabs/home">
                <IonIcon icon={triangle} />
                <IonLabel>Home</IonLabel>
              </IonTabButton>

              <IonTabButton tab="habits" href="/tabs/habits">
                <IonIcon icon={ellipse} />
                <IonLabel>Habits</IonLabel>
              </IonTabButton>

              <IonTabButton tab="progress" href="/tabs/progress">
                <IonIcon icon={square} />
                <IonLabel>Progress</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </Route>

        {/* Redirección inicial */}
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
