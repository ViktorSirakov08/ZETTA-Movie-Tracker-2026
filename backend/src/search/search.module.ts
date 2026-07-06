import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MediaSearchService } from './media-search.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node: configService.getOrThrow<string>('ELASTICSEARCH_NODE'),
      }),
    }),
  ],
  providers: [MediaSearchService],
  exports: [MediaSearchService],
})
export class SearchModule {}
