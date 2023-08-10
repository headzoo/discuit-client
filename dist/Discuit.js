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
const utils_1 = require("./utils");
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
        this.watchTimeout = 1000 * 60 * 10; // 10 minutes
        /**
         * How long to wait between callbacks in the watch loop.
         */
        this.sleepPeriod = 5000; // 5 seconds
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
            if (!this.fetcher.hasToken() && !(yield this.fetcher.getToken())) {
                if (this.logger) {
                    this.logger.warn('Failed to get csrf token');
                }
                return null;
            }
            return yield this.fetcher
                .request('POST', '/_login', {
                username,
                password,
            })
                .then((res) => {
                if (!res || !res.data.id) {
                    return null;
                }
                this.user = res.data;
                return this.user;
            })
                .catch((err) => {
                if (this.logger) {
                    this.logger.error(`Failed to login: ${err.response.status}`);
                }
                return null;
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
                this.watchInterval = setInterval(this.watchLoop, this.watchTimeout);
                if (this.logger) {
                    this.logger.debug(`Watching ${communities.length} communities at interval ${this.watchInterval}`);
                }
            }
            // Automatically run the watch loop the first time this method is called.
            this.watchLoop().then();
        };
        /**
         * Stops watching for new posts.
         */
        this.unwatch = () => {
            this.watchers = [];
            clearInterval(this.watchInterval);
            if (this.logger) {
                this.logger.debug('Watching stopped.');
            }
        };
        /**
         * Callback for setInterval.
         *
         * Checks for new posts and calls the callbacks.
         */
        this.watchLoop = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.logger) {
                    this.logger.debug('Running watch loop.');
                }
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
                                try {
                                    watcher.callbacks[k](post.communityName, post);
                                }
                                catch (error) {
                                    if (this.logger) {
                                        this.logger.error(error);
                                    }
                                }
                                yield this.seenChecker.add(post.id);
                                yield (0, utils_1.sleep)(this.sleepPeriod);
                            }
                        }
                    }
                }
            }
            catch (error) {
                if (this.logger) {
                    this.logger.error(error);
                }
            }
        });
        /**
         * Submits a comment.
         *
         * @param publicId The PUBLIC id of the post.
         * @param body The comment body.
         * @param parentCommentId The id of the parent comment.
         */
        this.postComment = (publicId, body, parentCommentId = null) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('POST', `/posts/${publicId}/comments?userGroup=normal`, {
                body,
                parentCommentId,
            })
                .then((res) => {
                return res === null || res === void 0 ? void 0 : res.data;
            });
        });
        /**
         * Deletes a comment.
         *
         * @param postId The PRIVATE id of the post.
         * @param commentId The comment id.
         * @param as The user group to delete as.
         */
        this.deleteComment = (postId, commentId, as) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('DELETE', `/posts/${postId}/comments/${commentId}?deleteAs=${as || 'normal'}`)
                .then(() => {
                return true;
            });
        });
        /**
         * Updates a comment.
         *
         * @param publicId The PUBLIC id of the post.
         * @param commentId The comment id.
         * @param body The comment body.
         */
        this.updateComment = (publicId, commentId, body) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('PUT', `/posts/${publicId}/comments/${commentId}`, {
                body,
            })
                .then((res) => {
                return res === null || res === void 0 ? void 0 : res.data;
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
                if (!res) {
                    if (this.logger) {
                        this.logger.debug(`Got null response from /posts`);
                    }
                    return [];
                }
                return res.data.posts;
            });
        });
        /**
         * Returns all the user's notifications.
         */
        this.getNotifications = () => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('GET', `/notifications`)
                .then((res) => {
                if (!res) {
                    if (this.logger) {
                        this.logger.debug(`Got null response from /notifications`);
                    }
                    return [];
                }
                return res.data.items;
            });
        });
        /**
         * Throws an exception if the lib isn't authenticated.
         */
        this.authCheck = () => {
            if (!this.isBrowser() && !this.user) {
                throw new Error('Not authenticated. Must login first.');
            }
        };
        /**
         * Returns a boolean indicating whether the code is being run in a browser.
         */
        this.isBrowser = () => typeof window !== 'undefined' && typeof window.document !== 'undefined';
        this.fetcher = new AxiosFetch_1.AxiosFetch(this.logger);
    }
}
exports.Discuit = Discuit;
