import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SearchService } from './search.service';

@Module({
    imports: [
        ElasticsearchModule.register({
            node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
        }),
    ],
    providers: [SearchService],
    exports: [SearchService],
})
export class SearchModule { }