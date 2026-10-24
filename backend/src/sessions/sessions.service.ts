import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSessionDto } from './create-session.dto.js';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
