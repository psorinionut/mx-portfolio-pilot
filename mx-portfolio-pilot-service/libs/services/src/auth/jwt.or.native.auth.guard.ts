import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { Logger } from 'winston';
import { NativeAuthGuard } from './native.auth.guard';
import { GqlAuthGuard } from './gql.auth.guard';
import { CommonConfigService } from '@libs/common';

@Injectable()
export class JwtOrNativeAuthGuard implements CanActivate {
  constructor(
    private readonly apiConfigService: CommonConfigService,
    private readonly cachingService: CacheService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtGuard = new GqlAuthGuard();
    const nativeAuthGuard = new NativeAuthGuard(
      this.apiConfigService,
      this.cachingService,
      this.logger,
    );

    const guards = [jwtGuard, nativeAuthGuard];

    const canActivateResponses = await Promise.all(
      guards.map((guard) => {
        try {
          return guard.canActivate(context);
        } catch (error: any) {
          this.logger.warn(`${JwtOrNativeAuthGuard.name}: ${error.message}`);
          return false;
        }
      }),
    );

    const canActivate = canActivateResponses.reduce(
      (result, value) => result || value,
      false,
    );
    return canActivate;
  }
}
