import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateBookingDto } from './create-booking.dto.js';
import { CreateSessionDto } from './create-session.dto.js';
import { SessionsService } from './sessions.service.js';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.sessions.create(dto);
  }

  @Get()
  findAll() {
    return this.sessions.findAll();
  }

  @Post(':id/book')
  book(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateBookingDto) {
    return this.sessions.book(id, dto);
  }
}
