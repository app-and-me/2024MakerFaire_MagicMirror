import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Get,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PictureService } from './picture.service';
import * as fs from 'fs';
import { Response } from 'express';
import { StickerDataDto } from './dto/sticker.dto';

@Controller('picture')
export class PictureController {
  constructor(private readonly pictureService: PictureService) {}

  @Post('saveImage')
  async saveImage(@Body('imageUrl') imageUrl: string) {
    this.pictureService.saveImage(imageUrl);
  }

  @Get('getLastImageNumber')
  async getLastImageNumber(): Promise<number> {
    return this.pictureService.getLastImageNumber();
  }

  @Post('generateCharacterName')
  @UseInterceptors(FileInterceptor('image'))
  async generateCharacterName(
    @UploadedFile() image: Express.Multer.File,
  ): Promise<string> {
    if (!image) {
      throw new Error('Image file is required');
    }

    try {
      const imagePath = `src/assets/image.png`;
      fs.writeFileSync(imagePath, image.buffer);

      const result = await this.pictureService.generateCharacterName();

      return result;
    } catch (error) {
      console.log(error);
    }
  }

  @Post('applySticker')
  @UseInterceptors(FileInterceptor('image'))
  async applySticker(
    @UploadedFile() image: Express.Multer.File,
    @Res() res: Response,
    @Body() body: StickerDataDto,
  ): Promise<Buffer> {
    const { stickerNames } = body;

    if (!image) {
      throw new Error('Image file is required');
    }

    try {
      const imagePath = `src/assets/image.png`;
      fs.writeFileSync(imagePath, image.buffer);

      const imageBuffer = await this.pictureService.applySticker(stickerNames);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename=sticker.png');
      res.status(HttpStatus.OK).send(imageBuffer);

      return imageBuffer;
    } catch (error) {
      console.log(error);
    }
  }
}
