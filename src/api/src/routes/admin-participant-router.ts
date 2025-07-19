import express, { Request, Response } from "express";
import { db } from "../data";
import { DB_SCHEMA } from "../config";
import { isInteger, isNil } from "lodash";

export const adminParticipantRouter = express.Router();

adminParticipantRouter.get("/:SID/:DEMOGRAPHIC_GROUP?", async (req: Request, res: Response) => {
  let { SID, DEMOGRAPHIC_GROUP } = req.params;
  let GROUP = DEMOGRAPHIC_GROUP == "null" ? null : DEMOGRAPHIC_GROUP;

  if (!isNil(GROUP) && isInteger(parseInt(GROUP))) {
    let list = await db("PARTICIPANT_DATA")
      .withSchema(DB_SCHEMA)
      .innerJoin("PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
      .where("PARTICIPANT.SID", SID)
      .where("PARTICIPANT.DEMOGRAPHIC_GROUP_ID", GROUP);

    res.json({ data: list });
  } else {
    let list = await db("PARTICIPANT_DATA")
      .withSchema(DB_SCHEMA)
      .innerJoin("PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
      .where("PARTICIPANT.SID", SID);

    res.json({ data: list });
  }
});

adminParticipantRouter.post("/", async (req: Request, res: Response) => {
  let { addresses, survey, fileData, prefix, demographicGroup } = req.body;

  let demographicInsert: { TOKEN: string | null; DEMOGRAPHIC: string; NVALUE: number | null; TVALUE: string | null }[] =
    [];
  const demographicGroupData: {
    TOKEN: string | null;
    DEMOGRAPHIC: string;
    NVALUE: number | null;
    TVALUE: string | null;
  }[] = [];

  if (!isNil(demographicGroup)) {
    const list = await db("DEMOGRAPHIC_GROUP_VALUE")
      .withSchema(DB_SCHEMA)
      .where({ DEMOGRAPHIC_GROUP_ID: demographicGroup });

    for (const value of list) {
      demographicInsert.push({
        TOKEN: null,
        DEMOGRAPHIC: value.DEMOGRAPHIC,
        NVALUE: value.NVALUE,
        TVALUE: value.TVALUE,
      });
    }
  }

  if (fileData && fileData.headers && fileData.headers.length > 0) {
    let demographicList = await db("DEMOGRAPHIC_TYPE").withSchema(DB_SCHEMA);
    let demographics = demographicList.map((d) => d.DEMOGRAPHIC);

    // remove the EMAIL header
    fileData.headers.shift();

    for (let records of fileData.records) {
      let existingAddresses = await db("PARTICIPANT_DATA")
        .withSchema(DB_SCHEMA)
        .innerJoin("PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
        .where("PARTICIPANT.SID", survey)
        .whereNotNull("EMAIL")
        .select("EMAIL");

      let existingList = existingAddresses.map((e) => e.EMAIL);

      let email = records.shift();
      if (existingList.includes(email)) continue;

      let token = makeToken(prefix);

      for (const value of demographicInsert) {
        value.TOKEN = token;
      }

      for (let i = 0; i < fileData.headers.length; i++) {
        let header = fileData.headers[i];
        let value = records[i];

        let demo = header;
        if (!demographics.includes(demo)) return res.status(500).send(`Invalid demographic: ${demo}`);

        let nval = isNumeric(value) ? Number(value) : null;
        let tval = isNumeric(value) ? null : value;
        demographicInsert.push({ TOKEN: token, DEMOGRAPHIC: demo, NVALUE: nval, TVALUE: tval });
      }

      await db("PARTICIPANT")
        .withSchema(DB_SCHEMA)
        .insert({ TOKEN: token, SID: survey, CREATE_DATE: new Date(), DEMOGRAPHIC_GROUP_ID: demographicGroup });
      await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).insert({ TOKEN: token, EMAIL: email });
      if (demographicInsert.length > 0)
        await db("PARTICIPANT_DEMOGRAPHIC").withSchema(DB_SCHEMA).insert(demographicInsert);
    }
  } else {
    for (let address of addresses) {
      let existingAddresses = await db("PARTICIPANT_DATA")
        .withSchema(DB_SCHEMA)
        .innerJoin("PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
        .where("PARTICIPANT.SID", survey)
        .whereNotNull("EMAIL")
        .select("EMAIL");

      let existingList = existingAddresses.map((e) => e.EMAIL);
      if (existingList.includes(address)) continue;

      let token = makeToken(prefix);

      for (const value of demographicInsert) {
        value.TOKEN = token;
      }

      await db("PARTICIPANT")
        .withSchema(DB_SCHEMA)
        .insert({ TOKEN: token, SID: survey, CREATE_DATE: new Date(), DEMOGRAPHIC_GROUP_ID: demographicGroup });
      await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).insert({ TOKEN: token, EMAIL: address });

      if (demographicInsert.length > 0)
        await db("PARTICIPANT_DEMOGRAPHIC").withSchema(DB_SCHEMA).insert(demographicInsert);
    }
  }

  res.json({ data: {} });
});

adminParticipantRouter.delete("/:TOKEN", async (req: Request, res: Response) => {
  let { TOKEN } = req.params;

  await db("PARTICIPANT_DEMOGRAPHIC").withSchema(DB_SCHEMA).where({ TOKEN }).delete();
  await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).where({ TOKEN }).delete();
  await db("PARTICIPANT").withSchema(DB_SCHEMA).where({ TOKEN }).delete();

  res.json({ data: {} });
});

adminParticipantRouter.delete("/:SID/stale", async (req: Request, res: Response) => {
  let { SID } = req.params;

  let staleOnes = await await db("PARTICIPANT")
    .withSchema(DB_SCHEMA)
    .innerJoin("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .whereNull("RESPONSE_DATE")
    .where({ SID });

  for (const stale of staleOnes) {
    await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).where({ TOKEN: stale.TOKEN }).update({ EMAIL: null });
  }

  res.json({ data: {} });
});

export function makeToken(prefix: string) {
  const chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
  const randomArray = Array.from({ length: 64 }, (v, k) => chars[Math.floor(Math.random() * chars.length)]);

  let randomString = `${prefix}_${randomArray.join("")}`;
  randomString = randomString.replace(/^_/, "");
  return randomString.substring(0, 64);
}
function isNumeric(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
