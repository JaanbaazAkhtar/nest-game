import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameController } from './game.controller';
import { Question, QuestionSchema } from '../schema/question.schema';
import { GameSession, GameSessionSchema } from '../schema/game-session.schema';
import { QuestionsService } from '../question/question.service';
import { AuthService } from '../auth/auth.service';
import { User, UserSchema } from '../schema/user.schema';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: GameSession.name, schema: GameSessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [GameService, GameGateway, QuestionsService, AuthService, JwtService],
  controllers: [GameController],
})
export class GameModule {}