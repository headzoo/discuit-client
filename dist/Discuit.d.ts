/// <reference types="node" />
import { AxiosInstance } from 'axios';
import { PostSort, Post, User, ISeenChecker } from './types';
import { ILogger } from './ILogger';
export type WatchCallback = (community: string, post: Post) => void;
export interface Watcher {
    community: string;
    callbacks: WatchCallback[];
}
/**
 * Represents a Discuit client.
 */
export declare class Discuit {
    /**
     * The base url for the api.
     */
    static readonly baseURL = "https://discuit.net/api";
    /**
     * Used to make http requests.
     */
    axiosInstance: AxiosInstance;
    /**
     * Sets a logger that will be used to log messages.
     */
    logger: ILogger | null;
    /**
     * The authenticated user.
     */
    user: User | null;
    /**
     * Communities being watched.
     */
    protected watchers: Watcher[];
    /**
     * How often the client should check for new posts in the watched communities.
     */
    watchInterval: NodeJS.Timer | number;
    /**
     * Keeps track of which posts the watch() command has seen.
     */
    seenChecker: ISeenChecker;
    /**
     * The current csrf token.
     */
    protected csrfToken: string | null;
    /**
     * The session cookie.
     */
    protected cookie: string | null;
    /**
     * Constructor
     */
    constructor();
    /**
     * Logs into the server.
     *
     * @param username The username.
     * @param password The password.
     */
    login: (username: string, password: string) => Promise<User | null>;
    /**
     * Watches for new posts.
     *
     * @param communities The communities to watch.
     * @param cb The callback.
     */
    watch: (communities: string[], cb: (community: string, post: Post) => void) => void;
    /**
     * Submits a comment.
     *
     * @param publicId The public id of the post.
     * @param body The comment body.
     * @param parentCommentId The id of the parent comment.
     */
    comment: (publicId: string, body: string, parentCommentId?: string | null) => Promise<any>;
    /**
     * Fetches the latest posts.
     *
     * @param sort How to sort the posts.
     * @param limit The number of posts to fetch
     */
    getPosts: (sort?: PostSort, limit?: number) => Promise<Post[]>;
    /**
     * Callback for setInterval.
     *
     * Checks for new posts and calls the callbacks.
     */
    protected watchLoop: () => Promise<void>;
    /**
     * Fetches a csrf token from the server.
     *
     * Also stores the token internally for future requests.
     */
    getToken: () => Promise<string | null>;
    /**
     * Makes a request to the API.
     *
     * Automatically adds the csrf token and cookie to the request.
     *
     * @param method The request method.
     * @param path The request path.
     * @param body The request body.
     */
    private request;
    /**
     * Formats a csrf token.
     *
     * @param token The token to format.
     */
    private formatToken;
}
