import url from "url";
import WebSocketServer from "ws";
import { predictCompletion } from "./ai/service";
import { connectionMessage, chatMessage, storeMessage, ChatCommunication, createNotification, createRemoveNotification } from "./messaging/messaging";
import * as http from "http";
import jwt from "jsonwebtoken";
import express, { Application } from "express";

const app: Application = express();
const server = http.createServer(app);

export default function initializeWebSocketServer(server: any) {
    const wss = new WebSocketServer.Server({ server });
    let wsClients: WebSocket[] = [];

    // WebSocket server's "connection" event handler
    wss.on("connection", (ws, req) => {
        // Extract the token from the URL query parameters
        const token = url.parse(req.url!, true).query.token || "";

        let session = "";

        // Verify the token and handle the connection
        jwt.verify(
            token.toString(),
            process.env.TOKEN_KEY || "xxx",
            (err: any, decoded: any) => {
                if (err) {
                    console.log("closing");
                    ws.send(connectionMessage("1", "Title", "Invalid Token", true));
                    ws.close();
                } else {
                    console.log("the client has connected");
                    session = decoded.session_id;

                    // Check if the session has not been initialized
                    if (!wsClients[session]) {
                        // sending message to client
                        const welcomeMessage = chatMessage(
                            "1",
                            "",
                            "Welcome to our AI application! We are excited for you to explore its capabilities. To get started, we kindly ask you to input your message as a prompt. Our AI will then generate a response tailored to your input. Let's begin!",
                            "AI Chat",
                            new Date()
                        );
                        welcomeMessage.message.senderToken = token.toString();
                        storeMessage(welcomeMessage);
                        ws.send(JSON.stringify(welcomeMessage));
                    }

                    // Store the WebSocket connection in the clients list
                    wsClients[session] = ws;
                }
            }
        );

        //on message from client
        ws.on("message", (data) => {
            // Parse incoming chat message
            const message: ChatCommunication = JSON.parse(data.toString());
            message.message.dateSent = new Date();
            wsClients[session].send(JSON.stringify(message));
            console.log(`Client has sent us:`, message);
            let notification = createNotification(
                "1",
                "AI Loading",
                "AI Chat is processing..."
            );
            wsClients[session].send(JSON.stringify(notification));
            storeMessage(message).then((res) => {
                predictCompletion(message.message.messageBody).then((res) => {
                    // getting the most relevant solution
                    if (res.length > 0) {
                        const firstElement = res[0];

                        const response = chatMessage(
                            firstElement.message.id,
                            firstElement.message?.title,
                            firstElement.message?.content,
                            "AI Chat",
                            new Date()
                        );
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
            console.log("Some Error occurred");
        };
    });
};