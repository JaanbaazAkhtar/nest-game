import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { QuestionsService } from './question.service';

@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post()
  async create(@Body() questionData: any) {
    return await this.questionsService.create(questionData);
  }

  @Get()
  async findAll() {
    return await this.questionsService.findAll();
  }

  @Get('/:id')
  async getQuestion(@Param('id') id: string) {
    return await this.questionsService.findById(id)
  }

  @Post('/update/:id')
  async updateQuestion(@Param('id') id, @Body() body) {
    return await this.questionsService.update(id, body);
  }

  @Delete(':id')
  async deleteQuestion(@Param('id') id) {
    return await this.deleteQuestion(id);
  }
}