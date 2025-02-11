import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from '../schema/question.schema';

@Injectable()
export class QuestionsService {
  constructor(@InjectModel(Question.name) private questionModel: Model<QuestionDocument>) {}

  async create(questionData: Partial<Question>): Promise<Question> {
    const question = new this.questionModel(questionData);
    return question.save();
  }

  async findAll(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async getQuestion(id) {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question
  }

  async findById(id: string) {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return {
      "_id":question._id,
      "questionText": question.questionText,
      "choices": question.choices,
      "nextQuestionId": question.nextQuestionId
    }
  }

  async update(id: string, updateData: Partial<Question>): Promise<Question> {
    const updatedQuestion = await this.questionModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updatedQuestion) {
      throw new NotFoundException('Question not found');
    }
    return updatedQuestion;
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.questionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Question not found');
    }
    return { message: 'Question deleted successfully' };
  }

  async getFirstQuestion() {
    const firstQuestion = await this.questionModel.findOne({filter: 'start'}).exec();
    return {
      "_id":firstQuestion._id,
      "questionText": firstQuestion.questionText,
      "choices": firstQuestion.choices,
      "nextQuestionId": firstQuestion.nextQuestionId
    }
  }
}