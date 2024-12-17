import { NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { UrlUtils } from '@multiversx/sdk-nestjs-common';
import { Logger } from 'winston';
import { CommonConfigService } from '@libs/common';

@Injectable()
export class NativeAuthGuard implements CanActivate {
  private readonly authServer: NativeAuthServer;
  private impersonateAddress: string | undefined;

  constructor(
    private readonly configService: CommonConfigService,
    private readonly cachingService: CacheService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.authServer = new NativeAuthServer({
      apiUrl: this.configService.config.urls.api,
      maxExpirySeconds: this.configService.config.nativeAuth.maxExpirySeconds,
      acceptedOrigins: this.configService.config.nativeAuth.acceptedOrigins,
      validateImpersonateUrl:
        this.configService.config.nativeAuth.impersonateUrl,
      cache: {
        getValue: async <T>(key: string): Promise<T | undefined> => {
          if (key === 'block:timestamp:latest') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new Date().getTime() / 1000;
          }
          return await this.cachingService.get<T>(key);
        },
        setValue: async <T>(
          key: string,
          value: T,
          ttl: number,
        ): Promise<void> => {
          await this.cachingService.set(key, value, ttl);
        },
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    if (req.headers !== undefined) {
      this.impersonateAddress = req.headers['impersonate-address'];
    }

    const authorization: string = req.headers['authorization'];
    const origin = req.headers['origin'];
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const jwt = authorization.replace('Bearer ', '');
    try {
      const userInfo = await this.authServer.validate(jwt);
      if (
        !UrlUtils.isLocalhost(origin) &&
        origin !== userInfo.origin &&
        origin !== 'https://' + userInfo.origin
      ) {
        this.logger.info('Unhandled auth origin: ', {
          origin,
          userInfo,
        });
        // TO DO:  throw new NativeAuthInvalidOriginError(userInfo.origin, origin);
      }

      req.res.set('X-Native-Auth-Issued', userInfo.issued);
      req.res.set('X-Native-Auth-Expires', userInfo.expires);
      req.res.set('X-Native-Auth-Address', userInfo.address);
      req.res.set(
        'X-Native-Auth-Timestamp',
        Math.round(new Date().getTime() / 1000),
      );
      req.auth = userInfo;
      req.jwt = userInfo;

      if (this.impersonateAddress) {
        const admins = this.configService.config.security.admins;
        if (admins.find((admin) => admin === userInfo.signerAddress)) {
          req.res.set('X-Native-Auth-Address', this.impersonateAddress);
          req.auth.address = this.impersonateAddress;
        }
      }

      return true;
    } catch (error: any) {
      this.logger.error(`${NativeAuthGuard.name}: ${error.message}`);
      return false;
    }
  }
}
