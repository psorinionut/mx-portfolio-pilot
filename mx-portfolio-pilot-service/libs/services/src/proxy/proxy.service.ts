import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { promises } from 'fs';
import {
  AbiRegistry,
  ProxyNetworkProvider,
  QueryRunnerAdapter,
  SmartContractQueriesController,
} from '@multiversx/sdk-core/out';
import { CommonConfigService } from '@libs/common';
import BigNumber from 'bignumber.js';

enum LogType {
  GET = 'get',
  SET = 'set',
  DELETE = 'delete',
  COMPUTE = 'compute',
  RUN_QUERY = 'runQuery',
}

export const generateLogMessage = (
  className: string,
  methodName: string,
  messageKey: string,
  error: any,
  logType?: LogType,
) => {
  const path = `${className}.${methodName}`;
  const message = logType
    ? `An error occurred while ${logType} ${messageKey}`
    : `An error occurred while ${messageKey}`;
  return {
    message,
    path,
    error,
  };
};

export const generateGetLogMessage = (
  className: string,
  methodName: string,
  messageKey: string,
  error: any,
) => {
  return generateLogMessage(
    className,
    methodName,
    messageKey,
    error,
    LogType.GET,
  );
};

export const generateRunQueryLogMessage = (
  className: string,
  methodName: string,
  error: any,
) => {
  return generateLogMessage(
    className,
    methodName,
    '',
    error,
    LogType.RUN_QUERY,
  );
};

@Injectable()
export class MxProxyService {
  private readonly proxy: ProxyNetworkProvider;
  private readonly queryRunner: QueryRunnerAdapter;

  constructor(
    private readonly configService: CommonConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.proxy = new ProxyNetworkProvider(this.configService.config.urls.api, {
      clientName: 'portfolio-pilot-api',
    });

    this.queryRunner = new QueryRunnerAdapter({
      networkProvider: this.proxy,
    });
  }

  getService(): ProxyNetworkProvider {
    return this.proxy;
  }

  async getGenericData(
    contractInterface: string,
    contractAddress: string,
    method: string,
    args: any[],
  ): Promise<any[]> {
    try {
      const controller = await this.getSmartContract(contractInterface);

      const query = controller.createQuery({
        contract: contractAddress,
        arguments: args,
        function: method,
      });
      const response = await controller.runQuery(query);

      return controller.parseQueryResponse(response);
    } catch (error: any) {
      const logMessage = generateRunQueryLogMessage(
        MxProxyService.name,
        method,
        error.message,
      );
      this.logger.error(logMessage);

      throw error;
    }
  }

  async getSmartContract(
    contractInterface: string,
  ): Promise<SmartContractQueriesController> {
    const contractAbiPath = `./abi/${contractInterface}.abi.json`;
    const jsonContent: string = await promises.readFile(contractAbiPath, {
      encoding: 'utf8',
    });
    const json = JSON.parse(jsonContent);
    const abi = await AbiRegistry.create(json);

    return new SmartContractQueriesController({
      queryRunner: this.queryRunner,
      abi: abi,
    });
  }

  async getChainSpecificToUniversalMapping(
    chainSpecificTokenId: string,
  ): Promise<string> {
    const response = await this.getGenericData(
      'BridgedTokensWrapper',
      'erd1qqqqqqqqqqqqqpgq305jfaqrdxpzjgf9y5gvzh60mergh866yfkqzqjv2h',
      'getChainSpecificToUniversalMapping',
      [chainSpecificTokenId],
    );
    return response.first();
  }

  async getTokenLiquidity(tokenId: string): Promise<BigNumber> {
    const response = await this.getGenericData(
      'BridgedTokensWrapper',
      'erd1qqqqqqqqqqqqqpgq305jfaqrdxpzjgf9y5gvzh60mergh866yfkqzqjv2h',
      'getTokenLiquidity',
      [tokenId],
    );
    return response.first();
  }

  async getChainSpecificTokenIds(universalTokenId: string): Promise<string[]> {
    const response = await this.getGenericData(
      'BridgedTokensWrapper',
      'erd1qqqqqqqqqqqqqpgq305jfaqrdxpzjgf9y5gvzh60mergh866yfkqzqjv2h',
      'getchainSpecificTokenIds',
      [universalTokenId],
    );
    return response.flat();
  }

  async getErc20AddressForTokenId(tokenId: string): Promise<string> {
    const eth_multisig =
      'erd1qqqqqqqqqqqqqpgq3n2w97lwdcppghqzkavn9v39ttuhk5yye3yqq0hlcr';
    const bsc_multisig =
      'erd1qqqqqqqqqqqqqpgqyvf9z7ptk6p6yuukea58n0uqzx7x5k9me3yqem7dds';
    const contract = tokenId.startsWith('ETH') ? eth_multisig : bsc_multisig;
    const response = await this.getGenericData(
      'Multisig',
      contract,
      'getErc20AddressForTokenId',
      [tokenId],
    );
    const ethAddress = this.array20ToHex(response[0].raw_addr);
    return ethAddress;
  }

  array20ToHex(array20: any[]) {
    const padHex = (param: any) => {
      let hexString = param.toString(16);
      if (hexString.length % 2 !== 0) hexString = `0${hexString}`;
      return hexString;
    };
    return array20.reduce(
      (prev: any, current: any) => `${prev}${padHex(current)}`,
      '0x',
    );
  }
}
