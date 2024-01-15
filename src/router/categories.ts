import express from 'express';

import { deleteCategory } from '../controllers'; // TODO
// import { isAuthenticated  } from '../middlewares'; 

export default (router: express.Router) => {
    router.delete('/categories/:id', deleteCategory);

}