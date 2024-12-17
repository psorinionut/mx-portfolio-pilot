import { Module } from '@nestjs/common';
import { DynamicModuleUtils } from '@libs/common';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
})
export class EndpointsModule {}
