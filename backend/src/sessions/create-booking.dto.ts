import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateBookingDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2, {
    message: 'Please enter your full name (at least 2 characters).',
  })
  name: string;

  @IsEmail()
  email: string;
}
