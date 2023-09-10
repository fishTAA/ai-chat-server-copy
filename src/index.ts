import express, { Express, Request, Response , Application } from 'express';
import WebSocketServer from 'ws';
import dotenv from 'dotenv';
import { generateToken } from './sessions/session';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import url from 'url';
import { chatMessage, connectionMessage } from './messaging/messaging';

dotenv.config();

const app: Application = express();
const port = process.env.PORT || "8000";

const wss = new WebSocketServer.Server({
  port: Number.parseInt(port),
  path: "/ws"
})

app.use(cors())

app.get('/', (req: Request, res: Response) => {
  res.send('This is the webserver');
});

app.get("/generateSession", (req: Request, res: Response) => {
  res.json(generateToken())
})

app.listen(port, () => {
  console.log(`Server Launched at http://localhost:${port}`);
});

let wsClients: never[] = [];

wss.on("connection", (ws, req) => {
  const token = url.parse(req.url, true).query.token;

  let session = "";

  jwt.verify(token.toString(), process.env.TOKEN_KEY || "xxx", (err: any, decoded: any) => {
      if (err) {
        console.log("closing")
        ws.send(connectionMessage("Invalid Token", true))
        ws.close();
      } else {
        console.log("the client has connected");
        wsClients[token.toString()] = ws;
        session = decoded.session_id;
      }
  });

  // sending message to client
  ws.send(chatMessage("Welcome", 'AI Chat', new Date().toTimeString()));

  //on message from client
  ws.on("message", data => {
      console.log(`Client has sent us: ${data}`)
  });

  // handling what to do when clients disconnects from server
  ws.on("close", () => {
    console.log("the client has disconnected");
  });
  // handling client connection error
  ws.onerror = function () {
      console.log("Some Error occurred")
  }
});
console.log("The WebSocket server is running on port 8080");