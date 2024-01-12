import express from 'express';

import { validateSession, generateSession } from '../controllers';
// import { isAuthenticated  } from '../middlewares';

export default (router: express.Router) => {
    router.get('/validateSession', validateSession);
    router.get('/generateSession', generateSession);

}