import { SmartAccountFactoryModel } from '@libs/services/smart-account-factory/models/smart.account.factory.model';
import { Query, Resolver } from '@nestjs/graphql';

@Resolver(() => SmartAccountFactoryModel)
export class SmartAccountFactoryResolver {
  @Query(() => SmartAccountFactoryModel)
  async factory() {
    return await Promise.resolve(
      new SmartAccountFactoryModel({
        address: 'test',
      }),
    );
  }
}
