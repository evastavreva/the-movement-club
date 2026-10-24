import { Body, Controller, Get, Post } from '@nestjs/common';
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
}
