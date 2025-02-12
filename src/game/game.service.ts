import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameSession, GameSessionDocument } from '../schema/game-session.schema';
import { QuestionsService } from '../question/question.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(GameSession.name) private gameSessionModel: Model<GameSessionDocument>,
    private questionsService: QuestionsService,
    private authService: AuthService,
  ) {}

  async createGameSession(player1, player2): Promise<GameSession> {
    const questions = await this.questionsService.findAll();
    const selectedQuestions = questions.slice(0, 4); 

    const session = new this.gameSessionModel({
      player1: player1,
      player2: player2,
      questions: selectedQuestions.map((q) => q._id),
    });
    return session.save();
  }

  async findGameSession(sessionId: string): Promise<GameSessionDocument> { 
    const session = await this.gameSessionModel
        .findById(sessionId)
        .populate('questions')
        .exec();

    if (!session) {
        throw new NotFoundException('Game session not found');
    }

    return session;
}

  async getFirstQuestion(sessionId, playerId) {
    const question = await this.questionsService.getFirstQuestion()
    const session = await this.gameSessionModel.findById(sessionId)
    session.playerNextQuestionIds.set(playerId, question.nextQuestionId)
    session.save()
    return question
  }

  async saveAndGetNextQuestion(sessionId: string, playerId: string, questionId: string, answer: string) {
    const session = await this.findGameSession(sessionId);
    session.answers.set(playerId, [questionId, answer])

    const currentQuestion = await this.questionsService.getQuestion(questionId)
    const correctAnswer = currentQuestion.correctAnswer
    
    const nextQuestionId = session.playerNextQuestionIds.get(playerId)
    let nextQuestion
    if(nextQuestionId){
      nextQuestion = await this.questionsService.findById(nextQuestionId)
      session.playerNextQuestionIds.set(playerId, nextQuestion.nextQuestionId)
    }
    
    console.log('map', session.playerNextQuestionIds)

    const score = session.scores.get(playerId) ? session.scores.get(playerId) : 0
    if(answer == correctAnswer) {
      session.scores.set(playerId, Number(score)+1)
    }
    
    session.save()

    if(!nextQuestion){
      const scorePlayer1 = session.scores.get(session.player1) ? session.scores.get(session.player1) : 0
      const scorePlayer2 = session.scores.get(session.player2) ? session.scores.get(session.player2) : 0
      let message
      console.log('score of 1 is '+scorePlayer1+' of 2 is '+scorePlayer2)
      if(scorePlayer1 > scorePlayer2) {
        const user1 =  await this.authService.getUserById(session.player1)
        message = `${user1.username} is the winner` 
      } else if (scorePlayer2 > scorePlayer1) {
        const user2 = await this.authService.getUserById(session.player2)
        message = `${user2.username} is the winner` 
      } else {
        message = 'Its a draw'
      }
      nextQuestion = message
    }

    return nextQuestion
  }
}
