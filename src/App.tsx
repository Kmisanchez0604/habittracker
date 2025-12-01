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
import { Redirect, Route } from 'react-router-dom';

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
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/palettes/dark.system.css';

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

export default App;
