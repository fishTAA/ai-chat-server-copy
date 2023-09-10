
export interface ChatCommunication {
	type: 'message' | 'connection',
	authIssue?: boolean,
  method?: 'send' | 'receive', 
	message: Message,
}

export interface Message {
	messageBody: string,
	dateSent: string,
	sender: string,
	senderToken?: string,
}

export const connectionMessage = (message: string, authIssue?: boolean) => {
	const chat: ChatCommunication = {
		type: 'connection',
		authIssue: authIssue,
		message: {
			messageBody: message,
			dateSent: new Date().toDateString(),
			sender: 'system',
		}
	}
	return JSON.stringify(chat)
}


export const chatMessage = (message: string, sender: string, dateSent: string) => {
	const chat: ChatCommunication = {
		type: 'message',
		authIssue: false,
		message: {
			messageBody: message,
			dateSent: dateSent,
			sender: sender,
		}
	}
	return JSON.stringify(chat)
}