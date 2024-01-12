import express from 'express';

import { submitDocument } from '../controllers';
import { isAuthenticated  } from '../middlewares';

export default (router: express.Router) => {
    router.post('/submitForm',isAuthenticated, submitDocument);

}