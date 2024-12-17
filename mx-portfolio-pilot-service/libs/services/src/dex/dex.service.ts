import { CommonConfigService } from '@libs/common';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class DexService {
  constructor(
    private readonly configService: CommonConfigService, // @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private async fetchGraphQL(query: string, variables?: Record<string, any>) {
    const response = await fetch(this.configService.config.urls.dexApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new HttpException(
        `GraphQL network error: ${response.statusText} - ${text}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      const messages = result.errors.map((err: any) => err.message).join(', ');
      throw new HttpException(
        `GraphQL error(s): ${messages}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.data;
  }

  async getPairsRaw(addresses: string[]) {
    const PAIRS_QUERY = `
    query PairsForPilot ($filters: PairsFilter) {
      filteredPairs (filters: $filters) {
        edges {
          node {
            address
            firstToken { identifier }
            firstTokenPriceUSD
            secondToken { identifier }
            secondTokenPriceUSD
            liquidityPoolToken { identifier }
            feesUSD24h
            lockedValueUSD
            feesAPR
          }
        }
      }
    }
    `;

    const variables = {
      filters: {
        addresses,
      },
    };

    const response = await this.fetchGraphQL(PAIRS_QUERY, variables);

    const pairs = response.filteredPairs.edges?.map(
      (pairEdge: { node: any }) => pairEdge.node,
    );

    return pairs;
  }

  async getFarmsRaw(addresses: string[]) {
    const FARMS_QUERY = `
    query FarmsForPilot ($filters: FarmsFilter) {
      ... on FarmModelV2 {
        address
      }
    }
    `;

    const variables = {
      filters: {
        versions: ['v2'],
        addresses,
      },
    };

    const response = await this.fetchGraphQL(FARMS_QUERY, variables);

    return response;
  }
}
