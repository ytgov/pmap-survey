
import * as config from "./config";

export const LOGIN_URL = `${config.apiBaseUrl}/api/auth/login`;
export const AUTH_CHECK_URL = `${config.apiBaseUrl}/api/auth/isAuthenticated`;
export const LOGOUT_URL = `${config.apiBaseUrl}/api/auth/logout`;
export const PROFILE_URL = `${config.apiBaseUrl}/api/user/me`;

export const SURVEY_URL = `${config.apiBaseUrl}/api/survey`;
export const USERS_URL = `${config.apiBaseUrl}/api/user`;

// probably delete later
export const ANSWER_URL = `${config.apiBaseUrl}/api/`
export const PARTICIPANT_URL = `${config.apiBaseUrl}/api/`