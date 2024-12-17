import { createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export declare class UserAuthResult {
  constructor(result?: Partial<UserAuthResult>);
  issued: number;
  expires: number;
  address: string;
  host: string;
  extraInfo?: any;
}

export const AuthUser = createParamDecorator(
  (key, req): UserAuthResult | undefined => {
    let authUser: UserAuthResult = req.args[0]?.auth;
    if (!authUser) {
      const ctx = GqlExecutionContext.create(req);
      authUser = ctx.getContext().req?.auth;
    }

    if (!authUser) {
      return undefined;
    }

    if (key === undefined) {
      return authUser;
    }

    return authUser[key as keyof UserAuthResult];
  },
);
