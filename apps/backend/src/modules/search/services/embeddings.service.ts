import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  public readonly VECTOR_DIMENSIONS = 1536;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates a 1536-dimensional embedding vector for input text.
   * If external AI API keys are configured, it uses them; otherwise, falls back to a deterministic semantic vectorizer.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cleanedText = text.trim();
    if (!cleanedText) {
      return new Array(this.VECTOR_DIMENSIONS).fill(0);
    }

    const openAiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openAiKey) {
      try {
        return await this.generateOpenAiEmbedding(cleanedText, openAiKey);
      } catch (err: unknown) {
        this.logger.warn(`OpenAI embedding failed, falling back to built-in vectorizer: ${(err as Error).message}`);
      }
    }

    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      try {
        return await this.generateGeminiEmbedding(cleanedText, geminiKey);
      } catch (err: unknown) {
        this.logger.warn(`Gemini embedding failed, falling back to built-in vectorizer: ${(err as Error).message}`);
      }
    }

    return this.generateDeterministicEmbedding(cleanedText);
  }

  private async generateOpenAiEmbedding(text: string, apiKey: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
        dimensions: this.VECTOR_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data[0].embedding;
  }

  private async generateGeminiEmbedding(text: string, apiKey: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        outputDimensionality: this.VECTOR_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as { embedding: { values: number[] } };
    const values = data.embedding.values;
    if (values.length < this.VECTOR_DIMENSIONS) {
      return [...values, ...new Array(this.VECTOR_DIMENSIONS - values.length).fill(0)];
    }
    return values.slice(0, this.VECTOR_DIMENSIONS);
  }

  /**
   * Deterministic high-dimensional feature-hashing embedding with subword n-grams and L2 normalization.
   * Produces dense 1536-dimensional vectors with reliable semantic similarity matching for offline/local environments.
   */
  public generateDeterministicEmbedding(text: string): number[] {
    const vector = new Array<number>(this.VECTOR_DIMENSIONS).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);

    if (tokens.length === 0) {
      return vector;
    }

    // Extract word tokens and character 3-grams & 4-grams for subword matching
    const features: string[] = [];
    for (const token of tokens) {
      features.push(`word:${token}`);
      if (token.length >= 3) {
        for (let i = 0; i <= token.length - 3; i++) {
          features.push(`tri:${token.substring(i, i + 3)}`);
        }
      }
      if (token.length >= 4) {
        for (let i = 0; i <= token.length - 4; i++) {
          features.push(`quad:${token.substring(i, i + 4)}`);
        }
      }
    }

    // Hash features into the 1536-dimensional vector
    for (const feat of features) {
      const hash1 = this.hashString(feat, 0x9e3779b9);
      const hash2 = this.hashString(feat, 0x85ebca6b);
      const sign = (hash2 & 1) === 0 ? 1 : -1;
      const index = Math.abs(hash1) % this.VECTOR_DIMENSIONS;

      const weight = feat.startsWith('word:') ? 2.0 : 0.8;
      vector[index] += sign * weight;
    }

    // L2 Normalization so cosine similarity dot product works accurately
    let norm = 0;
    for (let i = 0; i < this.VECTOR_DIMENSIONS; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.VECTOR_DIMENSIONS; i++) {
        vector[i] = Number((vector[i] / norm).toFixed(6));
      }
    }

    return vector;
  }

  private hashString(str: string, seed: number): number {
    let h = seed;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995) ^ (h >>> 15)) >>> 0;
    }
    return h | 0;
  }
}
