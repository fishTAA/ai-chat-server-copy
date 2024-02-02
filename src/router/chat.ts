import express from "express";

import { getChatMessages } from "../controllers";
import { isAuthenticated } from "../middlewares";

export default (router: express.Router) => {
  router.get("/getMessages", getChatMessages);
};
