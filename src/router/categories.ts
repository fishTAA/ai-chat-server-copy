import express from "express";
import { createNewCategories, findCategories } from "../controllers";
import { isAuthenticated } from "../middlewares";

export default (router: express.Router) => {
  router.post('/createCategories', createNewCategories)
  router.get('/getCategories', findCategories);
};
