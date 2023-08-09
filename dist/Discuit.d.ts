/// <reference types="node" />
import { PostSort, Post, User, ISeenChecker, IFetch, UserGroups, Comment } from './types';
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
     * Sets a logger that will be used to log messages.
     */
    logger: ILogger | null;
    /**
     * Makes the HTTP requests to the api.
     */
    readonly fetcher: IFetch;
    /**
     * The authenticated user.
     */
    user: User | null;
    /**
     * Communities being watched.
     */
    protected watchers: Watcher[];
    /**
     * The timer used to run the watch loop.
     */
    private watchInterval;
    /**
     * How often the client should check for new posts in the watched communities.
     */
    watchTimeout: NodeJS.Timeout | number;
    /**
     * How long to wait between callbacks in the watch loop.
     */
    sleepPeriod: number;
    /**
     * Keeps track of which posts the watch() command has seen.
     */
    seenChecker: ISeenChecker;
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
     * Callback for setInterval.
     *
     * Checks for new posts and calls the callbacks.
     */
    protected watchLoop: () => Promise<void>;
    /**
     * Submits a comment.
     *
     * @param publicId The PUBLIC id of the post.
     * @param body The comment body.
     * @param parentCommentId The id of the parent comment.
     */
    postComment: (publicId: string, body: string, parentCommentId?: string | null) => Promise<Comment | null>;
    /**
     * Deletes a comment.
     *
     * @param postId The PRIVATE id of the post.
     * @param commentId The comment id.
     * @param as The user group to delete as.
     */
    deleteComment: (postId: string, commentId: string, as?: UserGroups) => Promise<boolean>;
    /**
     * Updates a comment.
     *
     * @param publicId The PUBLIC id of the post.
     * @param commentId The comment id.
     * @param body The comment body.
     */
    updateComment: (publicId: string, commentId: string, body: string) => Promise<Comment | null>;
    /**
     * Fetches the latest posts.
     *
     * @param sort How to sort the posts.
     * @param limit The number of posts to fetch
     */
    getPosts: (sort?: PostSort, limit?: number) => Promise<Post[]>;
}
