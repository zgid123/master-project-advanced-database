import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
    private readonly index = 'topics';

    constructor(
        private readonly elasticsearchService: ElasticsearchService,
    ) { }

    async indexTopic(topic: any) {
        await this.elasticsearchService.index({
            index: this.index,
            id: topic._id.toString(),
            document: {
                title: topic.title,
                body: topic.body,
                substack_id: topic.substack_id || null,
            },
        });
    }

    async updateTopic(topic: any) {
        await this.elasticsearchService.update({
            index: this.index,
            id: topic._id.toString(),
            doc: {
                title: topic.title,
                body: topic.body,
                substack_id: topic.substack_id || null,
            },
        });
    }

    async deleteTopic(topicId: string) {
        await this.elasticsearchService.delete({
            index: this.index,
            id: topicId,
        });
    }

    async searchTopics(query: string, page: number, limit: number, substack_id?: string) {
        const from = (page - 1) * limit;

        const result = await this.elasticsearchService.search({
            index: this.index,
            from,
            size: limit,
            query: {
                bool: {
                    must: [
                        {
                            multi_match: {
                                query,
                                fields: ['title^3', 'body'],
                                fuzziness: 'AUTO',
                            },
                        },
                    ],
                    filter: substack_id
                        ? [
                            {
                                term: {
                                    substack_id,
                                },
                            },
                        ]
                        : [
                            {
                                bool: {
                                    must_not: {
                                        exists: {
                                            field: 'substack_id',
                                        },
                                    },
                                },
                            },
                        ],
                },
            },
        });

        const hits = result.hits.hits;

        return {
            ids: hits.map(hit => hit._id),
            total:
                typeof result.hits.total === 'number'
                    ? result.hits.total
                    : result.hits.total?.value || 0,
        };
    }
}