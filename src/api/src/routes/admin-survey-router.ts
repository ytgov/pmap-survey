import express, { Request, Response } from "express";
import { db } from "../data";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";
import { EmailService, UserService } from "../services";
import { recordSentDate } from "./integration-router";
import { DB_SCHEMA } from "../config";
import { sortBy, uniq } from "lodash";

export const adminSurveyRouter = express.Router();

const userService = new UserService();

adminSurveyRouter.get("/", async (req: Request, res: Response) => {
  let surveys = await userService.getSurveysByEmail(req.user.EMAIL);
  let list = [];

  if (req.user.IS_ADMIN == "N") {
    list = await db("SURVEY").withSchema(DB_SCHEMA).whereIn("SID", surveys);
  } else list = await db("SURVEY").withSchema(DB_SCHEMA);

  let allQuestions = await db("QUESTION").withSchema(DB_SCHEMA).orderBy("SID", "ORD");
  let allChoices = await db("JSON_DEF").withSchema(DB_SCHEMA).orderBy("SID", "TITLE");
  let allResponses = await db("PARTICIPANT")
    .withSchema(DB_SCHEMA)
    .innerJoin("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .whereNotNull("RESPONSE_DATE");
  let allConditions = await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA);

  for (let item of list) {
    item.questions = sortBy(
      allQuestions.filter((q) => q.SID == item.SID),
      "ORD"
    );
    item.choices = sortBy(
      allChoices.filter((c) => c.SID == item.SID),
      "TITLE"
    );
    item.responses = allResponses.filter((r) => r.SID == item.SID);
    item.choices.map((c: any) => (c.choices = JSON.parse(c.SELECTION_JSON)));

    for (let q of item.questions) {
      q.conditions = allConditions.filter((c) => c.QID == q.QID);
    }
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

  if (!survey.stats) {
    survey.stats = {
      tokenCount: "0",
      sentCount: "0",
      resentCount: "0",
      responseCount: "0",
    };
  }

  let tokenList = new Array<string>();
  let allConditions = await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA);

  for (let question of survey.questions) {
    question.responses = await db("RESPONSE_LINE")
      .withSchema(DB_SCHEMA)
      .where({ QID: question.QID })
      .select("NVALUE", "TVALUE");
    question.conditions = allConditions.filter((c) => c.QID == question.QID);

    let parentIds = uniq(question.conditions.map((p: any) => p.CQID));
    let matchGroups = [];

    for (let parent of parentIds) {
      let match = survey.questions.find((q: any) => q.QID == parent);
      let ask = match ? match.ASK : parent;

      let matches = question.conditions.filter((q: any) => q.CQID == parent);

      matchGroups.push(`${ask} = ${matches.map((c: any) => c.TVALUE).join(" OR ")}`);
    }

    question.conditionText = matchGroups.join(" AND ");
    question.responseCount = question.responses.length;
    tokenList.concat(uniq(survey.questions.map((s: any) => s.TOKEN)));
  }

  survey.responseCount = uniq(tokenList).length;

  res.json({ data: survey });
});

adminSurveyRouter.post("/", async (req: Request, res: Response) => {
  let {
    CONTACT_EMAIL,
    CONTACT_QUESTION,
    DESCRIPTION,
    NAME,
    PAGE_INTRO,
    PAGE_TITLE,
    FROM_EMAIL,
    ALLOW_AUDIT,
    ALLOW_AUTO_PARTICIPANT,
    ALLOW_DEMOGRAPHIC_GROUP,
  } = req.body;
  let newItem = await db("SURVEY")
    .withSchema(DB_SCHEMA)
    .insert({
      CONTACT_EMAIL,
      CONTACT_QUESTION,
      DESCRIPTION,
      NAME,
      PAGE_INTRO,
      PAGE_TITLE,
      FROM_EMAIL,
      ALLOW_AUDIT,
      ALLOW_AUTO_PARTICIPANT,
      ALLOW_DEMOGRAPHIC_GROUP,
    })
    .returning("*");
  res.json({ data: newItem[0] });
});

adminSurveyRouter.put("/:SID/", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let {
    CONTACT_EMAIL,
    CONTACT_QUESTION,
    DESCRIPTION,
    NAME,
    PAGE_INTRO,
    PAGE_TITLE,
    FROM_EMAIL,
    ALLOW_AUDIT,
    STATUS,
    ALLOW_AUTO_PARTICIPANT,
    ALLOW_DEMOGRAPHIC_GROUP,
  } = req.body;

  await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).update({
    CONTACT_EMAIL,
    CONTACT_QUESTION,
    DESCRIPTION,
    NAME,
    PAGE_INTRO,
    PAGE_TITLE,
    FROM_EMAIL,
    ALLOW_AUDIT,
    STATUS,
    ALLOW_AUTO_PARTICIPANT,
    ALLOW_DEMOGRAPHIC_GROUP,
  });

  res.json({ data: "success" });
});

