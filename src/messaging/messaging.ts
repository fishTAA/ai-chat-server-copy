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
	messageBody: string,
	dateSent: Date,
	sender: string,
	senderToken?: string,
}

export const connectionMessage = (message: string, authIssue?: boolean) => {
	const chat: ChatCommunication = {
		type: 'connection',
		authIssue: authIssue,
		message: {
			messageBody: message,
			dateSent: new Date(),
			sender: 'system',
		}
	}
	return JSON.stringify(chat)
}


export const chatMessage = (message: string, sender: string, dateSent: Date): ChatCommunication => {
	const chat: ChatCommunication = {
		type: 'message',
		authIssue: false,
		message: {
			messageBody: message,
			dateSent: dateSent,
			sender: sender,
		}
	}
	return chat;
}

export const createNotification = (message: string): ChatCommunication => {
	const chat: ChatCommunication = {
		type: 'notification',
		authIssue: false,
		message: {
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
			messageBody: '',
			dateSent: new Date(),
			sender: 'AI Chat',
		}
	}
	return chat;
}

export const sendMessage = (message: ChatCommunication, ws: WebSocket) => {
  ws.send(JSON.stringify(message));
}

export const storeMessage = async (comm: ChatCommunication): Promise<StoreMessageRes> => {
  return await getConnection().then(async (db)=> {
    const dateSend = new Date()
    const res = await db.collection("messageHistory").insertOne({
      sessionId: decodeToken(comm.message.senderToken).session_id,
      sender: comm.message.sender,
      dateSent: dateSend,
      fileName: comm.fileName,
      format: comm.format || 'text',
      message: {
        ...comm.message,
        dateSent: dateSend,
      },
    });
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
    const c = db.collection<MessageHistory>("messageHistory").find<MessageHistory>({
      sessionId: {
        $eq: sessionId,
      }
    }, {
      sort: {
        dateSent: 1,
      }
    })
    const messageHistory = await c.toArray();
    chatCommunications = messageHistory.map((m)=> {
      return {
        type: 'message',
        format: m.format,
        fileName: m.fileName,
        message: m.message,
      }
    })
    return chatCommunications;
  }).catch((e)=> {
    console.log("error", e)
    return [];
  })

}


export const findDocument = async (_id: string): Promise<DocumentUpload | null > => {
  return getConnection().then(async (db)=> {
    const c = db.collection<DocumentUpload>("documentUpload").findOne(new ObjectId(_id))
    //const messageHistory = await c;
    return c;
  }).catch((e)=> {
    console.log("error", e)
    return null;
  })

}