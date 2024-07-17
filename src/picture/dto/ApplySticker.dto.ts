import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ApplyStickerDto {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true }) // 배열의 각 요소가 문자열인지 검증
  stickerNames: string[];
}
