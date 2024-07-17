import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PictureService } from './picture.service';
import * as fs from 'fs';
import { Response } from 'express'; // Add this line

@Controller('picture')
export class PictureController {
  constructor(private readonly pictureService: PictureService) {}

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
    @Body('stickerNames') stickerNames: string[],
    @Body('hairData') hairData: string[],
  ): Promise<Buffer> {
    if (!image) {
      throw new Error('Image file is required');
    }

    try {
      const imagePath = `src/assets/image.png`;
      fs.writeFileSync(imagePath, image.buffer);

      const imageBuffer = await this.pictureService.applySticker(
        stickerNames,
        hairData,
      );

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename=sticker.png');
      res.status(HttpStatus.OK).send(imageBuffer);

      return imageBuffer;
    } catch (error) {
      console.log(error);
    }
  }
}
