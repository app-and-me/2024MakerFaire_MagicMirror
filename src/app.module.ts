import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PictureService } from './picture/picture.service';
import { PictureController } from './picture/picture.controller';

@Module({
  imports: [],
  controllers: [AppController, PictureController],
  providers: [AppService, PictureService],
})
export class AppModule {}
