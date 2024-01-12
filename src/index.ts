import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import * as http from "http";
import router from "./router";
import { getConnection } from "./db/connection";
import WebSocketServer from "./websocket";

dotenv.config();
const app: Application = express();
const port = process.env.PORT || "8000";
const server = http.createServer(app);

app.use(cors());
// app.use(express.urlencoded());
app.use(express.json());
app.use("/", router());

getConnection().then(()=> {
  server.listen(port, () => {
    console.log(`Server Launched at http://localhost:${port}`);
    console.log(`Web Socket Server Launched at ws://localhost:${port}`);
  });

  WebSocketServer(server);
})

