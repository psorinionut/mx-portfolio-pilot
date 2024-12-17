import { Module } from '@nestjs/common';
import { SmartAccountPositionsResolver } from './smart.account.resolver';
import { ServicesModule } from '@libs/services';
import { SmartAccountUserService } from '@libs/services/smart-account';
import { DynamicModuleUtils } from '@libs/common';

@Module({
  imports: [ServicesModule, DynamicModuleUtils.getCachingModule()],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
    SmartAccountPositionsResolver,
    SmartAccountUserService,
  ],
})
export class SmartAccountModule {}
