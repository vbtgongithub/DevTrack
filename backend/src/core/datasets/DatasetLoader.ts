// src/core/datasets/DatasetLoader.ts
// Efficient stream-safe loaders supporting pagination, async iterators, and lazy parsing.

import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { logger } from '../../shared/logger.js';
import { LoaderOptions } from './types.js';
import { DatasetResolver } from './DatasetResolver.js';

export class DatasetLoader {
  /**
   * Load JSON dataset lazily and safely.
   */
  public static loadJSON<T = any>(filePathOrId: string): T {
    const resolvedPath = DatasetResolver.resolveDatasetPath(filePathOrId);
    logger.info(`[DatasetLoader] Loading JSON dataset: ${resolvedPath}`);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`[DatasetLoader] JSON File not found: ${resolvedPath}`);
    }

    try {
      const rawData = fs.readFileSync(resolvedPath, 'utf8');
      return JSON.parse(rawData) as T;
    } catch (error: any) {
      logger.error(`[DatasetLoader] Error parsing JSON file: ${resolvedPath}`, error);
      throw new Error(`[DatasetLoader] Failed to parse JSON dataset: ${error.message}`);
    }
  }

  /**
   * Load CSV dataset into memory completely (recommended ONLY for smaller datasets, <10MB).
   */
  public static async loadCSV<T = any>(filePathOrId: string, options: LoaderOptions = {}): Promise<T[]> {
    const resolvedPath = DatasetResolver.resolveDatasetPath(filePathOrId);
    logger.info(`[DatasetLoader] Loading CSV dataset fully in-memory: ${resolvedPath}`);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`[DatasetLoader] CSV File not found: ${resolvedPath}`);
    }

    const results: T[] = [];
    let rowCount = 0;
    const limit = options.limit || Infinity;
    const skip = options.skip || 0;

    return new Promise<T[]>((resolve, reject) => {
      const stream = fs.createReadStream(resolvedPath)
        .pipe(csvParser())
        .on('data', (row) => {
          rowCount++;
          if (rowCount <= skip) {
            return;
          }
          if (results.length < limit) {
            results.push(row);
          } else {
            // Reached limit, close stream early
            stream.destroy();
            resolve(results);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (err) => {
          logger.error(`[DatasetLoader] Error reading CSV: ${resolvedPath}`, err);
          reject(err);
        });
    });
  }

  /**
   * Stream a CSV dataset using a callback.
   * Employs backpressure (pausing stream while processing) to avoid RAM inflation.
   */
  public static async streamCSV(
    filePathOrId: string,
    onRow: (row: any, index: number) => Promise<void> | void,
    options: LoaderOptions = {}
  ): Promise<number> {
    const resolvedPath = DatasetResolver.resolveDatasetPath(filePathOrId);
    logger.info(`[DatasetLoader] Streaming CSV dataset: ${resolvedPath}`);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`[DatasetLoader] CSV File not found: ${resolvedPath}`);
    }

    let index = 0;
    let processedCount = 0;
    const limit = options.limit || Infinity;
    const skip = options.skip || 0;

    return new Promise<number>((resolve, reject) => {
      const parserStream = fs.createReadStream(resolvedPath).pipe(csvParser());
      
      parserStream.on('data', async (row) => {
        index++;
        if (index <= skip) {
          return;
        }

        if (processedCount >= limit) {
          parserStream.destroy();
          resolve(processedCount);
          return;
        }

        // Apply backpressure: pause the stream during processing if it is async
        parserStream.pause();
        try {
          await onRow(row, index);
          processedCount++;
          parserStream.resume();
        } catch (error) {
          parserStream.destroy(error as Error);
        }
      });

      parserStream.on('end', () => {
        resolve(processedCount);
      });

      parserStream.on('error', (err) => {
        logger.error(`[DatasetLoader] Error streaming CSV: ${resolvedPath}`, err);
        reject(err);
      });
    });
  }

  /**
   * Returns an Async Generator (Iterator) yielding row by row,
   * allowing modern and sleek `for await (const row of DatasetLoader.asyncIterator(id))` loops.
   */
  public static asyncIterator<T = any>(
    filePathOrId: string,
    options: LoaderOptions = {}
  ): AsyncGenerator<T, void, unknown> {
    const resolvedPath = DatasetResolver.resolveDatasetPath(filePathOrId);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`[DatasetLoader] CSV File not found for iterator: ${resolvedPath}`);
    }

    const skip = options.skip || 0;
    const limit = options.limit || Infinity;

    // We build a queue mechanism to bridge stream events to async generator yields
    let streamEnded = false;
    let streamError: Error | null = null;
    const buffer: T[] = [];
    let resolveNext: ((value: IteratorResult<T>) => void) | null = null;
    let index = 0;
    let yieldedCount = 0;

    const stream = fs.createReadStream(resolvedPath).pipe(csvParser());

    stream.on('data', (row) => {
      index++;
      if (index <= skip) return;
      if (yieldedCount >= limit) {
        stream.destroy();
        return;
      }

      buffer.push(row);
      if (resolveNext) {
        const nextRow = buffer.shift()!;
        yieldedCount++;
        const resolve = resolveNext;
        resolveNext = null;
        resolve({ value: nextRow, done: false });
      }

      if (buffer.length > 50) {
        stream.pause();
      }
    });

    stream.on('end', () => {
      streamEnded = true;
      if (resolveNext) {
        const resolve = resolveNext;
        resolveNext = null;
        resolve({ value: undefined as any, done: true });
      }
    });

    stream.on('error', (err) => {
      streamError = err;
      if (resolveNext) {
        const reject = resolveNext;
        resolveNext = null;
        // In generator, error will be thrown
        logger.error(`[DatasetLoader] Async iterator stream error`, err);
      }
    });

    const generator = (async function* () {
      while (true) {
        if (streamError) {
          throw streamError;
        }

        if (buffer.length > 0) {
          if (buffer.length < 20 && !streamEnded) {
            stream.resume();
          }
          yieldedCount++;
          yield buffer.shift()!;
          continue;
        }

        if (streamEnded) {
          break;
        }

        if (yieldedCount >= limit) {
          stream.destroy();
          break;
        }

        // Wait for next item to arrive
        stream.resume();
        const nextPromise = new Promise<IteratorResult<T>>((resolve) => {
          resolveNext = resolve;
        });

        const result = await nextPromise;
        if (result.done) {
          break;
        }

        yield result.value;
      }
    })();

    return generator;
  }
}
