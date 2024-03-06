import express, { Request, Response } from "express";
import { db } from "../data";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";
import { EmailService, UserService } from "../services";
import { recordSentDate } from "./integration-router";
import { checkJwt, loadUser } from "../middleware/authz.middleware";
import { DB_SCHEMA } from "../config";
import { uniq } from "lodash";

export const adminSurveyRouter = express.Router();
adminSurveyRouter.use(checkJwt, loadUser);

const userService = new UserService();

adminSurveyRouter.get("/", async (req: Request, res: Response) => {
  let surveys = await userService.getSurveysByEmail(req.user.EMAIL);
  let list = [];

  if (req.user.IS_ADMIN == "N") {
    list = await db("SURVEY").withSchema(DB_SCHEMA).whereIn("SID", surveys);
  } else list = await db("SURVEY").withSchema(DB_SCHEMA);

  for (let item of list) {
    item.questions = await db("QUESTION").withSchema(DB_SCHEMA).where({ SID: item.SID }).orderBy("ORD");
    item.choices = await db("JSON_DEF").withSchema(DB_SCHEMA).where({ SID: item.SID }).orderBy("TITLE");

    item.choices.map((c: any) => (c.choices = JSON.parse(c.SELECTION_JSON)));
  }

  res.json({ data: list });
});

adminSurveyRouter.get("/results/:SID", async (req: Request, res: Response) => {
  const { SID } = req.params;

  let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).first();
  survey.questions = await db("QUESTION").withSchema(DB_SCHEMA).where({ SID }).orderBy("ORD");
  survey.stats = await db("PARTICIPANT")
    .withSchema(DB_SCHEMA)
    .leftJoin("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .where({ SID })
    .count("PARTICIPANT.TOKEN AS tokenCount")
    .count("SENT_DATE AS sentCount")
    .count("RESENT_DATE AS resentCount")
    .count("RESPONSE_DATE AS responseCount")
    .select("SID")
    .groupBy("SID")
    .first();

  let tokenList = new Array<string>();

  for (let question of survey.questions) {
    question.responses = await db("RESPONSE_LINE")
      .withSchema(DB_SCHEMA)
      .where({ QID: question.QID })
      .select("NVALUE", "TVALUE");

    question.responseCount = question.responses.length;
    tokenList.concat(uniq(survey.questions.map((s: any) => s.TOKEN)));
  }

  survey.responseCount = uniq(tokenList).length;

  res.json({ data: survey });
});

adminSurveyRouter.post("/", async (req: Request, res: Response) => {
  let { CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE } = req.body;
  let newItem = await db("SURVEY")
    .withSchema(DB_SCHEMA)
    .insert({ CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE })
    .returning("*");
  res.json({ data: newItem[0] });
});

adminSurveyRouter.put("/:SID/", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE } = req.body;

  await db("SURVEY")
    .withSchema(DB_SCHEMA)
    .where({ SID })
    .update({ CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE });

  res.json({ data: "success" });
});

adminSurveyRouter.delete("/:SID/", async (req: Request, res: Response) => {
  let { SID } = req.params;

  let hasParticipants = await db("PARTICIPANT").withSchema(DB_SCHEMA).where({ SID });

  if (hasParticipants.length > 0) {
    res.json({ data: "HAS Participatns" });
  } else {
    await db("JSON_DEF").withSchema(DB_SCHEMA).where({ SID }).delete();
    await db("QUESTION").withSchema(DB_SCHEMA).where({ SID }).delete();
    await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).delete();
    res.json({ data: "success" });
  }
});

adminSurveyRouter.get("/question-types", async (req: Request, res: Response) => {
  let list = await db("QUESTION_TYPE").withSchema(DB_SCHEMA);
  res.json({ data: list.map((i) => i.TYPE) });
});

adminSurveyRouter.post("/:SID/question", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, choices, choiceTitle } = req.body;

  if (JSON_ID == -1) {
    JSON_ID = null;

    let json = await db("JSON_DEF")
      .withSchema(DB_SCHEMA)
      .insert({ TITLE: choiceTitle, SID, SELECTION_JSON: JSON.stringify(choices) })
      .returning("*");
    JSON_ID = json[0].JSON_ID;
  } else if (JSON_ID) {
    await db("JSON_DEF")
      .withSchema(DB_SCHEMA)
      .where({ JSON_ID })
      .update({ TITLE: choiceTitle, SELECTION_JSON: JSON.stringify(choices) });
  }

  await db("QUESTION")
    .withSchema(DB_SCHEMA)
    .insert({ SID, ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT });
  res.json({ data: "success" });
});

adminSurveyRouter.put("/:SID/question/:QID", async (req: Request, res: Response) => {
  let { SID, QID } = req.params;
  let { ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, choices, choiceTitle } = req.body;

  if (JSON_ID == -1) {
    JSON_ID = null;
    let json = await db("JSON_DEF")
      .withSchema(DB_SCHEMA)
      .insert({ TITLE: choiceTitle, SID, SELECTION_JSON: JSON.stringify(choices) })
      .returning("*");
    JSON_ID = json[0].JSON_ID;
  } else if (JSON_ID) {
    await db("JSON_DEF")
      .withSchema(DB_SCHEMA)
      .where({ JSON_ID })
      .update({ TITLE: choiceTitle, SELECTION_JSON: JSON.stringify(choices) });
  }

  await db("QUESTION")
    .withSchema(DB_SCHEMA)
    .where({ QID })
    .update({ ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT });
  res.json({ data: "success" });
});

adminSurveyRouter.delete(
  "/:SID/question/:QID",
  param("QID").isInt(),
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    let { QID } = req.params;
    await db("QUESTION").withSchema(DB_SCHEMA).where({ QID }).delete();
    res.json({ data: "success" });
  }
);

adminSurveyRouter.post("/:SID/send-email-test", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { subject, body } = req.body;

  let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).first();

  if (survey) {
    await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).update({ EMAIL_SUBJECT: subject, EMAIL_BODY: body });

    let emailer = new EmailService();
    await emailer.sendEmail(req.user.EMAIL, "111222333", `[TEST EMAIL]: ${subject}`, body);
  }

  res.json({ data: "success" });
});

adminSurveyRouter.post("/:SID/send-email", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { subject, body, recipientType } = req.body;

  let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).first();

  if (survey) {
    await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).update({ EMAIL_SUBJECT: subject, EMAIL_BODY: body });

    let query = db("PARTICIPANT")
      .withSchema(DB_SCHEMA)
      .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
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
    return res.json({ data: `Sent ${participants.length} emails` });
  }
  return res.status(404).send();
});

adminSurveyRouter.post("/:SID/resend/:TOKEN", async (req: Request, res: Response) => {
  let { SID, TOKEN } = req.params;

  let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).first();

  let query = await db("PARTICIPANT")
    .withSchema(DB_SCHEMA)
    .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .where({ "PARTICIPANT.TOKEN": TOKEN })
    .whereNull("RESPONSE_DATE")
    .whereNotNull("EMAIL")
    .select("EMAIL", "PARTICIPANT.TOKEN");

  let emailer = new EmailService();

  for (let p of query) {
    await emailer.sendEmail(p.EMAIL, p.TOKEN, survey.EMAIL_SUBJECT, survey.EMAIL_BODY);
  }

  return res.json({ data: `Sent ${query.length} emails` });
});
