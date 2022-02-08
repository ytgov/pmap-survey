import express, { Request, Response } from "express";
import { db } from "../data";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";

export const surveyRouter = express.Router();

surveyRouter.get("/:token", [param("token").notEmpty()], ReturnValidationErrors,
    async (req: Request, res: Response) => {
        let { token } = req.params;
        let participant = await db("SRVT.PARTICIPANT").where({ TOKEN: token }).first();

        if (participant) {
            let survey = await db("SRVT.SURVEY").where({ SID: participant.SID }).first();
            let questions = await db("SRVT.QUESTION").where({ SID: participant.SID }).orderBy("ORDER");
            return res.json({ data: { survey, questions } });
        }

        res.status(404).send();
    });
