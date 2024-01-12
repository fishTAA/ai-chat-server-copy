import express from 'express';

import { newEmbedding, testEmbedding, searchDocument } from '../controllers';
import { isAuthenticated  } from '../middlewares';

export default (router: express.Router) => {
    router.post('/createEmbedding',isAuthenticated, newEmbedding);
    router.post('/testEmbedding',isAuthenticated, testEmbedding);
    router.get('/findDocument',isAuthenticated, searchDocument);

}