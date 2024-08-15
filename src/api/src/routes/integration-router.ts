import express, { Request, Response } from "express";
import * as knex from "knex";
import { DB_CONFIG, DB_SCHEMA } from "../config";
import { EmailService } from "../services";

export const integrationRouter = express.Router();

integrationRouter.get("/emailer/:surveyId", async (req: Request, res: Response) => {
  const { surveyId } = req.params;
  const db = knex.knex(DB_CONFIG);

  let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID: surveyId }).first();

  let participants = await db("PARTICIPANT")
    .withSchema(DB_SCHEMA)
    .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .where({ SID: surveyId })
    .whereNull("RESPONSE_DATE")
    .whereNotNull("EMAIL")
    .whereNull("RESENT_DATE")
    .select("EMAIL", "PARTICIPANT.TOKEN");

  let emailer = new EmailService();

  const subject = survey.EMAIL_SUBJECT ?? "Survey Link";
  const body = survey.EMAIL_BODY ?? "Survey";

  for (let p of participants) {
    await emailer.sendEmail(p.EMAIL, p.TOKEN, subject, body, survey.FROM_EMAIL);
    await recordSentDate(p);
  }

  res.json({ data: { survey, participant_count: participants.length, participants } });
});

integrationRouter.get("/emailer/:surveyId/preview", async (req: Request, res: Response) => {
  const { surveyId } = req.params;
  const db = knex.knex(DB_CONFIG);

  let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID: surveyId }).first();

  let participants = await db("PARTICIPANT")
    .withSchema(DB_SCHEMA)
    .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .where({ SID: surveyId })
    .whereNull("RESPONSE_DATE")
    .whereNotNull("EMAIL")
    .whereNull("RESENT_DATE")
    .select("EMAIL", "PARTICIPANT.TOKEN");

  /* for (let p of participants) {
    //let resp = await emailer.sendSurveyEmail(p, survey);
    //await recordSentDate(p);
    // try and capture the status of the SMTP call
  } */

  res.json({ data: { survey, participant_count: participants.length, participants } });
});

integrationRouter.get("/suppress/:token", async (req: Request, res: Response) => {
  const { token } = req.params;

  const db = knex.knex(DB_CONFIG);
  let value = -1;
  let resp = await db.raw(`BEGIN ${DB_SCHEMA}.UPDATE_SUPRESSION(?, ?, ?); END;`, [token, "D", value]);

  // Participant successfully removed from survey or Participant not found in database

  res.send("Participant successfully removed from survey");
});

export async function recordSentDate(participant: any): Promise<any> {
  const db = knex.knex(DB_CONFIG);
  let token = participant.TOKEN;
  let data = await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).where({ TOKEN: token }).first();

  if (data.SENT_DATE) {
    await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).where({ TOKEN: token }).update({ RESENT_DATE: new Date() });
  } else {
    await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).where({ TOKEN: token }).update({ SENT_DATE: new Date() });
  }

  return Promise.resolve(true);
}
