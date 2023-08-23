import express, { Request, Response } from "express";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";
import * as knex from "knex";
import { DB_CONFIG } from "../config";

export const integrationRouter = express.Router();

integrationRouter.get("/emailer", async (req: Request, res: Response) => {});

integrationRouter.get("/suppress/:token", async (req: Request, res: Response) => {
  const { token } = req.params;

  const db = knex.knex(DB_CONFIG);
  let resp = await db.raw(`BEGIN SRVT.UPDATE_SUPPRESSION(?); END;`, [token]);

  return res.json({ data: resp });
});
