import express from "express";
import { createNewCategories, findCategories, retrieveEmbeddingbyCategory } from "../controllers";
import { isAuthenticated } from "../middlewares";
import { deleteCategory } from '../controllers';

export default (router: express.Router) => {
  router.post('/createCategories', createNewCategories)
  router.get('/getCategories', findCategories);
  router.delete('/deleteCategories/:id', deleteCategory);
  router.post('/fillterembeddings',retrieveEmbeddingbyCategory)
};
