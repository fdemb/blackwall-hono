import type { BuildQueryResult, DBQueryConfigWith } from "drizzle-orm";
import type { JSONParsed } from "hono/utils/types";
import { relations } from "@blackwall/database";

type TSchema = typeof relations;

export type IncludeRelation<TableName extends keyof TSchema> = DBQueryConfigWith<
  TSchema,
  TSchema[TableName]["relations"]
>;

export type InferDbType<
  TableName extends keyof TSchema,
  With extends IncludeRelation<TableName> | undefined = undefined,
> = JSONParsed<
  BuildQueryResult<
    TSchema,
    TSchema[TableName],
    {
      with: With;
    }
  >
>;
