import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class GameSession {
  @Prop({ required: true })
  player1: string;

  @Prop({ required: true })
  player2: string;

  @Prop({ required: true })
  questions: any[];

  @Prop({ type: Map, of: [String], default: {} })
  playerNextQuestionIds: Map<string, string>;

  @Prop({ type: Map, of: [String], default: {} }) // Map of player answers
  answers: Map<string, string[]>;

  @Prop({ type: Map, of: [String], default: {} })
  scores: Map<string, number>;
}

export type GameSessionDocument = GameSession & Document;
export const GameSessionSchema = SchemaFactory.createForClass(GameSession);
