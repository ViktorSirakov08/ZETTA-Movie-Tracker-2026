import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  type ThrottlerLimitDetail,
} from '@nestjs/throttler';

// The default ThrottlerException message ("ThrottlerException: Too Many
// Requests") is an internal-sounding string, not something to show a real
// user — this swaps it for a friendlier one everywhere throttling triggers.
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException(
      'Too many attempts. Please wait a minute and try again.',
    );
  }
}