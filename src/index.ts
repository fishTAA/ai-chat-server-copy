import express, { Express, Request, Response , Application } from 'express';
import multer from 'multer';
import WebSocketServer from 'ws';
import dotenv from 'dotenv';
import { decodeToken, generateToken } from './sessions/session';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import url from 'url';
import { storeMessage, chatMessage, connectionMessage, ChatCommunication, getMessages, sendMessage, createNotification, createRemoveNotification, findDocument } from './messaging/messaging';
import * as http from 'http';
import { predictCompletion } from './ai/service';
import { createEmbedding, findRelatedDocuments, getEmbeddingData } from './ai/embeddings';
import { SettingsInterface } from './settings/models';
import { getSettings, saveSettings } from './settings/settings';
import path from 'path';
import { readFile } from 'fs';
import { readDocumentFile } from './file/fileHandler';

//In case we wanted to store the uploaded file
const storage = multer.diskStorage({
  destination: './public/uploads/files',
  filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + 
  path.extname(file.originalname));
  }
});

dotenv.config();
const upload = multer({ dest: 'uploads/' })
const app: Application = express();
const port = process.env.PORT || "8000";

const server = http.createServer(app);
const wss = new WebSocketServer.Server({server})


let wsClients: WebSocketServer[] = [];

app.use(cors())
app.use(express.urlencoded());
app.use(express.json());

wss.on("connection", (ws, req) => {
  const token = url.parse(req.url, true).query.token || "";

  let session = "";

  jwt.verify(token.toString(), process.env.TOKEN_KEY || "xxx", (err: any, decoded: any) => {
    if (err) {
      console.log("closing")
      ws.send(connectionMessage("1","Title","Invalid Token", true))
      ws.close();
    } else {
      console.log("the client has connected");
      session = decoded.session_id;
      if (!wsClients[session]) {
        // sending message to client
        const welcomeMessage = chatMessage("1","","Welcome to our AI application! We are excited for you to explore its capabilities. To get started, we kindly ask you to input your message as a prompt. Our AI will then generate a response tailored to your input. Let's begin!", 'AI Chat', new Date());
        welcomeMessage.message.senderToken = token.toString();
        storeMessage(welcomeMessage);
        ws.send(JSON.stringify(welcomeMessage));
      }
      wsClients[session] = ws;
    }
  });

  //on message from client
  ws.on("message", data => {
    const message: ChatCommunication = JSON.parse(data.toString())
    message.message.dateSent = new Date();
    wsClients[session].send(JSON.stringify(message));
    console.log(`Client has sent us:`, message)
    let notification = createNotification("1","AI Loading","AI Chat is processing...");
    wsClients[session].send(JSON.stringify(notification));
    storeMessage(message).then((res)=> {
      predictCompletion(message.message.messageBody).then((res)=> {

        // getting the most relevant solution
        if (res.length > 0) {
          const firstElement = res[0];
        
          const response = chatMessage(firstElement.message.id,firstElement.message?.title,firstElement.message?.content, 'AI Chat', new Date());
          response.message.senderToken = token.toString();
          storeMessage(response);
          wsClients[session].send(JSON.stringify(response));
          wsClients[session].send(JSON.stringify(createRemoveNotification()));
        } else {
          console.log("The 'res' array is empty.");
        }

        // res.map(r => {
        //   const response = chatMessage(r.message?.content, 'AI Chat', new Date());
        //   response.message.senderToken = token.toString();
        //   storeMessage(response);
        //   wsClients[session].send(JSON.stringify(response));
        //   wsClients[session].send(JSON.stringify(createRemoveNotification()));
        // })
      });
    });
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

app.get("/findDocument", async (req: Request, res: Response) =>{
  const id = req.query.id;
  const document = await findDocument(id as string);
  if(document) {
    document.embedding = null
  }
  console.log(id);
  res.json(document);
}
  
)

app.post("/createEmbedding",  async (req: Request, res: Response) => {
  const documentTitle = req.body.title
  const documentKeyword = req.body.keyword
  const document = req.body.input
  const ret = await createEmbedding(document, documentTitle, documentKeyword)
  res.json({
    id: ret.objectId.toString(),
    success: true
  })
})

app.post("/testEmbedding",  async (req: Request, res: Response) => {
  const documentKeyword = req.body.keyword
  const embeddingData = await getEmbeddingData(documentKeyword);
  const result = await findRelatedDocuments(embeddingData[0].embedding)
  res.json({
    related: result,
  })
})



app.post("/saveSettings",  async (req: Request, res: Response) => {
  const settings: SettingsInterface = req.body.settingsData;
  const result = saveSettings(settings);
  console.log("res",settings)
  res.json({
    related: result,
  })
})

app.get("/getSettings", async (req: Request, res: Response) => {
  //const settings = await getSettings();
  //res.json(settings)
  return {};
})



/**
 * Use rest api over sockets for this
 */
app.post("/uploadFile", upload.single("file"), async (req: Request, res: Response) => {
  const file = req.file;
  const token = req.header('authorization');
  const decodedToken = decodeToken(token);
  const fileMessage = chatMessage("","","", '_self', new Date());
  fileMessage.format = "file";
  fileMessage.fileName = file.originalname;
  fileMessage.message.senderToken = token.toString();
  /**
   * right now, process pdfs
   * if format is not pdf, treat it as txt and read it forcefully
   */
  const content = await readDocumentFile(file);
  fileMessage.message.messageBody = content;
  let notification = createNotification("","AI Loading","AI Chat is processing...");
  wsClients[decodedToken.session_id].send(JSON.stringify(notification));
  predictCompletion(content).then((res)=> {
    /* const response = chatMessage(res.message?.content, 'AI Chat', new Date());
    response.message.senderToken = token.toString();
    storeMessage(response);
    wsClients[decodedToken.session_id].send(JSON.stringify(response));
    wsClients[decodedToken.session_id].send(createRemoveNotification()); */
  });
  storeMessage(fileMessage);
  res.json(fileMessage)
})


server.listen(port, () => {
  console.log(`Server Launched at http://localhost:${port}`);
  console.log(`Web Socket Server Launched at ws://localhost:${port}`);
});