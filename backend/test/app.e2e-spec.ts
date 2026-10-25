import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { BookingEmailService } from '../src/sessions/booking-email.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let sessionId: number | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BookingEmailService)
      .useValue({
        send: vi
          .fn()
          .mockResolvedValue({
            emailStatus: 'disabled',
            message: 'Welcome to your session!',
            aiGenerated: false,
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('allows only one of two simultaneous booking requests', async () => {
    const session = await prisma.session.create({
      data: {
        classType: 'Mat Pilates',
        instructor: 'Concurrency test',
        startTime: new Date(Date.now() + 86_400_000),
        duration: 60,
      },
    });
    sessionId = session.id;
    const api = request(app.getHttpServer());
    const results = await Promise.all([
      api
        .post(`/sessions/${sessionId}/book`)
        .send({ name: 'First Customer', email: 'first@example.com' }),
      api
        .post(`/sessions/${sessionId}/book`)
        .send({ name: 'Second Customer', email: 'second@example.com' }),
    ]);
    expect(
      results.map((result) => result.status).sort((a, b) => a - b),
    ).toEqual([201, 409]);
    const bookings = await prisma.booking.findMany({ where: { sessionId } });
    expect(bookings).toHaveLength(1);
    const winner = results.find((result) => result.status === 201)!;
    expect(bookings[0].id).toBe(winner.body.id);
    expect(bookings[0].email).toBe(winner.body.email);
    const listed = await api.get('/sessions').expect(200);
    expect(
      listed.body.find((item: { id: number }) => item.id === sessionId)
        .available,
    ).toBe(false);
  });

  afterEach(async () => {
    try {
      if (sessionId !== undefined) {
        await prisma.booking.deleteMany({ where: { sessionId } });
        await prisma.session.delete({ where: { id: sessionId } });
        sessionId = undefined;
      }
    } finally {
      await app?.close();
    }
  });
});
