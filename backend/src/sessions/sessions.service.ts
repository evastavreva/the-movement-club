import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto } from './create-booking.dto.js';
import { CreateSessionDto } from './create-session.dto.js';
import { BookingEmailService } from './booking-email.service.js';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingEmail: BookingEmailService,
  ) {}

  create(dto: CreateSessionDto) {
    return this.prisma.session.create({
      data: {
        classType: dto.classType,
        instructor: dto.instructor,
        startTime: new Date(dto.startTime),
        duration: dto.duration,
      },
    });
  }

  async findAll() {
    const sessions = await this.prisma.session.findMany({
      orderBy: { startTime: 'asc' },
      include: { booking: { select: { id: true } } },
    });
    return sessions.map(({ booking, ...session }) => ({
      ...session,
      available: booking === null,
    }));
  }

  async book(sessionId: number, dto: CreateBookingDto) {
    try {
      const { session, ...booking } = await this.prisma.booking.create({
        data: { sessionId, name: dto.name, email: dto.email },
        include: { session: true },
      });
      const emailStatus = await this.bookingEmail.send({ ...booking, session });
      return { ...booking, emailStatus };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('This session is already booked.');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Session not found.');
        }
      }
      throw error;
    }
  }
}
