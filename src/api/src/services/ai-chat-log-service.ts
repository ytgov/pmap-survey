import { db } from "../data";
import { DB_SCHEMA } from "../config";
import { AIChatLog, AIChatLog_Create } from "../data/models/ai-chat-log-model";

export class AIChatLogService {
  private tableName = "AI_CHAT_LOG";

  async create(log: AIChatLog_Create): Promise<AIChatLog> {
    const [result] = await db(this.tableName)
      .withSchema(DB_SCHEMA)
      .insert({
        QUESTION_ID: log.QUESTION_ID,
        MODEL: log.MODEL,
        USER_MESSAGE: log.USER_MESSAGE,
        ASSISTANT_MESSAGE: log.ASSISTANT_MESSAGE,
        PROMPT_EVAL_COUNT: log.PROMPT_EVAL_COUNT,
        EVAL_COUNT: log.EVAL_COUNT,
        TOTAL_DURATION: log.TOTAL_DURATION,
      })
      .returning("*");

    return result;
  }

  async getByQuestionId(questionId: number): Promise<AIChatLog[]> {
    return db(this.tableName)
      .withSchema(DB_SCHEMA)
      .where({ QUESTION_ID: questionId })
      .orderBy("CREATED_AT", "desc");
  }

  async getAll(limit = 100, offset = 0): Promise<AIChatLog[]> {
    return db(this.tableName)
      .withSchema(DB_SCHEMA)
      .orderBy("CREATED_AT", "desc")
      .limit(limit)
      .offset(offset);
  }

  async getById(logId: number): Promise<AIChatLog | undefined> {
    return db(this.tableName)
      .withSchema(DB_SCHEMA)
      .where({ LOG_ID: logId })
      .first();
  }
}
