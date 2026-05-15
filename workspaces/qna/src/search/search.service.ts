import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import * as Es from '@nestjs/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly index = 'topics';
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(Es.ElasticsearchService)
    private readonly elasticsearchService: Es.ElasticsearchService,
  ) {}

  async onModuleInit() {
    await this.ensureIndex();
  }

  private async ensureIndex() {
    try {
      const exists = await this.elasticsearchService.indices.exists({
        index: this.index,
      });
      if (!exists) {
        await this.elasticsearchService.indices.create({
          index: this.index,
          mappings: {
            properties: {
              title: { type: 'text' },
              body: { type: 'text' },
              substack_id: { type: 'keyword' },
              created_at: { type: 'date' },
            },
          },
        });
      } else {
        await this.elasticsearchService.indices.putMapping({
          index: this.index,
          properties: {
            title: { type: 'text' },
            body: { type: 'text' },
            substack_id: { type: 'keyword' },
            created_at: { type: 'date' },
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to ensure '${this.index}' index: ${err?.message || err}`,
      );
    }
  }

  async indexTopic(topic: any) {
    try {
      await this.elasticsearchService.index({
        index: this.index,
        id: topic._id.toString(),
        document: {
          title: topic.title,
          body: topic.body,
          substack_id: topic.substack_id || null,
          created_at: topic.get ? topic.get('created_at') : topic.created_at,
        },
      });
    } catch (err: any) {
      this.logger.warn(`indexTopic failed: ${err?.message || err}`);
    }
  }

  async updateTopic(topic: any) {
    try {
      await this.elasticsearchService.update({
        index: this.index,
        id: topic._id.toString(),
        doc: {
          title: topic.title,
          body: topic.body,
          substack_id: topic.substack_id || null,
          created_at: topic.get ? topic.get('created_at') : topic.created_at,
        },
      });
    } catch (err: any) {
      this.logger.warn(`updateTopic failed: ${err?.message || err}`);
    }
  }

  async deleteTopic(topicId: string) {
    try {
      await this.elasticsearchService.delete({
        index: this.index,
        id: topicId,
      });
    } catch (err: any) {
      if (err?.meta?.statusCode !== 404) {
        this.logger.warn(`deleteTopic failed: ${err?.message || err}`);
      }
    }
  }

  async searchTopics(
    query: string,
    page: number,
    limit: number,
    substackId?: string,
  ) {
    const from = (page - 1) * limit;

    const must: any[] = [];
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'body'],
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    try {
      const result = await this.elasticsearchService.search({
        index: this.index,
        from,
        size: limit,
        query: {
          bool: {
            must,
            filter: substackId
              ? [
                  {
                    term: {
                      substack_id: substackId,
                    },
                  },
                ]
              : [],
          },
        },
        sort: query ? undefined : [{ created_at: { order: 'desc' } }],
      });

      const hits = result.hits.hits;

      return {
        ids: hits.map((hit) => hit._id),
        total:
          typeof result.hits.total === 'number'
            ? result.hits.total
            : result.hits.total?.value || 0,
      };
    } catch (err: any) {
      if (err?.meta?.body?.error?.type === 'index_not_found_exception') {
        await this.ensureIndex();
        return { ids: [], total: 0 };
      }
      this.logger.warn(`searchTopics failed: ${err?.message || err}`);
      return { ids: [], total: 0 };
    }
  }
}
