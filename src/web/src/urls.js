
import * as config from "./config";

export const LOGIN_URL = `${config.apiBaseUrl}/api/auth/login`;
export const AUTH_CHECK_URL = `${config.apiBaseUrl}/api/auth/isAuthenticated`;
export const LOGOUT_URL = `${config.apiBaseUrl}/api/auth/logout`;
export const PROFILE_URL = `${config.apiBaseUrl}/api/user/me`;
export const USER_URL = `${config.apiBaseUrl}/api/user`;

export const ASSET_URL = `${config.apiBaseUrl}/api/asset-item`;
export const ASSET_CATEGORY_URL = `${config.apiBaseUrl}/api/asset-category`;
export const TAG_URL = `${config.apiBaseUrl}/api/asset-item`;
export const MAILCODE_URL = `${config.apiBaseUrl}/api/mailcode`;
export const SCAN_URL = `${config.apiBaseUrl}/api/scan`;
export const OWNER_URL = `${config.apiBaseUrl}/api/asset-owner`;
export const TRANSFER_URL = `${config.apiBaseUrl}/api/asset-transfer`;
