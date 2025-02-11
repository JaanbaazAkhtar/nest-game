import { Controller, Post, Body, Param } from '@nestjs/common';
import { GameService } from './game.service';


@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('start')
  async startGame(
    @Body('player1') player1: string,
    @Body('player2') player2: string,
  ) {
    // const player1 = await this.usersService.findUserByUsername(player1Username);
    // const player2 = await this.usersService.findUserByUsername(player2Username);

    // if (!player1 || !player2) {
    //   throw new Error('One or both players not found');
    // }

    return this.gameService.createGameSession(player1, player2);
  }

  @Post(':sessionId/submit')
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() body,
  ) {
    return this.gameService.submitAnswer(sessionId, body.playerId, body.questionId, body.answer);
  }
}
