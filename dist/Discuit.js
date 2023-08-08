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
exports.Discuit = void 0;
const axios_1 = __importDefault(require("axios"));
const MemorySeenChecker_1 = require("./MemorySeenChecker");
/**
 * Represents a Discuit client.
 */
class Discuit {
    /**
     * Constructor
     */
    constructor() {
        /**
         * Communities being watched.
         */
        this.watchers = [];
        /**
         * How often the client should check for new posts in the watched communities.
         */
        this.watchInterval = 1000 * 60 * 5; // 5 minutes
        /**
         * Keeps track of which posts the watch() command has seen.
         */
        this.seenChecker = new MemorySeenChecker_1.MemorySeenChecker();
        /**
         * The current csrf token.
         */
        this.csrfToken = null;
        /**
         * The session cookie.
         */
        this.cookie = null;
        /**
         * Logs into the server.
         *
         * @param username The username.
         * @param password The password.
         */
        this.login = (username, password) => __awaiter(this, void 0, void 0, function* () {
            if (!this.csrfToken || !this.cookie) {
                if (!(yield this.getToken())) {
                    console.warn('Failed to get csrf token');
                    return null;
                }
            }
            return yield this.request('POST', '/_login', {
                username,
                password,
            }).then((res) => {
                if (!res.id) {
                    return null;
                }
                this.user = res;
                return this.user;
            });
        });
        /**
         * Watches for new posts.
         *
         * @param communities The communities to watch.
         * @param cb The callback.
         */
        this.watch = (communities, cb) => {
            for (let i = 0; i < communities.length; i++) {
                const community = communities[i].toLowerCase();
                const found = this.watchers.find((w) => w.community === community);
                if (found) {
                    found.callbacks.push(cb);
                }
                else {
                    this.watchers.push({ community, callbacks: [cb] });
                }
            }
            if (!this.watchInterval) {
                this.watchInterval = setInterval(this.watchLoop, this.watchInterval);
            }
            this.watchLoop().then();
        };
        /**
         * Callback for setInterval.
         *
         * Checks for new posts and calls the callbacks.
         */
        this.watchLoop = () => __awaiter(this, void 0, void 0, function* () {
            const recent = yield this.getPosts('latest', 50);
            for (let i = 0; i < recent.length; i++) {
                const post = recent[i];
                // Have we already seen this?
                if (yield this.seenChecker.isSeen(post.id)) {
                    if (this.logger) {
                        this.logger.debug(`Skipping post ${post.id} because it has already been seen`);
                    }
                    continue;
                }
                for (let j = 0; j < this.watchers.length; j++) {
                    const watcher = this.watchers[j];
                    if (watcher.community === post.communityName.toLowerCase()) {
                        for (let k = 0; k < watcher.callbacks.length; k++) {
                            watcher.callbacks[k](post.communityName, post);
                            yield this.seenChecker.add(post.id);
                        }
                    }
                }
            }
        });
        /**
         * Submits a comment.
         *
         * @param publicId The public id of the post.
         * @param body The comment body.
         * @param parentCommentId The id of the parent comment.
         */
        this.comment = (publicId, body, parentCommentId = null) => __awaiter(this, void 0, void 0, function* () {
            if (!this.user) {
                throw new Error('Not logged in');
            }
            return yield this.request('POST', `/posts/${publicId}/comments?userGroup=normal`, {
                body,
                parentCommentId,
            }).then((res) => {
                return res;
            });
        });
        /**
         * Fetches the latest posts.
         *
         * @param sort How to sort the posts.
         * @param limit The number of posts to fetch
         */
        this.getPosts = (sort = 'latest', limit = 10) => __awaiter(this, void 0, void 0, function* () {
            return yield this.request('GET', `/posts?sort=${sort}&limit=${limit}`).then((res) => {
                return res.posts;
            });
        });
        /**
         * Fetches a csrf token from the server.
         *
         * Also stores the token internally for future requests.
         */
        this.getToken = () => __awaiter(this, void 0, void 0, function* () {
            if (this.logger) {
                this.logger.debug(`Making GET request to /_initial`);
            }
            return yield this.axiosInstance.get('/_initial').then((res) => {
                this.cookie = (res.headers['set-cookie'] || '').toString();
                if (this.logger) {
                    this.logger.debug(`Got cookies: "${this.cookie}"`);
                }
                this.csrfToken = this.formatToken(res.headers['csrf-token']);
                if (this.logger) {
                    this.logger.debug(`Got csrf token: "${this.csrfToken}"`);
                }
                return this.csrfToken;
            });
        });
        /**
         * Makes a request to the API.
         *
         * Automatically adds the csrf token and cookie to the request.
         *
         * @param method The request method.
         * @param path The request path.
         * @param body The request body.
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
            return yield this.axiosInstance.request(config).then((res) => {
                if (res.headers['set-cookie']) {
                    /*this.cookie = res.headers.get('set-cookie');
                      if (this.debugging) {
                        console.log(`Got cookies: "${this.cookie}"`);
                      }*/
                }
                if (res.headers['csrf-token']) {
                    /*this.csrfToken = this.formatToken(res.headers.get('csrf-token'));
                      if (this.debugging) {
                        console.log(`Got csrf token: "${this.csrfToken}"`);
                      }*/
                }
                return res.data;
            });
        });
        /**
         * Formats a csrf token.
         *
         * @param token The token to format.
         */
        this.formatToken = (token) => {
            var _a;
            if (!token) {
                return '';
            }
            if (Array.isArray(token)) {
                return token[0];
            }
            return (((_a = token
                .split(',')
                .filter((v) => v.trim())
                .shift()) === null || _a === void 0 ? void 0 : _a.trim()) || '');
        };
        this.axiosInstance = axios_1.default.create({
            baseURL: Discuit.baseURL,
            headers: {
                Referer: 'https://discuit.net/',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            },
        });
    }
}
exports.Discuit = Discuit;
/**
 * The base url for the api.
 */
Discuit.baseURL = 'https://discuit.net/api';
