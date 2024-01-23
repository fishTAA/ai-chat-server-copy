import express from "express";

import { newEmbedding, testEmbedding, searchDocument, deleteEmbedding } from "../controllers";
import { isAdmin, isAuthenticated } from "../middlewares";

export default (router: express.Router) => {
  router.post("/createEmbedding", isAuthenticated, isAdmin, newEmbedding);
  router.post("/createHtmlEmbedding", isAuthenticated, isAdmin, newEmbedding);
  router.delete("/deleteEmbedding/:id", deleteEmbedding);
  router.post("/testEmbedding", isAuthenticated, testEmbedding);
  router.get("/findDocument", isAuthenticated, searchDocument);
};
