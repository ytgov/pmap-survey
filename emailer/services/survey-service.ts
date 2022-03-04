import knex, { Knex } from "knex";
import { DB_CONFIG } from "../config.js";

export class SurveyService {
    readonly db: Knex

    constructor(username: string, password: string) {
        DB_CONFIG.connection.user = username;
        DB_CONFIG.connection.password = password;
        this.db = knex(DB_CONFIG as Knex.Config<any>);
    }

    async getSurveysWithParticipants(): Promise<any[]> {
        let t = await this.db.raw(`select "SURVEY"."SID", "SURVEY"."NAME", "SURVEY"."DESCRIPTION", count("PID") as "PARTICIPANT_COUNT" from "SRVT"."SURVEY"
        INNER JOIN "SRVT"."PARTICIPANT" ON "SURVEY"."SID" = "PARTICIPANT"."SID"
        GROUP BY "SURVEY"."SID", "SURVEY"."NAME", "SURVEY"."DESCRIPTION"`);
        return t;
    }

    async getParticipantsForSurvey(sid: number): Promise<any> {
        return this.db("SRVT.PARTICIPANT").join("SRVT.PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
            .where({ SID: sid }).whereNull("RESPONSE_DATE").select("EMAIL", "PARTICIPANT.TOKEN")
    }
}
