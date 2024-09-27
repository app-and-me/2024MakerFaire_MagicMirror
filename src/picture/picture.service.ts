import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import model from 'src/config/model';
import { PythonShell } from 'python-shell';
import * as path from 'path';
import * as fs from 'fs';

function fileToGenerativePart(path: fs.PathOrFileDescriptor, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString('base64'),
      mimeType,
    },
  };
}

@Injectable()
export class PictureService {
  async getLastImageNumber(): Promise<number> {
    const directoryPath = path.join(__dirname, '../../pages/assets/results');

    const files = fs.readdirSync(directoryPath);
    const imageFiles = files.filter((file) => file.endsWith('.png'));

    return imageFiles.length > 0
      ? Math.max(...imageFiles.map((file) => parseInt(file.split('.')[0])))
      : 0;
  }

  async saveImage(imageUrl: string): Promise<void> {
    const newFileName = `${(await this.getLastImageNumber()) + 1}.png`;
    const newFilePath = path.join('./pages/assets/results/', newFileName);

    const directoryPath = path.dirname(newFilePath);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const base64Data = imageUrl.includes(';base64,')
      ? imageUrl.split(';base64,').pop()
      : '';
    if (!base64Data) {
      throw new HttpException(
        'Invalid image URL format.',
        HttpStatus.BAD_REQUEST,
      );
    }

    fs.writeFileSync(newFilePath, base64Data, {
      encoding: 'base64',
    });
  }

  async generateCharacterName(): Promise<string> {
    try {
      const prompt = `이 사진속 인물과 비슷하게 생긴 동화속 인물\n
                      list = [난쟁이,라푼젤,마우이,메타몽,모아나,뮬란,미키마우스,바넬로피,백설공주,벨,신데렐라,신데렐라의마법의요정,아리엘,안나,알라딘,야수,에릭왕자,엘리스,엘사,올라프,자스민,잠자는숲속의공주,장화신은고양이,주먹왕랄프,크리스토프,타잔,토토로,트롤,플린라이더,피노키오,피터팬,한스,후크선장]\n
                      사람을 사람이라고 생각하지 말고 사람 캐릭터가 아닌 캐릭터도 포함해야 되니까 느낌이 비슷한걸로\n
                      남자랑 여자랑 구분해서 생각하지 마 전생이니까 성별이 달라도 돼\n
                      list 안에서 하나 골라서\n 괄호같은거 없이
                      왼쪽 사람 부터 각각 한 캐릭터 씩만 한명일 경우는 문자만 (벨) 두명 이상일 경우 컴마로 나눠서 말해 (벨, 플린라이더)
                      주관적인 해석이 들어가도 돼 얼굴이 잘 보이는 사람만 해\n
                      list 안의 캐릭터 중 하나로 골라
                      `;
      const imageParts = [
        fileToGenerativePart('src/assets/image.png', 'image/png'),
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to analyze images.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async applySticker(stickerNames: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const stickerData = JSON.stringify({ stickerNames });

      const options = {
        pythonOptions: ['-u'],
        args: [stickerData],
      };

      const pyshell = new PythonShell('src/sticker.py', options);

      pyshell.on('stdout', (message) => {
        console.log('Python Output:', message);
      });

      pyshell.on('stderr', (err) => {
        console.error(err);
        reject(err);
      });

      pyshell.on('close', async () => {
        resolve(
          fs.readFileSync(
            path.join(
              `./pages/assets/results/${await this.getLastImageNumber()}.png`,
            ),
          ),
        );
      });
    });
  }
}
