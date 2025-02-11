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
    const selectedQuestions = questions.slice(0, 4); // Select 4 questions

    const session = new this.gameSessionModel({
      player1: player1,
      player2: player2,
      questions: selectedQuestions.map((q) => q._id),
    });
    return session.save();
  }

  async findGameSession(sessionId: string): Promise<GameSessionDocument> { // Important: Note the type change
    const session = await this.gameSessionModel
        .findById(sessionId)
        .populate('questions')
        .exec();

    if (!session) {
        throw new NotFoundException('Game session not found');
    }

    return session; // This should now be a GameSessionDocument
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

  async submitAnswer(sessionId: string, playerId: string, questionId: string, answer: string): Promise<GameSession> {
    const session = await this.findGameSession(sessionId);
    const questionIndex = session.questions.findIndex((q) => q._id.toString() === questionId);

    if (questionIndex === -1) {
      throw new NotFoundException('Question not found in the session');
    }

    const playerAnswers = session.answers[playerId] || [];
    playerAnswers[questionIndex] = answer;
    session.answers.set(playerId, playerAnswers);

    await session.save();
    return session;
  }

  async calculateScores(session: GameSessionDocument): Promise<{ winner: string | null }> {
    const { player1, player2, questions, answers } = session;

    const scores = { [player1]: 0, [player2]: 0 };

    questions.forEach((question, index) => {
      const correctAnswer = question.correctAnswer;
      if (answers[player1]?.[index] === correctAnswer) scores[player1]++;
      if (answers[player2]?.[index] === correctAnswer) scores[player2]++;
    });

    const score1 = 3
    const score2 = 4
    session.scores.set(player1, score1)
    session.scores.set(player2, score2)
    await session.save();

    if (scores[player1] > scores[player2]) return { winner: player1 };
    if (scores[player2] > scores[player1]) return { winner: player2 };
    return { winner: null }; // Draw
  }
}
