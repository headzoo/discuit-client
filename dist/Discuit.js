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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Discuit = void 0;
const MemorySeenChecker_1 = require("./MemorySeenChecker");
const AxiosFetch_1 = require("./AxiosFetch");
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
         * Logs into the server.
         *
         * @param username The username.
         * @param password The password.
         */
        this.login = (username, password) => __awaiter(this, void 0, void 0, function* () {
            if (!this.fetcher.hasToken() && !(yield this.getToken())) {
                console.warn('Failed to get csrf token');
                return null;
            }
            return yield this.fetcher
                .request('POST', '/_login', {
                username,
                password,
            })
                .then((res) => {
                if (!res.data.id) {
                    return null;
                }
                this.user = res.data;
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
            return yield this.fetcher
                .request('POST', `/posts/${publicId}/comments?userGroup=normal`, {
                body,
                parentCommentId,
            })
                .then((res) => {
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
            return yield this.fetcher
                .request('GET', `/posts?sort=${sort}&limit=${limit}`)
                .then((res) => {
                return res.data.posts;
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
            return yield this.fetcher.request('GET', '/_initial').then((res) => {
                return this.formatToken(res.headers['csrf-token']);
            });
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
        this.fetcher = new AxiosFetch_1.AxiosFetch(this.logger);
    }
}
exports.Discuit = Discuit;
