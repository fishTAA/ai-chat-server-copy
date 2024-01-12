import express from "express";
import { findCategories } from "../controllers";
import { isAuthenticated } from "../middlewares";

export default (router: express.Router) => {
  router.get("/getCategories", findCategories);
};
