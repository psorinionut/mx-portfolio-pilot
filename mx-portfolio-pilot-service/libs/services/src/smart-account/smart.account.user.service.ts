import { Injectable } from '@nestjs/common';
// import { SmartAccountAbiService } from './smart.account.abi.service';
import {
  EsdtPositionModel,
  FarmPositionModel,
  LpPositionModel,
  SmartAccountPositionsUnion,
  StakingPositionModel,
} from './models/smart.account.position.model';
import { EsdtToken } from './models/esdt.token.model';

@Injectable()
export class SmartAccountUserService {
  // constructor(private readonly pilotAbi: SmartAccountAbiService) {}

  async userPositions(
    address: string,
  ): Promise<Array<typeof SmartAccountPositionsUnion>> {
    console.log(`TODO query sc with address ${address}`);

    return await Promise.resolve([
      new LpPositionModel({
        address:
          'erd1qqqqqqqqqqqqqpgqzw0d0tj25qme9e4ukverjjjqle6xamay0n4s5r0v9g',
        firstToken: new EsdtToken({
          identifier: 'WEGLD-a28c59',
          ticker: 'WEGLD',
          svgIcon:
            'https://tools.multiversx.com/assets-cdn/devnet/tokens/WEGLD-a28c59/icon.svg',
        }),
        secondToken: new EsdtToken({
          identifier: 'MEX-a659d0',
          ticker: 'MEX',
          svgIcon:
            'https://tools.multiversx.com/assets-cdn/devnet/tokens/MEX-a659d0/icon.svg',
        }),
        amount: '123',
        valueUSD: '42.069',
      }),
      new FarmPositionModel({
        address:
          'erd1qqqqqqqqqqqqqpgqtukp628k04vg93peq8k3ngrh0k2rs3nm0n4sjkcz95',
        firstToken: new EsdtToken({
          identifier: 'WEGLD-a28c59',
          ticker: 'WEGLD',
          svgIcon:
            'https://tools.multiversx.com/assets-cdn/devnet/tokens/WEGLD-a28c59/icon.svg',
        }),
        secondToken: new EsdtToken({
          identifier: 'USDC-350c4e',
          ticker: 'USDC',
          svgIcon:
            'https://tools.multiversx.com/assets-cdn/devnet/tokens/USDC-350c4e/icon.svg',
        }),
        amount: '531254400',
        valueUSD: '422.76',
      }),
      new StakingPositionModel({
        address:
          'erd1qqqqqqqqqqqqqpgqjepe36adjtqu0plg6w7mf8yywegl0g3q0n4svr28gf',
        token: new EsdtToken({
          identifier: 'UTK-14d57d',
          ticker: 'UTK',
          name: 'xMoney UTK',
          svgIcon:
            'https://tools.multiversx.com/assets-cdn/devnet/tokens/UTK-14d57d/icon.svg',
        }),
        amount: '2311004',
        valueUSD: '1345.76',
      }),
      new EsdtPositionModel({
        amount: '564000',
        valueUSD: '35.21',
        token: new EsdtToken({
          identifier: 'HTM-23a1da',
          ticker: 'HTM',
          name: 'Hatom',
          svgIcon:
            'https://tools.multiversx.com/assets-cdn/devnet/tokens/HTM-23a1da/icon.svg',
        }),
      }),
    ]);
  }
}