adminSurveyRouter.put("/:SID/choices", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { choices } = req.body;
  const JSON_ID = choices.JSON_ID;

  if (JSON_ID) {
    await db("JSON_DEF")
      .withSchema(DB_SCHEMA)
      .where({ JSON_ID })
      .update({ TITLE: choices.TITLE, SELECTION_JSON: JSON.stringify(choices.choices) });
  } else {
    await db("JSON_DEF")
      .withSchema(DB_SCHEMA)
      .insert({ TITLE: choices.TITLE, SELECTION_JSON: JSON.stringify(choices.choices), SID });
  }
  res.json({ data: "success" });
});

adminSurveyRouter.delete("/:SID/choices/:JSON_ID", async (req: Request, res: Response) => {
  let { SID, JSON_ID } = req.params;

  await db("JSON_DEF").withSchema(DB_SCHEMA).where({ JSON_ID }).delete();

  res.json({ data: "success" });
});

adminSurveyRouter.delete("/:SID/", async (req: Request, res: Response) => {
  let { SID } = req.params;

  let hasParticipants = await db("PARTICIPANT").withSchema(DB_SCHEMA).where({ SID });

  if (hasParticipants.length > 0) {
    return res.json({ error: "This survey has participants" });
  }

  try {
    const questions = await db("QUESTION").withSchema(DB_SCHEMA).where({ SID }).select("QID");

    for (const question of questions) {
      await db("Q_CONDITION_TBL").where({ QID: question.QID }).delete();
    }

    await db("JSON_DEF").withSchema(DB_SCHEMA).where({ SID }).delete();
    await db("QUESTION").withSchema(DB_SCHEMA).where({ SID }).delete();
    await db("SURVEY").withSchema(DB_SCHEMA).where({ SID }).delete();
    return res.json({ data: "success" });
  } catch (err) {
    console.log("ERROR DELETING SURVEY", err);
    return res.json({ data: err });
  }
});

adminSurveyRouter.get("/question-types", async (req: Request, res: Response) => {
  let list = await db("QUESTION_TYPE").withSchema(DB_SCHEMA);
  res.json({ data: list.map((i) => i.TYPE) });
});

adminSurveyRouter.post("/:SID/question", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, SELECT_MIN, RENDER_AS, MAX_LENGTH } =
    req.body;

  /* if (JSON_ID == -1) {
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
 */
  await db("QUESTION").withSchema(DB_SCHEMA).insert({
    SID,
    ASK,
    OPTIONAL,
    ORD,
    TYPE,
    RANGE,
    GROUP_ID,
    JSON_ID,
    SELECT_LIMIT,
    SELECT_MIN,
    RENDER_AS,
    MAX_LENGTH,
  });
  res.json({ data: "success" });
});

adminSurveyRouter.put("/:SID/question/:QID/order", async (req: Request, res: Response) => {
  let { SID, QID } = req.params;
  let { ORD } = req.body;

  await db("QUESTION").withSchema(DB_SCHEMA).where({ QID }).update({ ORD });
  res.json({ data: "success" });
});

adminSurveyRouter.put("/:SID/question/:QID/conditions", async (req: Request, res: Response) => {
  let { QID } = req.params;
  let { conditions } = req.body;

  await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).where({ QID }).delete();

  for (let cond of conditions) {
    delete cond.COND_ID;
    await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).insert(cond);
  }

  res.json({ data: "success" });
});

adminSurveyRouter.put("/:SID/question/:QID", async (req: Request, res: Response) => {
  let { SID, QID } = req.params;
  let { ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, SELECT_MIN, RENDER_AS, MAX_LENGTH } =
    req.body;

  /*  if (JSON_ID == -1) {
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
  } */

  await db("QUESTION")
    .withSchema(DB_SCHEMA)
    .where({ QID })
    .update({ ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, SELECT_MIN, RENDER_AS, MAX_LENGTH });
  res.json({ data: "success" });
});

adminSurveyRouter.delete(
  "/:SID/question/:QID",
  param("QID").isInt(),
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    let { QID } = req.params;
    await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).where({ QID }).delete();
    await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).where({ CQID: QID }).delete();
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
    await emailer.sendEmail(req.user.EMAIL, "111222333", `[TEST EMAIL]: ${subject}`, body, survey.FROM_EMAIL);
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
      await emailer.sendEmail(p.EMAIL, p.TOKEN, subject, body, survey.FROM_EMAIL);

      await recordSentDate(p, db);
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
    await emailer.sendEmail(
      p.EMAIL,
      p.TOKEN,
      survey.EMAIL_SUBJECT ?? "",
      survey.EMAIL_BODY ?? "",
      survey.FROM_EMAIL ?? ""
    );
  }

  return res.json({ data: `Sent ${query.length} emails` });
});
