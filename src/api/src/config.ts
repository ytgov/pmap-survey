import * as dotenv from "dotenv";

export const NODE_ENV = process.env.NODE_ENV;

let path;
switch (process.env.NODE_ENV) {
  case "test":
    path = `.env.test`;
    break;
  case "production":
    path = `.env.production`;
    break;
  default:
    path = `.env.development`;
}
dotenv.config({ path: path });

console.log(`LOADING ${NODE_ENV} CONFIG FROM ${path}`);

export const API_PORT = process.env.API_PORT || "3000";
export const FRONTEND_URL = process.env.FRONTEND_URL || "";
export const AUTH_REDIRECT = process.env.AUTH_REDIRECT || "";

export const DB_USER = process.env.DB_USER || "postgres";
export const DB_PASS = process.env.DB_PASS || "";
export const DB_HOST = process.env.DB_HOST || "";
export const DB_PORT = parseInt(process.env.DB_PORT || "") || 5432;
export const DB_NAME = process.env.DB_NAME || "";
export const DB_CLIENT = process.env.DB_CLIENT || "postgresql";

export const API_GATEWAY_KEY = process.env.API_GATEWAY_KEY || "";

export const DB_CONFIG = {
  client: DB_CLIENT,
  connection: {
    server: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT
  }
}

export const EMAIL_CONFIG = {
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "", // generated ethereal user
    pass: "", // generated ethereal password
  },
}
