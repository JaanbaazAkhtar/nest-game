import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsService } from './question.service';
import { QuestionsController } from './question.controller';
import { Question, QuestionSchema } from '../schema/question.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }])],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}