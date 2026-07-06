import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { errors } from '@elastic/elasticsearch';
import { Media } from '../media/entity/media.entity';
import {
  MediaSearchDocument,
  toMediaSearchDocument,
} from './media-search-document';

export const MEDIA_INDEX = 'media';

@Injectable()
export class MediaSearchService implements OnModuleInit {
  private readonly logger = new Logger(MediaSearchService.name);

  constructor(private readonly es: ElasticsearchService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureIndex();
    } catch (error) {
      // Don't crash the whole app if Elasticsearch is unreachable on boot —
      // search is a secondary feature, not something the core app depends on.
      this.logger.warn(
        `Could not ensure Elasticsearch index on startup: ${(error as Error).message}`,
      );
    }
  }

  private async ensureIndex(): Promise<void> {
    const exists = await this.es.indices.exists({ index: MEDIA_INDEX });
    if (exists) {
      return;
    }

    await this.es.indices.create({
      index: MEDIA_INDEX,
      mappings: {
        properties: {
          name: { type: 'text' },
          description: { type: 'text' },
          genres: { type: 'keyword' },
          interests: { type: 'keyword' },
          releaseDate: { type: 'date' },
          rating: { type: 'float' },
          type: { type: 'keyword' },
          ageRestricted: { type: 'boolean' },
        },
      },
    });
    this.logger.log(`Created Elasticsearch index "${MEDIA_INDEX}"`);
  }

  async indexMedia(media: Media): Promise<void> {
    await this.es.index({
      index: MEDIA_INDEX,
      id: media.id,
      document: toMediaSearchDocument(media),
    });
  }

  async removeMedia(id: string): Promise<void> {
    await this.es.delete({ index: MEDIA_INDEX, id }).catch((error: unknown) => {
      // Ignore "not found" — the doc may never have been indexed (e.g. ES was
      // down when it was created). Anything else, rethrow.
      const isNotFound =
        error instanceof errors.ResponseError && error.meta.statusCode === 404;
      if (!isNotFound) {
        throw error;
      }
    });
  }

  async reindexAll(mediaList: Media[]): Promise<number> {
    if (mediaList.length === 0) {
      return 0;
    }

    const operations = mediaList.flatMap((media) => [
      { index: { _index: MEDIA_INDEX, _id: media.id } },
      toMediaSearchDocument(media),
    ]);

    await this.es.bulk({ operations, refresh: true });
    return mediaList.length;
  }

  /**
   * Returns matching media ids, ordered by relevance. Elasticsearch decides
   * *what* matches and in what order — the actual data returned to clients
   * still comes from Postgres (see MediaService.search), so callers always
   * get the same shape as every other media endpoint (posterUrl, real
   * Genre/Interest objects, etc.), not the flattened search document.
   */
  async searchIds(query: string): Promise<string[]> {
    const result = await this.es.search<MediaSearchDocument>({
      index: MEDIA_INDEX,
      query: {
        multi_match: {
          query,
          fields: ['name^2', 'description', 'genres', 'interests'],
          fuzziness: 'AUTO',
        },
      },
    });

    return result.hits.hits
      .map((hit) => hit._id)
      .filter((id): id is string => Boolean(id));
  }
}
