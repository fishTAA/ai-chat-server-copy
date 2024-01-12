import express from 'express';

import { uploadFile } from '../controllers';
import { isAuthenticated  } from '../middlewares';

export default (router: express.Router) => {
    router.post('/uploadFile',isAuthenticated, uploadFile);

}