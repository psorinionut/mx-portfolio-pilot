import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SmartAccountFactoryModel {
  @Field()
  address!: string;

  constructor(init?: Partial<SmartAccountFactoryModel>) {
    Object.assign(this, init);
  }
}
