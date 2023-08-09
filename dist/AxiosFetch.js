"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosFetch = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Fetcher that uses axios.
 */
class AxiosFetch {
    /**
     * Constructor
     *
     * @param logger a logger that will be used to log messages.
     */
    constructor(logger) {
        this.logger = logger;
        /**
         * The current csrf token.
         */
        this.csrfToken = null;
        /**
         * The session cookie.
         */
        this.cookie = null;
        /**
         * @inheritdoc
         */
        this.hasToken = () => {
            return !!this.csrfToken;
        };
        /**
         * Fetches a csrf token from the server.
         *
         * Also stores the token internally for future requests.
         */
        this.getToken = () => __awaiter(this, void 0, void 0, function* () {
            return yield this.request('GET', '/_initial').then((resp) => {
                if (!resp) {
                    if (this.logger) {
                        this.logger.debug(`Got null response from /_initial`);
                    }
                    return null;
                }
                return this.formatToken(resp.headers['csrf-token']);
            });
        });
        /**
         * @inheritdoc
         */
        this.request = (method, path, body = null) => __awaiter(this, void 0, void 0, function* () {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (this.csrfToken) {
                headers['X-Csrf-Token'] = this.csrfToken;
            }
            if (this.cookie) {
                headers['Cookie'] = this.cookie;
            }
            const config = {
                url: path,
                method,
                headers,
            };
            if (method === 'POST' && body) {
                config.data = body;
            }
            if (this.logger) {
                this.logger.debug(`Making ${method} request to ${path}`, config);
            }
            try {
                return yield this.axiosInstance
                    .request(config)
                    .then((res) => {
                    const { headers } = res;
                    if (!this.cookie && headers['set-cookie']) {
                        this.cookie = (headers['set-cookie'] || '').toString();
                    }
                    if (!this.csrfToken && headers['csrf-token']) {
                        this.csrfToken = this.formatToken(headers['csrf-token']);
                    }
                    return {
                        statusCode: res.status,
                        data: res.data,
                        headers: {
                            'set-cookie': headers['set-cookie'],
                            'csrf-token': headers['csrf-token'],
                        },
                    };
                })
                    .catch((error) => {
                    if (this.logger) {
                        this.logger.error(`${error.response}: Error making ${method} request to ${path}`, error);
                    }
                    throw error;
                });
            }
            catch (error) {
                if (this.logger) {
                    this.logger.error(`Error making ${method} request to ${path}`, error);
                }
                throw error;
            }
        });
        /**
         * Formats a csrf token.
         *
         * @param token The token to format.
         */
        this.formatToken = (token) => {
            if (!token) {
                return '';
            }
            if (Array.isArray(token)) {
                return token[0];
            }
            if (typeof token === 'number') {
                return token.toString();
            }
            return token.toString();
        };
        this.axiosInstance = axios_1.default.create({
            baseURL: AxiosFetch.baseURL,
            headers: {
                Referer: 'https://discuit.net/',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            },
        });
    }
}
exports.AxiosFetch = AxiosFetch;
/**
 * The base url for the api.
 */
AxiosFetch.baseURL = 'https://discuit.net/api';
