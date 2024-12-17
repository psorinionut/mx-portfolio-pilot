import { AuthUser, UserAuthResult } from '@libs/services/auth';
import { JwtOrNativeAuthGuard } from '@libs/services/auth/jwt.or.native.auth.guard';
import { SmartAccountPositionsUnion } from '@libs/services/smart-account/models/smart.account.position.model';
import { SmartAccountUserService } from '@libs/services/smart-account/smart.account.user.service';
import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class SmartAccountPositionsResolver {
  constructor(private readonly smartAccountUser: SmartAccountUserService) {}

  @UseGuards(JwtOrNativeAuthGuard)
  @Query(() => [SmartAccountPositionsUnion])
  async userPositions(
    @AuthUser() user: UserAuthResult,
  ): Promise<Array<typeof SmartAccountPositionsUnion>> {
    return await this.smartAccountUser.userPositions(user.address);
  }
}
