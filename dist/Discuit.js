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
    constructor(fetcher) {
        /**
         * Community posts being watched.
         */
        this.watchersPosts = [];
        /**
         * Community comments being watched.
         */
        this.watchersComments = [];
        /**
         * How often the client should check for new posts in the watched communities.
         */
        this.watchTimeout = 1000 * 60 * 10; // 10 minutes
        /**
         * How often the client should check for new comments in the watched communities.
         */
        this.watchCommentsTimeout = 1000 * 60 * 10; // 10 minutes
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
         * Returns the logged-in user.
         */
        this.getMe = () => __awaiter(this, void 0, void 0, function* () {
            return yield this.fetcher.request('GET', '/_user').then((res) => {
                if (!res || !res.data.id) {
                    return null;
                }
                return res.data;
            });
        });
        /**
         * Watches for new posts.
         *
         * @param communities The communities to watch.
         * @param cb The callback.
         */
        this.watchPosts = (communities, cb) => {
            for (let i = 0; i < communities.length; i++) {
                const community = communities[i].toLowerCase();
                const found = this.watchersPosts.find((w) => w.community === community);
                if (found) {
                    found.callbacks.push(cb);
                }
                else {
                    this.watchersPosts.push({ community, callbacks: [cb] });
                }
            }
            if (!this.watchPostsInterval) {
                this.watchPostsInterval = setInterval(this.watchPostsLoop, this.watchTimeout);
                if (this.logger) {
                    this.logger.debug(`Watching ${communities.length} communities at interval ${this.watchTimeout}`);
                }
            }
            // Automatically run the watch loop the first time this method is called.
            this.watchPostsLoop().then();
        };
        /**
         * Stops watching for new posts.
         */
        this.unwatchPosts = () => {
            this.watchersPosts = [];
            clearInterval(this.watchPostsInterval);
            if (this.logger) {
                this.logger.debug('Watching stopped.');
            }
        };
        /**
         * Callback for setInterval.
         *
         * Checks for new posts and calls the callbacks.
         */
        this.watchPostsLoop = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.logger) {
                    this.logger.debug('Running watch loop.');
                }
                const recent = yield this.getPosts('latest', 50);
                for (let i = 0; i < recent.length; i++) {
                    const post = recent[i];
                    // Have we already seen this?
                    if (yield this.seenChecker.isSeen(`post-${post.id}`)) {
                        if (this.logger) {
                            this.logger.debug(`Skipping post ${post.id} because it has already been seen`);
                        }
                        continue;
                    }
                    for (let j = 0; j < this.watchersPosts.length; j++) {
                        const watcher = this.watchersPosts[j];
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
                                yield this.seenChecker.add(`post-${post.id}`);
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
         * Watches for new comments.
         *
         * @param communities The communities to watch.
         * @param cb The callback.
         */
        this.watchComments = (communities, cb) => {
            for (let i = 0; i < communities.length; i++) {
                const community = communities[i].toLowerCase();
                const found = this.watchersComments.find((w) => w.community === community);
                if (found) {
                    found.callbacks.push(cb);
                }
                else {
                    this.watchersComments.push({ community, callbacks: [cb] });
                }
            }
            if (!this.watchCommentsInterval) {
                this.watchCommentsInterval = setInterval(this.watchCommentsLoop, this.watchCommentsTimeout);
                if (this.logger) {
                    this.logger.debug(`Watching ${communities.length} communities at interval ${this.watchTimeout}`);
                }
            }
            // Automatically run the watch loop the first time this method is called.
            this.watchCommentsLoop().then();
        };
        /**
         * Callback for setInterval.
         *
         * Checks for new comments and calls the callbacks.
         */
        this.watchCommentsLoop = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.logger) {
                    this.logger.debug('Running watch loop.');
                }
                for (let i = 0; i < this.watchersComments.length; i++) {
                    const watcher = this.watchersComments[i];
                    const activity = yield this.getPosts('activity', 50, watcher.community);
                    for (let j = 0; j < activity.length; j++) {
                        const post = activity[j];
                        const comments = yield this.getPostComments(post.publicId);
                        for (let k = 0; k < comments.comments.length; k++) {
                            const comment = comments.comments[k];
                            // Have we already seen this?
                            const seenKey = `comment-${comment.id}-${comment.editedAt ? comment.editedAt : '0'}`;
                            if (yield this.seenChecker.isSeen(seenKey)) {
                                if (this.logger) {
                                    this.logger.debug(`Skipping comment ${comment.id} because it has already been seen`);
                                }
                                continue;
                            }
                            for (let l = 0; l < watcher.callbacks.length; l++) {
                                try {
                                    watcher.callbacks[l](post.communityName, comment);
                                }
                                catch (error) {
                                    if (this.logger) {
                                        this.logger.error(error);
                                    }
                                }
                                yield this.seenChecker.add(seenKey);
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
         * Returns the comment with the given id.
         *
         * @param id The comment id.
         */
        this.getComment = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield this.fetcher.request('GET', `/comments/${id}`).then((res) => {
                return res === null || res === void 0 ? void 0 : res.data;
            });
        });
        /**
         * Submits a comment.
         *
         * @param publicId The PUBLIC id of the post.
         * @param body The comment body.
         * @param parentCommentId The id of the parent comment.
         * @param userGroup The user group to submit as.
         */
        this.postComment = (publicId, body, parentCommentId = null, userGroup) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('POST', `/posts/${publicId}/comments?userGroup=${userGroup || 'normal'}`, {
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
         * Votes on a comment.
         *
         * @param commentId The comment id.
         * @param up Whether to upvote or downvote.
         */
        this.voteComment = (commentId, up) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('POST', `/_commentVote`, {
                commentId,
                up,
            })
                .then(() => {
                return true;
            });
        });
        /**
         * Returns the details of a post.
         *
         * @param publicId The PUBLIC id of the post.
         */
        this.getPost = (publicId) => __awaiter(this, void 0, void 0, function* () {
            return yield this.fetcher.request('GET', `/posts/${publicId}`).then((res) => {
                if (!res) {
                    if (this.logger) {
                        this.logger.debug(`Got null response from /posts`);
                    }
                    return null;
                }
                return res.data;
            });
        });
        /**
         * Fetches the latest posts.
         *
         * @param sort How to sort the posts.
         * @param limit The number of posts to fetch
         * @param communityId The community id to fetch posts for.
         */
        this.getPosts = (sort = 'latest', limit = 10, communityId) => __awaiter(this, void 0, void 0, function* () {
            let url = `/posts?sort=${sort}&limit=${limit}`;
            if (communityId) {
                url = `${url}&communityId=${communityId}`;
            }
            return yield this.fetcher.request('GET', url).then((res) => {
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
         * Votes a post up or down and returns the post. If already voted, then changes the vote.
         *
         * @param postId The post id.
         * @param up Whether to upvote or downvote.
         */
        this.votePost = (postId, up) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('POST', `/_postVote`, {
                postId,
                up,
            })
                .then(() => {
                return true;
            });
        });
        /**
         * Returns the comments for the given post.
         *
         * @param publicId The PUBLIC id of the post.
         * @param next The next page of comments.
         * @param parentId The id of the parent comment.
         */
        this.getPostComments = (publicId, next, parentId) => __awaiter(this, void 0, void 0, function* () {
            let url = `/posts/${publicId}/comments`;
            if (next) {
                url += `${url.indexOf('?') === -1 ? '?' : '&'}next=${next}`;
            }
            if (parentId) {
                url += `${url.indexOf('?') === -1 ? '?' : '&'}parentId=${parentId}`;
            }
            return yield this.fetcher.request(`GET`, url).then((res) => {
                if (!res) {
                    if (this.logger) {
                        this.logger.debug(`Got null response from /posts`);
                    }
                    return {
                        comments: [],
                        next: '',
                    };
                }
                return res.data;
            });
        });
        /**
         * Returns all the user's notifications.
         *
         * @param next The next page of notifications.
         */
        this.getNotifications = (next) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('GET', `/notifications${next ? `?next=${next}` : ''}`)
                .then((res) => {
                if (!res) {
                    if (this.logger) {
                        this.logger.debug(`Got null response from /notifications`);
                    }
                    return {
                        count: 0,
                        newCount: 0,
                        next: '',
                        items: [],
                    };
                }
                // Discuit returns null instead of an empty array.
                if (!res.data.items) {
                    res.data.items = [];
                }
                return res.data;
            });
        });
        /**
         * Returns all notifications for the logged-in user.
         *
         * @param maxNexts Max number of times to fetch the next page.
         */
        this.getAllNotifications = (maxNexts = 3) => __awaiter(this, void 0, void 0, function* () {
            const notifications = [];
            let next = undefined;
            let counter = 0;
            do {
                const res = yield this.getNotifications(next);
                notifications.push(...res.items);
                next = res.next;
                counter++;
            } while (next && counter < maxNexts);
            return notifications;
        });
        /**
         * Marks a notification as seen.
         *
         * @param id The notification id.
         */
        this.markNotificationAsSeen = (id) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('PUT', `/notifications/${id}?action=markAsSeen&seen=true`)
                .then(() => {
                return true;
            });
        });
        /**
         * Marks all notifications as seen.
         */
        this.markAllNotificationsAsSeen = () => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('POST', `/notifications?action=markAllAsSeen&type=`) // Not sure why "type" is empty
                .then(() => {
                return true;
            });
        });
        /**
         * Deletes a notification
         *
         * @param id The notification id.
         */
        this.deleteNotification = (id) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher.request('DELETE', `/notifications/${id}`).then(() => {
                return true;
            });
        });
        /**
         * Deletes all notifications.
         */
        this.deleteAllNotifications = () => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher.request('POST', `/notifications?action=deleteAll`).then(() => {
                return true;
            });
        });
        /**
         * Returns an array of the site communities.
         */
        this.getCommunities = () => __awaiter(this, void 0, void 0, function* () {
            return yield this.fetcher.request('GET', '/communities').then((res) => {
                if (!res) {
                    return null;
                }
                return res.data;
            });
        });
        /**
         * Returns the community with the given id.
         *
         * @param communityId The community id.
         */
        this.getCommunity = (communityId) => __awaiter(this, void 0, void 0, function* () {
            return yield this.fetcher
                .request('GET', `/communities/${communityId}`)
                .then((res) => {
                if (!res) {
                    return null;
                }
                return res.data;
            });
        });
        /**
         * Updates a community.
         *
         * @param communityId The community id.
         * @param values The values to update.
         */
        this.updateCommunity = (communityId, values) => __awaiter(this, void 0, void 0, function* () {
            return yield this.fetcher
                .request('PUT', `/communities/${communityId}`, values)
                .then(() => {
                return true;
            });
        });
        /**
         * Make the authenticated user join or leave a community.
         *
         * @param communityId The community id.
         * @param leave Whether to leave the community.
         */
        this.joinCommunity = (communityId, leave) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('POST', `/_joinCommunity`, {
                communityId,
                leave,
            })
                .then(() => {
                return true;
            });
        });
        /**
         * Returns the moderators of the given community.
         *
         * @param communityId The community id.
         */
        this.getCommunityMods = (communityId) => __awaiter(this, void 0, void 0, function* () {
            return yield this.fetcher
                .request('GET', `/communities/${communityId}/mods`)
                .then((res) => {
                if (!res) {
                    return [];
                }
                return res.data;
            });
        });
        /**
         * Adds a moderator to the given community.
         *
         * @param communityId The community id.
         * @param username The username of the user to add as a mod.
         */
        this.addCommunityMod = (communityId, username) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('POST', `/communities/${communityId}/mods`, {
                username,
            })
                .then(() => {
                return true;
            });
        });
        /**
         * Deletes a moderator from the given community.
         *
         * @param communityId The community id.
         * @param username The username of the user to remove as a mod.
         */
        this.deleteCommunityMod = (communityId, username) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('DELETE', `/communities/${communityId}/mods/${username}`)
                .then(() => {
                return true;
            });
        });
        /**
         * Returns the rules for the given community.
         *
         * @param communityId The community id.
         */
        this.getCommunityRules = (communityId) => __awaiter(this, void 0, void 0, function* () {
            return yield this.fetcher
                .request('GET', `/communities/${communityId}/rules`)
                .then((res) => {
                if (!res) {
                    return [];
                }
                return res.data;
            });
        });
        /**
         * Adds a rule from the given community.
         *
         * @param communityId The community id.
         * @param rule The rule.
         * @param description The rule description.
         */
        this.createCommunityRule = (communityId, rule, description) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('POST', `/communities/${communityId}/rules`, {
                rule,
                description,
            })
                .then((res) => {
                if (!res) {
                    return null;
                }
                return res.data;
            });
        });
        /**
         * Updates a community rule.
         *
         * @param communityId The community id.
         * @param ruleId The rule id.
         * @param rule The rule.
         */
        this.updateCommunityRule = (communityId, ruleId, rule) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('PUT', `/communities/${communityId}/rules/${ruleId}`, rule)
                .then(() => {
                return true;
            });
        });
        /**
         * Deletes a community rule.
         *
         * @param communityId The community id.
         * @param ruleId The rule id.
         */
        this.deleteCommunityRule = (communityId, ruleId) => __awaiter(this, void 0, void 0, function* () {
            this.authCheck();
            return yield this.fetcher
                .request('DELETE', `/communities/${communityId}/rules/${ruleId}`)
                .then(() => {
                return true;
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
        this.fetcher = fetcher || new AxiosFetch_1.AxiosFetch(this.logger);
    }
}
exports.Discuit = Discuit;
