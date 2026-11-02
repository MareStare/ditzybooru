import type { AuthLevel, Strategy } from './extract.ts';
import type { Schema } from './schema.ts';

interface ParamSpec {
  name: string;
  in: 'path' | 'query';
  schema: Schema;
  required?: boolean;
  description?: string;
}

export interface Operation {
  operationId: string;
  /** Our path under `/api/v1`, OpenAPI style: `/images/{id}`. */
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  summary: string;
  tags: string[];
  params?: ParamSpec[];
  body?: Schema;
  response: Schema;
  /** Sample inputs the verifier uses, keyed by param name. */
  examples?: Record<string, string | number>;
  philomena: {
    /** Coverage keys (`"GET /images/:id"`) this operation serves. */
    routes: string[];
    auth: AuthLevel;
    strategies: Strategy[];
  };
}

export function defineOperation(op: Operation): Operation {
  return op;
}
