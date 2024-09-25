import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getImage(id: string): string {
    return `../pages/assets/results/${id}.png`;
  }
}
