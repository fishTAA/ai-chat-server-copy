import express, { Express, Request, Response, Application } from "express";
import multer from "multer";
import WebSocketServer from "ws";
import { decodeToken, generateToken } from "../sessions/session";
import cors from "cors";
import jwt, { JwtPayload } from "jsonwebtoken";
import url from "url";
import {
    storeMessage,
    chatMessage,
    connectionMessage,
    ChatCommunication,
    getMessages,
    sendMessage,
    createNotification,
    createRemoveNotification,
    findDocument,
} from "../messaging/messaging";
import * as http from "http";
import { predictCompletion } from "../ai/service";
import {
    createEmbedding,
    findRelatedDocuments,
    getEmbeddingData,
    submitForm,
} from "../ai/embeddings";
import { SettingsInterface } from "../settings/models";
import { getSettings, saveSettings } from "../settings/settings";
import path from "path";
import { readFile } from "fs";
import { readDocumentFile } from "../file/fileHandler";
import { findAdminAccs } from "../adminAuth/authenticate";
import { ValidateToken } from "../adminAuth/validatetoken";
import { validate } from "uuid";
import { findCategory } from "../categories";
import { getConnection } from "../db/connection";
import { ObjectId } from "mongodb";



export const checkWebServer = async (req: express.Request, res: express.Response) => {
    res.send("This is the webserver");
};

// Express route for validating a user's session based on the provided token
export const validateSession = async (req: express.Request, res: express.Response) => {
    const token = req.header("authorization");

    // Verify the token's validity and respond accordingly
    jwt.verify(
        token,
        process.env.TOKEN_KEY || "xxx",
        (err: any, decoded: any) => {
            if (err) {
                // If token verification fails, respond with a status code 401 (Unauthorized)
                res.sendStatus(401);
            } else {
                // If the token is valid, respond with a success JSON message
                res.json({
                    sucess: "ok",
                });
            }
        }
    );
};

// Express route for generating a new user session
export const generateSession = (req: express.Request, res: express.Response) => {
    // Generate a new JWT token for the user session
    const token = generateToken();

    // Extract and store the session ID from the token
    const sessionId = token.sessionId;
    delete token.sessionId;

    // Respond with the generated token (excluding the session ID)
    res.json(token);
};

// Express route for retrieving chat messages associated with a user's session
export const getChatMessages = async (req: express.Request, res: express.Response) => {
    // Extract the token from the 'authorization' header
    const token = req.header("authorization");

    // Decode the token to retrieve session information
    const decodedToken = decodeToken(token);

    // Retrieve chat messages associated with the user's session
    const messages = await getMessages(decodedToken.session_id);

    // Respond with the retrieved chat messages in JSON format
    res.json(messages);
};

// Express route for finding and retrieving a document based on its unique identifier
export const searchDocument = async (req: express.Request, res: express.Response) => {
    const id = req.query.id;
    const document = await findDocument(id as string);

    // Ensure that the embedding data is null to exclude it from the respons
    if (document) {
        document.embedding = null;
    }
    console.log(id);
    res.json(document);
};

// Express route for creating an embedding for a document
export const newEmbedding = async (req: express.Request, res: express.Response) => {
    const documentTitle = req.body.title;
    const documentKeyword = req.body.keyword;
    const document = req.body.input;
    console.log("Creating Embedding")
    // Create an embedding for the document and store it in the database
    const ret = await createEmbedding(document, documentTitle, documentKeyword);
    res.json({
        id: ret.objectId.toString(),
        success: true,
    });
};

// Express route for testing embedding and finding related documents
export const testEmbedding = async (req: express.Request, res: express.Response) => {
    try {
        const documentKeyword = req.body.keyword;
        console.log("herfe", documentKeyword)

        // Get embedding data for the document keyword
        const embeddingData = await getEmbeddingData(documentKeyword);

        if (!embeddingData || embeddingData.length === 0) {
            return res.status(404).json({ message: 'Embedding data not found or empty.' });
        }

        // Find related documents based on the embedding data
        const result = await findRelatedDocuments(embeddingData[0].embedding);

        res.json({
            related: result,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// Express route for saving application settings
export const saveAppSettings = async (req: express.Request, res: express.Response) => {
    // Extract settings data from the request body
    const settings: SettingsInterface = req.body.settingsData;

    // Save the provided settings to the database
    const result = saveSettings(settings);
    console.log("res", settings);
    res.json({
        related: result,
    });
};

export const getAppSettings = async (req: express.Request, res: express.Response) => {
    //const settings = await getSettings();
    //res.json(settings)
    return {};
};

export const submitDocument = async (req: express.Request, res: express.Response) => {
    const documentName = req.body.name;
    const documentEmail = req.body.email;
    const documentTicketClassification = req.body.ticketClassification;
    const documentSpecificTopic = req.body.specificTopic;
    const documentMessage = req.body.message;
    const documentQuestionValue = req.body.questionValue;

    // Submit the form data and store it in the database
    const ret = await submitForm(
        documentName,
        documentEmail,
        documentTicketClassification,
        documentSpecificTopic,
        documentMessage,
        documentQuestionValue
    );
    res.json({
        id: ret.id.toString(),
        success: true,
    });
};

export const findAdmin = async (req: express.Request, res: express.Response) => {
    const email = req.query.email as string;

    const document = await findAdminAccs(email);

    if (document) {
        res.json(true);
    } else {
        res.json(false);
    }
};

/**
 * Use rest api over sockets for this
 */

export const uploadFile = async (req: express.Request, res: express.Response) => {
    try {
        const wsClients: WebSocketServer[] = [];
        const file = req.file;
        const token = req.header("authorization");
        const decodedToken = decodeToken(token);

        const fileMessage = chatMessage("", "", "", "_self", new Date());
        fileMessage.format = "file";
        fileMessage.fileName = file.originalname;
        fileMessage.message.senderToken = token.toString();

        /**
         * right now, process pdfs
         * if format is not pdf, treat it as txt and read it forcefully
         */
        const content = await readDocumentFile(file);
        fileMessage.message.messageBody = content;

        let notification = createNotification(
            "",
            "AI Loading",
            "AI Chat is processing..."
        );

        wsClients[decodedToken.session_id].send(JSON.stringify(notification));

        predictCompletion(content).then((res) => {
            /* const response = chatMessage(res.message?.content, 'AI Chat', new Date());
            response.message.senderToken = token.toString();
            storeMessage(response);
            wsClients[decodedToken.session_id].send(JSON.stringify(response));
            wsClients[decodedToken.session_id].send(createRemoveNotification()); */
        });

        storeMessage(fileMessage);
        res.json(fileMessage);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

export const deleteCategory = async (req: express.Request, res: express.Response) => {
    const categoryId = req.params.id;

    if (!categoryId) {
        return res.status(400).json({ error: 'Missing category ID parameter in query' });
    }

    try {
        // Call the deleteCategory function and pass the necessary parameters
       await getConnection().then(async (db) => {
            const objectId = new ObjectId(categoryId);
            const query = { _id: objectId };
            const deleteResult = await db.collection('embeddingCategories').deleteOne(query);

            if (!(deleteResult.deletedCount === 0)) {
                return res.status(404).json({ error: 'Category not found or deletion failed' });
            }

            return res.sendStatus(200); // Success status

        }).catch((e) => {
            console.log('Error', e);
            return res.sendStatus(500); // Internal server error status
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};