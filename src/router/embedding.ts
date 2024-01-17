import express from "express";

import { newEmbedding, testEmbedding, searchDocument } from "../controllers";
import { isAdmin, isAuthenticated } from "../middlewares";

export default (router: express.Router) => {
  router.post("/createEmbedding", isAuthenticated, isAdmin, newEmbedding);
  router.post("/testEmbedding", isAuthenticated, testEmbedding);
  router.get("/findDocument", isAuthenticated, searchDocument);
};
