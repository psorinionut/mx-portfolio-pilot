import { Example } from '@libs/entities';
import { ExampleService } from '@libs/services';
import { DexService } from '@libs/services/dex';
import {
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('example')
export class ExampleController {
  constructor(
    private readonly exampleService: ExampleService,
    private readonly dexService: DexService,
  ) {}

  @Get('/examples')
  @ApiResponse({
    status: 200,
    description: 'Returns a list of examples',
    type: Example,
    isArray: true,
  })
  @ApiQuery({
    name: 'from',
    description: 'Number of items to skip for the result set',
    required: false,
  })
  @ApiQuery({
    name: 'size',
    description: 'Number of items to retrieve',
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search by example description',
    required: false,
  })
  async getExamples(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
  ): Promise<Example[]> {
    return await this.exampleService.getExamples({ from, size }, { search });
  }

  @Get('/examples/:id')
  @ApiResponse({
    status: 200,
    description: 'Returns one example',
    type: Example,
  })
  async getExample(@Param('id') id: string): Promise<Example> {
    const result = await this.exampleService.getExample(id);
    if (!result) {
      throw new NotFoundException('Example not found');
    }

    return result;
  }

  @Get('/test-dex')
  async testDex() {
    const addresses = [
      'erd1qqqqqqqqqqqqqpgqzw0d0tj25qme9e4ukverjjjqle6xamay0n4s5r0v9g',
      'erd1qqqqqqqqqqqqqpgqtqfhy99su9xzjjrq59kpzpp25udtc9eq0n4sr90ax6',
      'erd1qqqqqqqqqqqqqpgqpvfd0cuspuewm9z9p6lcmp66ylqg4js30n4sj2rjwh',
    ];

    const result = await this.dexService.getPairsRaw(addresses);

    return result;
  }
}
