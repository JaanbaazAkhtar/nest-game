import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { QuestionsService } from '../question/question.service';

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private activeGames: Map<string, { player1: string; player2: string }> = new Map();
  private readonly clients: Map<string, Socket> = new Map();

  constructor(private gameService: GameService, private questionsService: QuestionsService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('question')
  async handleMessage(@MessageBody() body: any, @ConnectedSocket() clientSocket: Socket) {
  
    const data = JSON.parse(JSON.stringify(body))
    console.log('request data ', data)
    const headers = clientSocket.handshake.headers
    
    const sessionId = JSON.parse(data).sessionId
    const playerId = JSON.parse(data).playerId
    const questionId = JSON.parse(data).questionId
    const answer = JSON.parse(data).answer

    let client = this.clients.get(playerId); 

    let resObj
    if (!client) {
      client = clientSocket;
      this.clients.set(playerId, client);
      console.log('sessionId before starting is ', sessionId)
      resObj = await this.getGameQuestion(sessionId, playerId)
    } else {
      resObj = await this.getNextQuestion(sessionId, playerId, questionId, answer)
    }

    //4.emit the response
    try{
        // const { questions } = resObj
        if(!resObj) {
          resObj = {
            "message": "Thank you for playing"
          }
        }
        client.emit('answer', resObj);
    }catch(error){
      console.log('error ')
    }
  }

  async getGameQuestion(sessionId: string, playerId: string) {
    console.log('sessionId in startgame is ', sessionId)
    const gameSession = await this.gameService.findGameSession(sessionId);
    let question
    if(!gameSession.playerNextQuestionIds.get(playerId)) {
      question = await this.gameService.getFirstQuestion(sessionId, playerId);
    }
    
    return question
  }

  async getNextQuestion(sessionId: string, playerId: string, questionId: string, answer) {
    return this.gameService.saveAndGetNextQuestion(sessionId, playerId, questionId, answer)
  }
  async submitAnswer(client: Socket, payload: { sessionId: string; questionId: string; answer: string }) {
    const { sessionId, questionId, answer } = payload;

    const gameSession = await this.gameService.submitAnswer(client.id, sessionId, questionId, answer);

    // Check if all answers are submitted and calculate scores
    const allAnswered = Object.values(gameSession.answers).every((answers) => answers.length === gameSession.questions.length);

    if (allAnswered) {
      const session = await this.gameService.findGameSession(sessionId)
      const result = await this.gameService.calculateScores(session);
      this.server.to(sessionId).emit('game:end', result);
    }
  }

  async closeConnection(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.disconnect();
      this.clients.delete(clientId);
      console.log(`Connection closed for client ID: ${clientId}`);
    } else {
      console.log(`Client ID ${clientId} not found.`);
    }
  }
}
