import express from "express";

import chat from "./chat";
import embedding from "./embedding";
import { isAuthenticated } from "../middlewares";
import { checkWebServer } from "../controllers";
import authentication from "./authentication";
import fileUpload from "./fileupload";
import session from "./session";
import settings from "./settings";
import ticketing from "./ticketing";
import categories from "./categories";

const router = express.Router();

export default (): express.Router => {
  router.get("/", checkWebServer);

  authentication(router);
  chat(router);
  embedding(router);
  fileUpload(router);
  session(router);
  settings(router);
  ticketing(router);
  categories(router);

  return router;
};
