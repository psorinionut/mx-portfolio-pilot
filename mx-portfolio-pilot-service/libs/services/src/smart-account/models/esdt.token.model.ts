import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EsdtToken {
  @Field() identifier!: string;
  @Field() name!: string;
  @Field() ticker!: string;
  @Field() decimals!: number;
  @Field() svgIcon!: string;
  @Field({ nullable: true }) price?: string;
  @Field({ nullable: true }) supply?: string;
  @Field({ nullable: true }) circulatingSupply?: string;
  @Field({ nullable: true }) type?: string;

  constructor(init?: Partial<EsdtToken>) {
    Object.assign(this, init);
  }
}
