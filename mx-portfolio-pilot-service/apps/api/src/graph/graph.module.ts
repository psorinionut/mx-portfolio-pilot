import { Module } from '@nestjs/common';
import { SmartAccountFactoryModule } from './smart-account-factory/smart.account.factory.module';
import { SmartAccountModule } from './smart-account/smart.account.module';

@Module({
  imports: [SmartAccountFactoryModule, SmartAccountModule],
})
export class GraphModule {}
