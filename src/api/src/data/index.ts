import * as knex from "knex";
import { DB_CONFIG } from "../config";

export const db = knex.knex(DB_CONFIG);
