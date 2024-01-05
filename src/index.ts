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
import { createEmbedding, findRelatedDocuments, getEmbeddingData, submitForm } from './ai/embeddings';
import { SettingsInterface } from './settings/models';
import { getSettings, saveSettings } from './settings/settings';
import path from 'path';
import { readFile } from 'fs';
import { readDocumentFile } from './file/fileHandler';
import { findAdminAccs } from './adminAuth/authenticate';

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

// WebSocket server's "connection" event handler
wss.on("connection", (ws, req) => {
  // Extract the token from the URL query parameters
  const token = url.parse(req.url, true).query.token || "";

  let session = "";

  // Verify the token and handle the connection
  jwt.verify(token.toString(), process.env.TOKEN_KEY || "xxx", (err: any, decoded: any) => {
    if (err) {
      console.log("closing")
      ws.send(connectionMessage("1","Title","Invalid Token", true))
      ws.close();
    } else {
      console.log("the client has connected");
      session = decoded.session_id;

      // Check if the session has not been initialized
      if (!wsClients[session]) {
        // sending message to client
        const welcomeMessage = chatMessage("1","","Welcome to our AI application! We are excited for you to explore its capabilities. To get started, we kindly ask you to input your message as a prompt. Our AI will then generate a response tailored to your input. Let's begin!", 'AI Chat', new Date());
        welcomeMessage.message.senderToken = token.toString();
        storeMessage(welcomeMessage);
        ws.send(JSON.stringify(welcomeMessage));
      }
       
      // Store the WebSocket connection in the clients list
      wsClients[session] = ws;
    }
  });

  //on message from client
  ws.on("message", data => {
    // Parse incoming chat message
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

// Express route for validating a user's session based on the provided token
app.get("/validateSession", (req: Request, res: Response) => {
  const token = req.header('authorization');

  // Verify the token's validity and respond accordingly
  jwt.verify(token, process.env.TOKEN_KEY || "xxx", (err: any, decoded: any) => {
    if (err) {
      // If token verification fails, respond with a status code 401 (Unauthorized)
      res.sendStatus(401);
    } else {
      // If the token is valid, respond with a success JSON message
      res.json({
        sucess: 'ok'
      })
    }
  });
})

// Express route for generating a new user session
app.get("/generateSession", (req: Request, res: Response) => {
  // Generate a new JWT token for the user session
  const token = generateToken();

  // Extract and store the session ID from the token
  const sessionId = token.sessionId;
  delete(token.sessionId);

  // Respond with the generated token (excluding the session ID)
  res.json(token)
})

// Express route for retrieving chat messages associated with a user's session
app.get("/getMessages", async (req: Request, res: Response) => {
  // Extract the token from the 'authorization' header
  const token = req.header('authorization');

  // Decode the token to retrieve session information
  const decodedToken = decodeToken(token);

  // Retrieve chat messages associated with the user's session
  const messages = await getMessages(decodedToken.session_id);

  // Respond with the retrieved chat messages in JSON format
  res.json(messages)
})

// Express route for finding and retrieving a document based on its unique identifier
app.get("/findDocument", async (req: Request, res: Response) =>{
  const id = req.query.id;
  const document = await findDocument(id as string);

  // Ensure that the embedding data is null to exclude it from the respons
  if(document) {
    document.embedding = null
  }
  console.log(id);
  res.json(document);
}
  
)

// Express route for creating an embedding for a document
app.post("/createEmbedding",  async (req: Request, res: Response) => {
  const documentTitle = req.body.title
  const documentKeyword = req.body.keyword
  const document = req.body.input

  // Create an embedding for the document and store it in the database
  const ret = await createEmbedding(document, documentTitle, documentKeyword)
  res.json({
    id: ret.objectId.toString(),
    success: true
  })
})

// Express route for testing embedding and finding related documents
app.post("/testEmbedding",  async (req: Request, res: Response) => {
  const documentKeyword = req.body.keyword

  // Get embedding data for the document keyword
  const embeddingData = await getEmbeddingData(documentKeyword);
  
  // Find related documents based on the embedding data
  const result = await findRelatedDocuments(embeddingData[0].embedding)
  res.json({
    related: result,
  })
})


// Express route for saving application settings
app.post("/saveSettings",  async (req: Request, res: Response) => {
  // Extract settings data from the request body
  const settings: SettingsInterface = req.body.settingsData;
  
  // Save the provided settings to the database
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

app.post("/submitForm",  async (req: Request, res: Response) => {
  const documentName = req.body.name
  const documentEmail = req.body.email
  const documentTicketClassification = req.body.ticketClassification
  const documentSpecificTopic = req.body.specificTopic
  const documentMessage = req.body.message
  const documentQuestionValue = req.body.questionValue
  
  // Submit the form data and store it in the database
  const ret = await submitForm(documentName, documentEmail, documentTicketClassification, documentSpecificTopic, documentMessage, documentQuestionValue)
  res.json({
    id: ret.id.toString(),
    success: true
  })
})

app.get('/findAdmin', async (req, res) => {
  const email = req.query.email as string;

  const document = await findAdminAccs(email); 
  res.json(document);
});

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