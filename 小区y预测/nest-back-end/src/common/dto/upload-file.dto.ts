import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename: string;

  @IsString()
  @IsNotEmpty()
  filepath: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;
}