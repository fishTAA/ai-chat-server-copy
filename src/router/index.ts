import express from 'express';

import test from './test';

const router = express.Router();

export default (): express.Router => {
    test(router);

    return router;
}