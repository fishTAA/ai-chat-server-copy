import express from 'express';

import { findAdmin } from '../controllers';
import { isAuthenticated, validateUser  } from '../middlewares';

export default (router: express.Router) => {
    router.get('/findAdmin', findAdmin);
    router.post('/validateUser', validateUser);
}