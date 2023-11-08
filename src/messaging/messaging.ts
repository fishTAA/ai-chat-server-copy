import { ObjectId, UUID } from 'mongodb';
import { getConnection } from '../db/connection';
import { decodeToken } from '../sessions/session';
import { WebSocketServer } from 'ws';
import { DocumentUpload } from '../ai/models';

export interface ChatCommunication {
	type: 'message' | 'connection' | 'notification' | 'remove-notification',
  format?: 'text' | 'file',
  fileName?: string,
	authIssue?: boolean,
  method?: 'send' | 'receive', 
	message: Message,
}

export interface MessageHistory {
  _id: UUID;
  sessionId: string,
  sender: string,
  dateSent: Date,
  fileName?: string,
  format?: 'text' | 'file',
  message: Message
}

export interface StoreMessageRes {
  id: ObjectId;
  dateSent: Date;
}

export interface Message {
  messageID: string
  messageTitle?: string
	messageBody: string,
	dateSent: Date,
	sender: string,
	senderToken?: string,
}

export const connectionMessage = (messageID:string,messageTitle: string, message: string, authIssue?: boolean) => {
	const chat: ChatCommunication = {
		type: 'connection',
		authIssue: authIssue,
		message: {
      messageID: messageID,
      messageTitle: messageTitle,
			messageBody: message,
			dateSent: new Date(),
			sender: 'system',
		}
	}

  // convert the message object to a JSON string
	return JSON.stringify(chat)
}


export const chatMessage = (messageID:string,messageTitle: string, message: string, sender: string, dateSent: Date): ChatCommunication => {
	const chat: ChatCommunication = {
		type: 'message',
		authIssue: false,
		message: {
      messageID:messageID,
      messageTitle: messageTitle,
			messageBody: message,
			dateSent: dateSent,
			sender: sender,
		}
	}
  
  // return the object
	return chat;
}

export const createNotification = (messageID:string,messageTitle: string, message: string): ChatCommunication => {
	const chat: ChatCommunication = {
		type: 'notification',
		authIssue: false,
		message: {
      messageID:messageID,
      messageTitle: messageTitle,
			messageBody: message,
			dateSent: new Date(),
			sender: 'AI Chat',
		}
	}
	return chat;
}
export const createRemoveNotification = (): ChatCommunication => {
	const chat: ChatCommunication = {
		type: 'remove-notification',
		authIssue: false,
		message: {
      messageID:'',
      messageTitle: '',
			messageBody: '',
			dateSent: new Date(),
			sender: 'AI Chat',
		}
	}
	return chat;
}

export const sendMessage = (message: ChatCommunication, ws: WebSocket) => {
  // Convert the chat message object to a JSON string and send it via the WebSocket connection.
  ws.send(JSON.stringify(message));
}

export const storeMessage = async (comm: ChatCommunication): Promise<StoreMessageRes> => {
  return await getConnection().then(async (db)=> {
    // getting the current date and time
    const dateSend = new Date()

    // Insert the message into the "messageHistory" collection in the database.
    const res = await db.collection("messageHistory").insertOne({
      sessionId: decodeToken(comm.message.senderToken).session_id,
      sender: comm.message.sender,
      dateSent: dateSend,
      fileName: comm.fileName,
      format: comm.format || 'text',
      message: {
        // // Copy all properties from the original message.
        ...comm.message,
        // Update the message's dateSent property with the current date and time.
        dateSent: dateSend,
      },
    });

    // Return an object containing the inserted message's ID and the date it was sent.
    return {
      id: res.insertedId,
      dateSent: dateSend,
    }
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  })
}

export const getMessages = async (sessionId: string): Promise<ChatCommunication[]> => {
  return getConnection().then(async (db)=> {
    let chatCommunications: ChatCommunication[] = [];
    
    // Query the "messageHistory" collection to find chat messages with the specified session ID.
    const c = db.collection<MessageHistory>("messageHistory").find<MessageHistory>({
      sessionId: {
        $eq: sessionId,
      }
    }, {
      sort: {
        dateSent: 1,
      }
    })

    // Convert the result to an array of message history records.
    const messageHistory = await c.toArray();

    // Map the message history records to chat message objects.
    chatCommunications = messageHistory.map((m)=> {
      return {
        type: 'message',
        format: m.format,
        fileName: m.fileName,
        message: m.message,
      }
    })

    // Return the array of chat messages.
    return chatCommunications;
  }).catch((e)=> {
    console.log("error", e)
    return [];
  })

}


export const findDocument = async (_id: string): Promise<DocumentUpload | null > => {
  return getConnection().then(async (db)=> {
    // Find a document in the "documentUpload" collection by its unique identifier.
    const c = db.collection<DocumentUpload>("documentUpload").findOne(new ObjectId(_id))
    //const messageHistory = await c;

    // Return the result of the database query.
    return c;
  }).catch((e)=> {
    console.log("error", e)
    return null;
  })
}