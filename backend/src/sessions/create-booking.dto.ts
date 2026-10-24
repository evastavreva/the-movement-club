import { IsEmail, IsString, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @Matches(/\S/)
  name: string;

  @IsEmail()
  email: string;
}
