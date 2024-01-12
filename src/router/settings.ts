import express from 'express';

import { saveAppSettings, getAppSettings } from '../controllers';
import { isAuthenticated  } from '../middlewares';

export default (router: express.Router) => {
    router.post('/saveSettings',isAuthenticated, saveAppSettings);
    router.get('/getSettings',isAuthenticated, getAppSettings);

}