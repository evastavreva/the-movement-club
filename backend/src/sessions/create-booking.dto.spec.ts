import { ValidationPipe } from '@nestjs/common';
import { CreateBookingDto } from './create-booking.dto.js';

const pipe = new ValidationPipe({ whitelist: true });
const metadata = { type: 'body' as const, metatype: CreateBookingDto };

describe('Booking name validation', () => {
  it.each(['', ' ', 'A', ' A ', 123, undefined])(
    'rejects an invalid name: %s',
    async (name) => {
      await expect(
        pipe.transform({ name, email: 'test@example.com' }, metadata),
      ).rejects.toThrow();
    },
  );

  it.each([' Eva ', '李明', 'O’Connor', 'Jean-Luc', 'Eva Stavreva'])(
    'accepts and trims a valid name: %s',
    async (name) => {
      const booking = await pipe.transform(
        { name, email: 'test@example.com' },
        metadata,
      );
      expect(booking.name).toBe(name.trim());
    },
  );
});
