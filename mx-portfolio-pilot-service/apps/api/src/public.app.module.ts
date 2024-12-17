import { Module } from '@nestjs/common';
import { EndpointsModule } from './endpoints/endpoints.module';
import { DynamicModuleUtils } from '@libs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { CommonConfigModule } from '@libs/common/config/common.config.module';
import { AppConfigModule } from './config/app-config.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLFormattedError } from 'graphql';
import { GraphModule } from './graph/graph.module';

@Module({
  imports: [
    LoggingModule,
    EndpointsModule,
    AppConfigModule,
    CommonConfigModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      // imports: [CommonAppModule],
      useFactory: () => ({
        // useFactory: (logger: LoggerService) => ({
        autoSchemaFile: 'schema.gql',
        formatError: (
          formattedError: GraphQLFormattedError,
          error: any,
        ): GraphQLFormattedError => {
          const errorStatus = formattedError.extensions?.code;
          switch (errorStatus) {
            case 'FORBIDDEN':
              // logger.log(error.message, 'GraphQLModule');
              console.log(error.message);
              break;
          }

          return {
            message: formattedError.message,
            path: formattedError.path,
            extensions: {
              code: errorStatus,
            },
          };
        },
        fieldResolverEnhancers: ['guards'],
      }),
      // inject: [WINSTON_MODULE_NEST_PROVIDER],
    }),
    GraphModule,
  ],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
})
export class PublicAppModule {}
