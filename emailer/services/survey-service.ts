import knex, { Knex } from "knex";
import { DB_CONFIG } from "../config.js";

export class SurveyService {
    readonly db = knex(DB_CONFIG as Knex.Config<any>)

    constructor() { }

    async getSurveysWithParticipants(): Promise<any[]> {
        let t = await this.db.raw(`select "SURVEY"."SID", "SURVEY"."NAME", "SURVEY"."DESCRIPTION", count("PID") as "PARTICIPANT_COUNT" from "SRVT"."SURVEY"
        INNER JOIN "SRVT"."PARTICIPANT" ON "SURVEY"."SID" = "PARTICIPANT"."SID"
        GROUP BY "SURVEY"."SID", "SURVEY"."NAME", "SURVEY"."DESCRIPTION"`);
        return t.rows;
    }

    async getParticipantsForSurvey(sid: number): Promise<any> {
        return this.db("SRVT.PARTICIPANT").join("SRVT.PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
            .where({ SID: sid }).whereNull("RESPONSE_DATE").select("EMAIL", "PARTICIPANT.TOKEN")
    }
}
