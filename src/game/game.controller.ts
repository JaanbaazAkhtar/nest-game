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
    return this.gameService.createGameSession(player1, player2);
  }
}
