import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/database';
import { DynamicModuleUtils } from '@libs/common';
import { MxProxyService } from './proxy';
import { DexService } from './dex';
import { ExampleService } from './example';

@Global()
@Module({
  imports: [DatabaseModule, DynamicModuleUtils.getCachingModule()],
  providers: [MxProxyService, DexService, ExampleService],
  exports: [MxProxyService, DexService, ExampleService],
})
export class ServicesModule {}
