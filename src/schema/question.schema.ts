import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Question {
  @Prop({ required: true })
  questionText: string;

  @Prop({ required: true })
  choices: string[];

  @Prop({ required: true })
  correctAnswer: string;

  @Prop()
  filter: string;

  @Prop({ required: true })
  nextQuestionId: string;

  _id: string;

}

export type QuestionDocument = Question & Document;
export const QuestionSchema = SchemaFactory.createForClass(Question);