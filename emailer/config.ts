import * as dotenv from "dotenv";

dotenv.config();

export const DB_CLIENT = process.env.DB_CLIENT || "postgresql";
export const DB_USER = process.env.DB_USER || "postgres";
export const DB_NAME = process.env.DB_NAME;
export const DB_PORT = process.env.DB_PORT;
export const DB_HOST = process.env.DB_HOST;
export const DB_PASS = process.env.DB_PASS;

export const DB_CONFIG = {
  client: DB_CLIENT, connection: { host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, port: DB_PORT },
  pool: { min: 0, max: 25, acquireTimeoutMillis: 100000, idleTimeoutMillis: 100000, reapIntervalMillis: 60000, propagateCreateError: true }
};

export const NODE_ENV = process.env.NODE_ENV || "development";

export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

export const MAIL_FROM = process.env.MAIL_FROM || "test@yukon.ca";
export const MAIL_HOST = process.env.MAIL_HOST || "smtp.gov.yk.ca";
export const MAIL_PORT = process.env.MAIL_PORT || 587;
export const MAIL_USER = process.env.MAIL_USER || "";
export const MAIL_PASS = process.env.MAIL_PASS || "";

export const MAIL_CONFIG_DEV = {
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  }
};

export const MAIL_CONFIG = {
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: false, // true for 465, false for other ports
};

export const APPLICATION_NAME = process.env.APPLICATION_NAME || "Spatial Data Dictionary";

