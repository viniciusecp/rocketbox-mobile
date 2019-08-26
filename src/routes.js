import {createAppContainer, createSwitchNavigator} from 'react-navigation';

import Main from './pages/Main';
import Box from './pages/Box';

export default createAppContainer(
  createSwitchNavigator({
    Main,
    Box,
  }),
);
