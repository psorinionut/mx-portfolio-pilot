import {
  createUnionType,
  Field,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { EsdtToken } from './esdt.token.model';

export enum PositionType {
  ESDT = 'esdtToken',
  LP = 'liquidityPool',
  FARM = 'farm',
  STAKING = 'staking',
}

registerEnumType(PositionType, { name: 'PositionType' });

@ObjectType()
export class LpPositionModel {
  @Field({ nullable: true })
  address?: string;

  @Field(() => EsdtToken)
  firstToken!: EsdtToken;

  @Field(() => EsdtToken)
  secondToken!: EsdtToken;

  @Field()
  amount!: string;

  @Field()
  valueUSD!: string;

  constructor(init?: Partial<LpPositionModel>) {
    Object.assign(this, init);
  }
}

@ObjectType()
export class FarmPositionModel {
  @Field({ nullable: true })
  address?: string;

  @Field(() => EsdtToken)
  firstToken!: EsdtToken;

  @Field(() => EsdtToken)
  secondToken!: EsdtToken;

  @Field()
  amount!: string;

  @Field()
  valueUSD!: string;

  constructor(init?: Partial<FarmPositionModel>) {
    Object.assign(this, init);
  }
}

@ObjectType()
export class StakingPositionModel {
  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  token?: EsdtToken;

  @Field()
  amount!: string;

  @Field()
  valueUSD!: string;

  constructor(init?: Partial<StakingPositionModel>) {
    Object.assign(this, init);
  }
}

@ObjectType()
export class EsdtPositionModel {
  @Field({ nullable: true })
  token?: EsdtToken;

  @Field()
  amount!: string;

  @Field()
  valueUSD!: string;

  constructor(init?: Partial<EsdtPositionModel>) {
    Object.assign(this, init);
  }
}

export const SmartAccountPositionsUnion = createUnionType({
  name: 'SmartAccountPositionsUnion',
  types: () =>
    [
      LpPositionModel,
      FarmPositionModel,
      StakingPositionModel,
      EsdtPositionModel,
    ] as const,
  resolveType(position) {
    switch (position.constructor.name) {
      case LpPositionModel.name:
        return LpPositionModel.name;
      case FarmPositionModel.name:
        return FarmPositionModel.name;
      case StakingPositionModel.name:
        return StakingPositionModel.name;
      case EsdtPositionModel.name:
        return EsdtPositionModel.name;
      default:
        return LpPositionModel.name;
    }
  },
});
