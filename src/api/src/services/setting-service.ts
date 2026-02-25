import { DB_SCHEMA } from "../config";
import { Setting, Setting_Create, Setting_Update } from "../data/models";
import { db } from "../data";

const TABLE_NAME = "SETTING";

export enum SETTING_KEY {
  DEFAULT_MODEL = "DEFAULT_MODEL",
}

export class SettingService {
  async getAll(): Promise<Setting[]> {
    return db.withSchema(DB_SCHEMA).from(TABLE_NAME).orderBy("KEY");
  }

  async getById(ID: number): Promise<Setting | undefined> {
    return db<Setting>(TABLE_NAME).withSchema(DB_SCHEMA).where({ ID }).first();
  }

  async getByKey(KEY: string): Promise<Setting | undefined> {
    return db<Setting>(TABLE_NAME).withSchema(DB_SCHEMA).where({ KEY }).first();
  }

  async getBySurvey(SID: number): Promise<Setting[]> {
    return db<Setting>(TABLE_NAME).withSchema(DB_SCHEMA).where({ SID }).orderBy("KEY");
  }

  async getByQuestion(QID: number): Promise<Setting[]> {
    return db<Setting>(TABLE_NAME).withSchema(DB_SCHEMA).where({ QID }).orderBy("KEY");
  }

  async getBySurveyAndKey(SID: number, KEY: string): Promise<Setting | undefined> {
    return db<Setting>(TABLE_NAME).withSchema(DB_SCHEMA).where({ SID, KEY }).first();
  }

  async getByQuestionAndKey(QID: number, KEY: string): Promise<Setting | undefined> {
    return db<Setting>(TABLE_NAME).withSchema(DB_SCHEMA).where({ QID, KEY }).first();
  }

  async getGlobalByKey(KEY: string): Promise<Setting | undefined> {
    return db<Setting>(TABLE_NAME).withSchema(DB_SCHEMA).where({ KEY }).whereNull("SID").whereNull("QID").first();
  }

  async create(item: Setting_Create): Promise<number[]> {
    return db(TABLE_NAME).withSchema(DB_SCHEMA).insert(item).returning("ID");
  }

  async update(ID: number, item: Setting_Update): Promise<number> {
    return db(TABLE_NAME).withSchema(DB_SCHEMA).where({ ID }).update(item);
  }

  async delete(ID: number): Promise<number> {
    return db(TABLE_NAME).withSchema(DB_SCHEMA).where({ ID }).delete();
  }

  async deleteBySurvey(SID: number): Promise<number> {
    return db(TABLE_NAME).withSchema(DB_SCHEMA).where({ SID }).delete();
  }

  async deleteByQuestion(QID: number): Promise<number> {
    return db(TABLE_NAME).withSchema(DB_SCHEMA).where({ QID }).delete();
  }
}
