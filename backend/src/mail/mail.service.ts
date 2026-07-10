import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'node:net';
import * as tls from 'node:tls';

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your Movie Tracker password',
      text: [
        'We received a request to reset your Movie Tracker password.',
        '',
        `Open this link to create a new password: ${resetUrl}`,
        '',
        'This link expires in 1 hour. If you did not request it, ignore this email.',
      ].join('\n'),
      html: [
        '<p>We received a request to reset your Movie Tracker password.</p>',
        `<p><a href="${this.escapeHtml(resetUrl)}">Reset your password</a></p>`,
        '<p>This link expires in 1 hour. If you did not request it, ignore this email.</p>',
      ].join(''),
    });
  }

  async sendVerificationEmail(
    to: string,
    verificationUrl: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: 'Verify your Movie Tracker email',
      text: [
        'Welcome to Movie Tracker.',
        '',
        `Open this link to verify your email address: ${verificationUrl}`,
        '',
        'This link expires in 24 hours.',
      ].join('\n'),
      html: [
        '<p>Welcome to Movie Tracker.</p>',
        `<p><a href="${this.escapeHtml(verificationUrl)}">Verify your email address</a></p>`,
        '<p>This link expires in 24 hours.</p>',
      ].join(''),
    });
  }

  async sendMediaReleasedEmail(
    to: string,
    mediaName: string,
    mediaUrl: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: `${mediaName} is released today`,
      text: [
        `${mediaName} is released today in the Europe/Sofia release timezone.`,
        '',
        'You added it to your watchlist. You can watch it now.',
        'If you are in a different timezone, playback may become available a few hours later in your local time.',
        '',
        `Open it here: ${mediaUrl}`,
      ].join('\n'),
      html: [
        `<p><strong>${this.escapeHtml(mediaName)}</strong> is released today in the Europe/Sofia release timezone.</p>`,
        '<p>You added it to your watchlist. You can watch it now.</p>',
        '<p>If you are in a different timezone, playback may become available a few hours later in your local time.</p>',
        `<p><a href="${this.escapeHtml(mediaUrl)}">Open in Movie Tracker</a></p>`,
      ].join(''),
    });
  }

  private async send(message: MailMessage): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    const from = this.configService.get<string>(
      'EMAIL_FROM',
      'Movie Tracker <no-reply@movie-tracker.local>',
    );

    if (!host) {
      this.logger.warn(
        `SMTP_HOST is not configured. Dev email to ${message.to}: ${message.subject}\n${message.text}`,
      );
      return;
    }

    try {
      await this.sendSmtp(host, from, message);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${message.to}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private async sendSmtp(
    host: string,
    from: string,
    message: MailMessage,
  ): Promise<void> {
    const port = Number(this.configService.get<string>('SMTP_PORT', '1025'));
    const secure =
      this.configService.get<string>('SMTP_SECURE', 'false') === 'true';
    const username = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const fromAddress = this.extractAddress(from);

    const socket = secure ? tls.connect(port, host) : net.connect(port, host);
    socket.setEncoding('utf8');

    let buffer = '';
    const pending: Array<(line: string) => void> = [];

    socket.on('data', (chunk: string) => {
      buffer += chunk;

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex + 1);
        buffer = buffer.slice(newlineIndex + 1);

        // Multi-line SMTP replies mark continuation lines with "250-" and
        // the final line with "250 " (space). Real servers split EHLO's
        // capability list across several lines; resolving on the first one
        // would desync every command that follows.
        if (/^\d{3}-/.test(line)) continue;

        const resolve = pending.shift();
        if (resolve) resolve(line);
      }
    });

    const read = () =>
      new Promise<string>((resolve, reject) => {
        const onError = (error: Error) => {
          socket.off('error', onError);
          reject(error);
        };
        socket.once('error', onError);
        pending.push((line) => {
          socket.off('error', onError);
          resolve(line);
        });
      });

    const write = async (command: string, expectedPrefix: string) => {
      socket.write(`${command}\r\n`);
      const response = await read();
      if (!response.startsWith(expectedPrefix)) {
        throw new Error(
          `SMTP command failed: ${command} -> ${response.trim()}`,
        );
      }
    };

    await read();
    await write('EHLO movie-tracker.local', '250');

    if (username && password) {
      await write('AUTH LOGIN', '334');
      await write(Buffer.from(username).toString('base64'), '334');
      await write(Buffer.from(password).toString('base64'), '235');
    }

    await write(`MAIL FROM:<${fromAddress}>`, '250');
    await write(`RCPT TO:<${message.to}>`, '250');
    await write('DATA', '354');

    socket.write(this.buildMessage(from, message));
    const dataResponse = await read();
    if (!dataResponse.startsWith('250')) {
      throw new Error(`SMTP DATA failed: ${dataResponse.trim()}`);
    }

    socket.write('QUIT\r\n');
    socket.end();
  }

  private buildMessage(from: string, message: MailMessage): string {
    const body = message.text.replace(/^\./gm, '..').replace(/\n/g, '\r\n');

    return [
      `From: ${from}`,
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      message.html
        ? 'Content-Type: text/html; charset=utf-8'
        : 'Content-Type: text/plain; charset=utf-8',
      '',
      message.html ?? body,
      '.',
      '',
    ].join('\r\n');
  }

  private extractAddress(value: string): string {
    return value.match(/<([^>]+)>/)?.[1] ?? value;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
