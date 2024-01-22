import express from "express";

import { newEmbedding, testEmbedding, searchDocument } from "../controllers";
import { isAdmin, isAuthenticated } from "../middlewares";
import { getEmbeddingCollection } from "../ai/embeddings";

export default (router: express.Router) => {
  router.post("/createEmbedding", isAuthenticated, isAdmin, newEmbedding);
  router.post("/createHtmlEmbedding", isAuthenticated, isAdmin, newEmbedding);
  router.post("/testEmbedding", isAuthenticated, testEmbedding);
  router.get("/findDocument", isAuthenticated, searchDocument);
  router.get("/embeddingCollection",isAuthenticated,isAdmin, getEmbeddingCollection);
};
