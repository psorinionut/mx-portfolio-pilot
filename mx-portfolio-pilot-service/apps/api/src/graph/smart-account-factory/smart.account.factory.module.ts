import { SmartAccountFactoryResolver } from '@libs/services/smart-account-factory';
import { Module } from '@nestjs/common';

@Module({
  providers: [SmartAccountFactoryResolver],
})
export class SmartAccountFactoryModule {}
