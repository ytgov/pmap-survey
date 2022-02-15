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

surveyRouter.post("/:token", [param("token").notEmpty()], ReturnValidationErrors,
    async (req: Request, res: Response) => {
        let { token } = req.params;
        let { questions } = req.body;
        let participant = await db("SRVT.PARTICIPANT").where({ TOKEN: token }).first();

        if (participant) {
            for (let question of questions) {
                let id = question.QID;
                let answer = question.answer;

                let ans: any = {
                    TOKEN: token,
                    QID: id
                };

                if (typeof answer == "number")
                    ans.NVALUE = answer;
                else if (Array.isArray(answer))
                    ans.TVALUE = JSON.stringify(answer);
                else
                    ans.TVALUE = answer;

                await db("SRVT.RESPONSE_LINE").insert(ans);
            }

            return res.json({ data: {}, messages: [{ variant: "success" }] });
        }

        res.status(404).send();
    });

// This route is only temporary to test for submissions
surveyRouter.get("/:token/answers", [param("token").notEmpty()], ReturnValidationErrors,
    async (req: Request, res: Response) => {
        let { token } = req.params;
        let answers = await db("SRVT.RESPONSE_LINE").where({ TOKEN: token })
        return res.json({ data: answers });
    });
