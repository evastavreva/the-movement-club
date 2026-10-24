import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';
import { BookingEmailService } from './booking-email.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [SessionsController],
  providers: [SessionsService, BookingEmailService],
})
export class SessionsModule {}
