import express, { Express, Request, Response , Application } from 'express';
import WebSocketServer from 'ws';
import dotenv from 'dotenv';
import { decodeToken, generateToken } from './sessions/session';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import url from 'url';
import { storeMessage, chatMessage, connectionMessage, ChatCommunication, getMessages, sendMessage } from './messaging/messaging';
import * as http from 'http';
import { Interface } from 'readline';

dotenv.config();

const app: Application = express();
const port = process.env.PORT || "8000";

const server = http.createServer(app);
const wss = new WebSocketServer.Server({server})


let wsClients: WebSocketServer[] = [];

app.use(cors())

app.get('/', (req: Request, res: Response) => {
  res.send('This is the webserver');
});

app.get("/validateSession", (req: Request, res: Response) => {
  const token = req.header('authorization');
  jwt.verify(token, process.env.TOKEN_KEY || "xxx", (err: any, decoded: any) => {
    if (err) {
      res.sendStatus(401);
    } else {
      res.json({
        sucess: 'ok'
      })
    }
  });
})

app.get("/generateSession", (req: Request, res: Response) => {
  const token = generateToken();
  const sessionId = token.sessionId;
  delete(token.sessionId);
  res.json(token)
})

app.get("/getMessages", async (req: Request, res: Response) => {
  const token = req.header('authorization');
  const decodedToken = decodeToken(token);
  const messages = await getMessages(decodedToken.session_id);
  res.json(messages)
})

wss.on("connection", (ws, req) => {
  const token = url.parse(req.url, true).query.token || "";

  let session = "";

  jwt.verify(token.toString(), process.env.TOKEN_KEY || "xxx", (err: any, decoded: any) => {
    if (err) {
      console.log("closing")
      ws.send(connectionMessage("Invalid Token", true))
      ws.close();
    } else {
      console.log("the client has connected");
      session = decoded.session_id;
      if (!wsClients[session]) {
        // sending message to client
        const welcomeMessage = chatMessage("Welcome", 'AI Chat', new Date());
        welcomeMessage.message.senderToken = token.toString();
        storeMessage(welcomeMessage);
        ws.send(JSON.stringify(welcomeMessage));
      }
      wsClients[session] = ws;
    }
  });

  //on message from client
  ws.on("message", data => {
    console.log("session", session)
    const message: ChatCommunication = JSON.parse(data.toString())
    storeMessage(message).then((res)=> {
      message.message.dateSent = res.dateSent;
      wsClients[session].send(JSON.stringify(message));
    });
    console.log(`Client has sent us: ${message}`)
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
server.listen(port, () => {
  console.log(`Server Launched at http://localhost:${port}`);
  console.log(`Web Socket Server Launched at ws://localhost:${port}`);
});