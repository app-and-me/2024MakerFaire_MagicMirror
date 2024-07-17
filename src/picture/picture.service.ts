import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import model from 'src/config/model';
import { PythonShell } from 'python-shell';

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
  async generateCharacterName(): Promise<string> {
    try {
      const prompt = `이 사진속 인물과 똑같이 생긴 동화속 인물\n
                      list(백설공주
                      신데렐라
                      잠자는 숲속의 공주
                      피노키오
                      알라딘
                      올라프
                      엘사
                      안나
                      장화신은 고양이
                      인어공주
                      백설공주의 일곱 난쟁이
                      신데렐라의 마법의 요정
                      피터팬
                      겨울왕국 트롤
                      후크선장
                      토토
                      도로시
                      마녀
                      오즈의 마법사
                      벨
                      야수
                      아리엘
                      에릭 왕자
                      미녀와 야수
                      알라딘
                      자스민 공주
                      라푼젤
                      플린 라이더
                      크리스토프
                      타잔
                      마우이
                      미키마우스)\n

                      사람을 사람이라고 생각하지 말고 사람 캐릭터가 아닌 캐릭터도 포함해야 되니까 느낌이 비슷한걸로\n

                      list에서 하나 골라서\n 괄호같은거 없이 \n 
                      왼쪽 사람 부터 각각 한 캐릭터 씩만 말해\n

                      주관적인 해석이 들어가도 돼 \n
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

  async applySticker(
    stickerNames: string[],
    hairData: string[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const stickerData = JSON.stringify({ stickerNames });
      const hair = JSON.stringify({ hairData });

      const options = {
        pythonOptions: ['-u'],
        args: [stickerData, hair],
      };

      const pyshell = new PythonShell('src/sticker.py', options);

      pyshell.on('stdout', (message) => {
        console.log('Python Output:', message);
      });

      pyshell.on('stderr', (err) => {
        console.error(err);
        reject(err);
      });

      pyshell.on('close', () => {
        resolve(fs.readFileSync('src/assets/out.png'));
      });
    });
  }
}
