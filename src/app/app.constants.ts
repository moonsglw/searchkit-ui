import { environment } from "src/environments/environment";

export const APPEND_URL = {
    auth: 'auth',
    users: 'users',
    roles: 'roles',
    applications: 'applications',
    documents: 'documents',
    learners: 'learners',
    configs: 'configs',
    websocket: 'ws'
};

export const API = {
    AUTH: environment.apiBaseUrl + APPEND_URL.auth,
    USERS: environment.apiBaseUrl + APPEND_URL.users,
    ROLES: environment.apiBaseUrl + APPEND_URL.roles,
    APPLICATIONS: environment.apiBaseUrl + APPEND_URL.applications,
    DOCUMENTS: environment.apiBaseUrl + APPEND_URL.documents,
    LEARNERS: environment.apiBaseUrl + APPEND_URL.learners,
    CONFIGS: environment.apiBaseUrl + APPEND_URL.configs,
    WEBSOCKET: environment.apiBaseUrl.replace(/^https?:\/\//, "") + APPEND_URL.websocket
}

export const ROLE = {
    ADMIN: 'ADMIN',
    DEVELOPER: 'DEVELOPER',
    USER: 'USER'
}

export const CONFIG_PROPERTY = {
    APP_NAME: 'app_name',
    APP_VERSION: 'app_version',
    APP_AUTHOR: 'app_author',
    APP_AUTHOR_URL: 'app_author_url',
    API_VERSION: 'api_version',
    RESPONSE_ID: 'response_id',
    CONFIGURED_DISTRICT: 'district_name',
    CONFIGURED_DISTRICT_CODE: 'district_code',
    CONFIGS: 'config'
}