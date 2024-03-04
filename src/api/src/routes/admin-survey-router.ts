import express, { Request, Response } from "express";
import { db } from "../data";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";
import { EmailService } from "../services";
import { recordSentDate } from "./integration-router";
import { checkJwt, loadUser } from "../middleware/authz.middleware";

export const adminSurveyRouter = express.Router();
adminSurveyRouter.use(checkJwt, loadUser);

adminSurveyRouter.get("/", async (req: Request, res: Response) => {
  let list = await db("SRVT.SURVEY");

  for (let item of list) {
    item.questions = await db("SRVT.QUESTION").where({ SID: item.SID }).orderBy("ORD");
    item.choices = await db("SRVT.JSON_DEF").where({ SID: item.SID }).orderBy("TITLE");

    item.choices.map((c: any) => (c.choices = JSON.parse(c.SELECTION_JSON)));
  }

  res.json({ data: list });
});

adminSurveyRouter.post("/", async (req: Request, res: Response) => {
  let { CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE } = req.body;
  let newItem = await db("SRVT.SURVEY")
    .insert({ CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE })
    .returning("*");
  res.json({ data: newItem[0] });
});

adminSurveyRouter.put("/:SID/", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE } = req.body;

  await db("SRVT.SURVEY")
    .where({ SID })
    .update({ CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE });

  res.json({ data: "success" });
});

adminSurveyRouter.delete("/:SID/", async (req: Request, res: Response) => {
  let { SID } = req.params;

  let hasParticipants = await db("SRVT.PARTICIPANT").where({ SID });

  if (hasParticipants.length > 0) {
    res.json({ data: "HAS Participatns" });
  } else {
    await db("SRVT.JSON_DEF").where({ SID }).delete();
    await db("SRVT.QUESTION").where({ SID }).delete();
    await db("SRVT.SURVEY").where({ SID }).delete();
    res.json({ data: "success" });
  }
});

adminSurveyRouter.get("/question-types", async (req: Request, res: Response) => {
  let list = await db("SRVT.QUESTION_TYPE");
  res.json({ data: list.map((i) => i.TYPE) });
});

adminSurveyRouter.post("/:SID/question", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, choices, choiceTitle } = req.body;

  if (JSON_ID == -1) {
    JSON_ID = null;

    let json = await db("SRVT.JSON_DEF")
      .insert({ TITLE: choiceTitle, SID, SELECTION_JSON: JSON.stringify(choices) })
      .returning("*");
    JSON_ID = json[0].JSON_ID;
  } else if (JSON_ID) {
    await db("SRVT.JSON_DEF")
      .where({ JSON_ID })
      .update({ TITLE: choiceTitle, SELECTION_JSON: JSON.stringify(choices) });
  }

  await db("SRVT.QUESTION").insert({ SID, ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT });
  res.json({ data: "success" });
});

adminSurveyRouter.put("/:SID/question/:QID", async (req: Request, res: Response) => {
  let { SID, QID } = req.params;
  let { ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, choices, choiceTitle } = req.body;

  if (JSON_ID == -1) {
    JSON_ID = null;
    let json = await db("SRVT.JSON_DEF")
      .insert({ TITLE: choiceTitle, SID, SELECTION_JSON: JSON.stringify(choices) })
      .returning("*");
    JSON_ID = json[0].JSON_ID;
  } else if (JSON_ID) {
    await db("SRVT.JSON_DEF")
      .where({ JSON_ID })
      .update({ TITLE: choiceTitle, SELECTION_JSON: JSON.stringify(choices) });
  }

  await db("SRVT.QUESTION").where({ QID }).update({ ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT });
  res.json({ data: "success" });
});

adminSurveyRouter.delete(
  "/:SID/question/:QID",
  param("QID").isInt(),
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    let { QID } = req.params;
    await db("SRVT.QUESTION").where({ QID }).delete();
    res.json({ data: "success" });
  }
);

adminSurveyRouter.post("/:SID/send-email-test", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { subject, body } = req.body;

  let survey = await db("SRVT.SURVEY").where({ SID }).first();
  let emailer = new EmailService();

  await emailer.sendEmail(req.user.EMAIL, "111222333", `[TEST EMAIL]: ${subject}`, body);

  res.json({ data: "success" });
});

adminSurveyRouter.post("/:SID/send-email", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { subject, body, recipientType } = req.body;

  //let survey = await db("SRVT.SURVEY").where({ SID }).first();

  let query = db("SRVT.PARTICIPANT")
    .join("SRVT.PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .where({ SID })
    .whereNull("RESPONSE_DATE")
    .whereNotNull("EMAIL")
    .whereNull("RESENT_DATE")
    .select("EMAIL", "PARTICIPANT.TOKEN");

  if (recipientType == "SEND") query.whereNull("SENT_DATE");
  let participants = await query;

  let emailer = new EmailService();

  for (let p of participants) {
    await emailer.sendEmail(p.EMAIL, p.TOKEN, subject, body);

    await recordSentDate(p);
  }

  res.json({ data: `Sent ${participants.length} emails` });
});

adminSurveyRouter.post("/:SID/resend/:TOKEN", async (req: Request, res: Response) => {
  let { SID, TOKEN } = req.params;
  let { subject, body } = req.body;

  //let survey = await db("SRVT.SURVEY").where({ SID }).first();

  let query = await db("SRVT.PARTICIPANT")
    .join("SRVT.PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .where({ "PARTICIPANT.TOKEN": TOKEN })
    .whereNull("RESPONSE_DATE")
    .whereNotNull("EMAIL")
    .select("EMAIL", "PARTICIPANT.TOKEN");

  let emailer = new EmailService();

  for (let p of query) {
    await emailer.sendEmail(p.EMAIL, p.TOKEN, subject, body);
  }

  return res.json({ data: `Sent ${query.length} emails` });
});
