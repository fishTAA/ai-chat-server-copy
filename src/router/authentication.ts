import express from 'express';

import { findAdmin } from '../controllers';
import { isAuthenticated  } from '../middlewares';

export default (router: express.Router) => {
    router.get('/findAdmin', findAdmin);
}