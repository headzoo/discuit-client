import axios from 'axios';
/**
 * Represents a Discuit client.
 */
export class Discuit {
    /**
     * The base url for the api.
     */
    static baseURL = 'https://discuit.net/api';
    /**
     * Used to make http requests.
     */
    axiosInstance;
    /**
     * Sets a logger that will be used to log messages.
     */
    logger;
    /**
     * The authenticated user.
     */
    user;
    /**
     * Communities being watched.
     */
    watchers;
    /**
     * How often the client should check for new posts in the watched communities.
     */
    watchInterval = 1000 * 60 * 5; // 5 minutes
    /**
     * Posts that have been seen by the watcher.
     */
    seenPosts = [];
    /**
     * The current csrf token.
     */
    csrfToken = null;
    /**
     * The session cookie.
     */
    cookie = null;
    /**
     * Constructor
     */
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: Discuit.baseURL,
            headers: {
                Referer: 'https://discuit.net/',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            },
        });
    }
    /**
     * Logs into the server.
     *
     * @param username The username.
     * @param password The password.
     */
    login = async (username, password) => {
        if (!this.csrfToken || !this.cookie) {
            if (!(await this.getToken())) {
                console.warn('Failed to get csrf token');
                return null;
            }
        }
        return await this.request('POST', '/_login', {
            username,
            password,
        }).then((res) => {
            if (!res.id) {
                return null;
            }
            this.user = res;
            return this.user;
        });
    };
    /**
     * Watches for new posts.
     *
     * @param communities The communities to watch.
     * @param cb The callback.
     */
    watch = async (communities, cb) => {
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
    };
    /**
     * Submits a comment.
     *
     * @param publicId The public id of the post.
     * @param body The comment body.
     * @param parentCommentId The id of the parent comment.
     */
    comment = async (publicId, body, parentCommentId = null) => {
        if (!this.user) {
            throw new Error('Not logged in');
        }
        return await this.request('POST', `/posts/${publicId}/comments?userGroup=normal`, {
            body,
            parentCommentId,
        }).then((res) => {
            return res;
        });
    };
    /**
     * Fetches the latest posts.
     *
     * @param sort How to sort the posts.
     * @param limit The number of posts to fetch
     */
    getPosts = async (sort = 'latest', limit = 10) => {
        return await this.request('GET', `/posts?sort=${sort}&limit=${limit}`).then((res) => {
            return res.posts;
        });
    };
    /**
     * Callback for setInterval.
     *
     * Checks for new posts and calls the callbacks.
     */
    watchLoop = async () => {
        const recent = await this.getPosts('latest', 50);
        for (let i = 0; i < recent.length; i++) {
            const post = recent[i];
            if (this.seenPosts.includes(post.id)) {
                continue;
            }
            for (let j = 0; j < this.watchers.length; j++) {
                const watcher = this.watchers[j];
                if (watcher.community === post.communityName.toLowerCase()) {
                    for (let k = 0; k < watcher.callbacks.length; k++) {
                        watcher.callbacks[k](post.communityName, post);
                        this.seenPosts.push(post.id);
                    }
                }
            }
        }
    };
    /**
     * Fetches a csrf token from the server.
     *
     * Also stores the token internally for future requests.
     */
    getToken = async () => {
        if (this.logger) {
            this.logger.debug(`Making GET request to /_initial`);
        }
        return await this.axiosInstance.get('/_initial').then((res) => {
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
    };
    /**
     * Makes a request to the API.
     *
     * Automatically adds the csrf token and cookie to the request.
     *
     * @param method The request method.
     * @param path The request path.
     * @param body The request body.
     */
    request = async (method, path, body = null) => {
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
        return await this.axiosInstance.request(config).then((res) => {
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
    };
    /**
     * Formats a csrf token.
     *
     * @param token The token to format.
     */
    formatToken = (token) => {
        if (!token) {
            return '';
        }
        if (Array.isArray(token)) {
            return token[0];
        }
        return (token
            .split(',')
            .filter((v) => v.trim())
            .shift()
            ?.trim() || '');
    };
}