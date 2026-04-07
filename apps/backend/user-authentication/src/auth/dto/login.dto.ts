import { IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  cin: string;

  @IsString()
  @MinLength(6)
  password: string;

  /**
   * ====================================================
   * reCAPTCHA TOKEN - DÉSACTIVÉ
   * ====================================================
   * Ce champ est optionnel et n'est plus validé
   * Pour réactiver reCAPTCHA, décommenter @IsString()
   * ====================================================
   */
   @IsString()
   @IsOptional()
   recaptchaToken?: string;
}