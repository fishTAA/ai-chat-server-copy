import express from 'express';

import { checkWebServer, validateSession, generateSession, getChatMessages, 
    searchDocument, newEmbedding, testEmbedding, saveAppSettings,
    getAppSettings, submitDocument, findAdmin,
    uploadFile
} from '../controllers/test';

import { isAuthenticated  } from '../middlewares';
export default (router: express.Router) => {
    router.get('/',isAuthenticated, checkWebServer);
    router.get('/validateSession',isAuthenticated, validateSession);
    router.get('/generateSession',isAuthenticated, generateSession);
    router.get('/getMessages',isAuthenticated, getChatMessages);
    router.get('/findDocument',isAuthenticated, searchDocument);

    router.post('/createEmbedding',isAuthenticated, newEmbedding);
    router.post('/testEmbedding',isAuthenticated, testEmbedding);
    router.post('/saveSettings',isAuthenticated, saveAppSettings);
    router.get('/getSettings',isAuthenticated, getAppSettings);
    router.post('/submitForm',isAuthenticated, submitDocument);
    router.get('/findAdmin',isAuthenticated, findAdmin);
    router.post('/uploadFile',isAuthenticated, uploadFile);

}