import { Logger } from '@nestjs/common';
import { BookingEmailService } from './booking-email.service.js';
import { SessionsService } from './sessions.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

const booking = {
  id: 42,
  name: 'Eva Test',
  email: 'eva@example.com',
  sessionId: 7,
  createdAt: new Date(),
  session: {
    id: 7,
    classType: 'Mat Pilates',
    instructor: 'Sofia',
    duration: 45,
    startTime: new Date('2027-01-15T09:00:00Z'),
  },
};
const generated = {
  candidates: [
    {
      finishReason: 'STOP',
      content: {
        parts: [
          {
            text: 'For Mat Pilates, expect controlled floor exercises. Wear comfortable clothing and bring water. Check whether a mat is provided.',
          },
        ],
      },
    },
  ],
};
const fetchMock = vi.fn<typeof fetch>();
const service = new BookingEmailService();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
  vi.stubEnv('GEMINI_MODEL', 'gemini-3.5-flash-lite');
  vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
  vi.stubEnv('EMAIL_FROM', 'The Movement Club <onboarding@resend.dev>');
  vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('emails the AI message and exact session details to the booking address', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(generated))
    .mockResolvedValueOnce(Response.json({ id: 'email-id' }));
  expect(await service.send(booking)).toMatchObject({ emailStatus: 'sent' });
  const aiBody = fetchMock.mock.calls[0][1]?.body as string;
  expect(aiBody).not.toContain(booking.name);
  expect(aiBody).not.toContain(booking.email);
  const email = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
  expect(email.to).toEqual([booking.email]);
  expect(email.text).toContain(generated.candidates[0].content.parts[0].text);
  expect(email.text).toContain('Mat Pilates with Sofia');
  expect(email.text).toContain('10:00 (Vienna time)');
  expect(email.text).toContain('45 minutes');
  expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
    'Idempotency-Key': 'booking-confirmation-42',
  });
});

it('returns an AI message for the browser even when email is not configured', async () => {
  vi.stubEnv('RESEND_API_KEY', '');
  fetchMock.mockResolvedValueOnce(Response.json(generated));
  expect(await service.send(booking)).toMatchObject({
    emailStatus: 'disabled',
    aiGenerated: true,
    message: generated.candidates[0].content.parts[0].text,
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('sends a standard email when Gemini is not configured', async () => {
  vi.stubEnv('GEMINI_API_KEY', '');
  fetchMock.mockResolvedValueOnce(Response.json({ id: 'email-id' }));
  expect(await service.send(booking)).toMatchObject({ emailStatus: 'sent' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][1]?.body as string).toContain(
    'For your Mat Pilates session:',
  );
});

it.each([
  new Response(null, { status: 429 }),
  Response.json({ candidates: [] }),
  Response.json({ candidates: [{ finishReason: 'MAX_TOKENS' }] }),
])(
  'falls back when Gemini rejects or returns incomplete content',
  async (aiResponse) => {
    fetchMock
      .mockResolvedValueOnce(aiResponse)
      .mockResolvedValueOnce(Response.json({ id: 'email-id' }));
    expect(await service.send(booking)).toMatchObject({ emailStatus: 'sent' });
    expect(fetchMock.mock.calls[1][1]?.body as string).toContain(
      'For your Mat Pilates session:',
    );
  },
);

it('falls back on AI timeout and reports email failure without throwing', async () => {
  fetchMock
    .mockRejectedValueOnce(new Error('timeout'))
    .mockResolvedValueOnce(new Response(null, { status: 403 }));
  expect(await service.send(booking)).toMatchObject({ emailStatus: 'failed' });
});

it('keeps a successful booking when both providers fail', async () => {
  const create = vi.fn().mockResolvedValue(booking);
  const prisma = { booking: { create } } as unknown as PrismaService;
  fetchMock.mockImplementation(async () => {
    expect(create).toHaveBeenCalledTimes(1);
    throw new Error('Provider unavailable');
  });
  expect(
    await new SessionsService(prisma, service).book(7, {
      name: booking.name,
      email: booking.email,
    }),
  ).toMatchObject({ id: 42, emailStatus: 'failed' });
});

it('does not call either provider for a double-booking conflict', async () => {
  const create = vi.fn().mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError('Conflict', {
      code: 'P2002',
      clientVersion: 'test',
    }),
  );
  const prisma = { booking: { create } } as unknown as PrismaService;
  await expect(
    new SessionsService(prisma, service).book(7, {
      name: booking.name,
      email: booking.email,
    }),
  ).rejects.toMatchObject({ status: 409 });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('returns the generated message even when email is rejected', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(generated))
    .mockResolvedValueOnce(new Response(null, { status: 403 }));
  expect(await service.send(booking)).toMatchObject({
    emailStatus: 'failed',
    aiGenerated: true,
    message: generated.candidates[0].content.parts[0].text,
  });
});

it('returns a clearly identified standard message without configured providers', async () => {
  vi.stubEnv('GEMINI_API_KEY', '');
  vi.stubEnv('RESEND_API_KEY', '');
  expect(await service.send(booking)).toMatchObject({
    emailStatus: 'disabled',
    aiGenerated: false,
    message: expect.stringContaining('For your Mat Pilates session:'),
  });
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([
  ['Reformer Pilates', 'grip socks'],
  ['Mat Pilates', 'floor exercises'],
  ['Vinyasa Yoga', 'flowing transitions'],
  ['Hatha Yoga', 'slower practice'],
])(
  'provides class-specific preparation and what to bring without AI: %s',
  async (classType, detail) => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('RESEND_API_KEY', '');
    const result = await service.send({
      ...booking,
      session: { ...booking.session, classType },
    });
    expect(result.aiGenerated).toBe(false);
    expect(result.message).toContain(classType);
    expect(result.message.toLowerCase()).toContain(detail);
    expect(result.message).toContain('bring water');
  },
);
