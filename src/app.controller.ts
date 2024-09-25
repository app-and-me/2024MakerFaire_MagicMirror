import { Controller, Get, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getImage(@Query('id') id: string, @Res() res: Response): void {
    const imagePath = join(
      __dirname,
      '..',
      'pages',
      'assets',
      'results',
      `${id}.png`,
    );
    res.sendFile(imagePath);
  }
}
