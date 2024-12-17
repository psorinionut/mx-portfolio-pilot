import { Locker } from '@multiversx/sdk-nestjs-common';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class StrategyMaintainerService {
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExampleInvalidations() {
    await Locker.lock(
      'Example invalidations',
      async () => {
        await Promise.resolve(true);
      },
      true,
    );
  }
}
