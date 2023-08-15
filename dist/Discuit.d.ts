/// <reference types="node" />
import { PostSort, Post, User, Notification, ISeenChecker, IFetch, UserGroups, Comment, Community, CommunityRule } from './types';
import { ILogger } from './ILogger';
/**
 * Callback given to the watchPosts() method.
 */
export type WatchPostsCallback = (community: string, post: Post) => void;
/**
 * Represents a post watcher.
 */
export interface PostWatcher {
    community: string;
    callbacks: WatchPostsCallback[];
}
/**
 * Callback given to the watchComments() method.
 */
export type WatchCommentsCallback = (community: string, comment: Comment) => void;
/**
 * Represents a comment watcher.
 */
export interface CommentWatcher {
    community: string;
    callbacks: WatchCommentsCallback[];
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
    fetcher: IFetch;
    /**
     * The authenticated user.
     */
    user: User | null;
    /**
     * Community posts being watched.
     */
    protected watchersPosts: PostWatcher[];
    /**
     * Community comments being watched.
     */
    protected watchersComments: CommentWatcher[];
    /**
     * The timer used to run the watch posts loop.
     */
    private watchPostsInterval;
    /**
     * The timer used to run the watch comments loop.
     */
    protected watchCommentsInterval: NodeJS.Timer | number;
    /**
     * How often the client should check for new posts in the watched communities.
     */
    watchTimeout: NodeJS.Timeout | number;
    /**
     * How often the client should check for new comments in the watched communities.
     */
    watchCommentsTimeout: NodeJS.Timeout | number;
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
    constructor(fetcher?: IFetch);
    /**
     * Logs into the server.
     *
     * @param username The username.
     * @param password The password.
     */
    login: (username: string, password: string) => Promise<User | null>;
    /**
     * Returns the logged-in user.
     */
    getMe: () => Promise<User | null>;
    /**
     * Watches for new posts.
     *
     * @param communities The communities to watch.
     * @param cb The callback.
     */
    watchPosts: (communities: string[], cb: WatchPostsCallback) => void;
    /**
     * Stops watching for new posts.
     */
    unwatchPosts: () => void;
    /**
     * Callback for setInterval.
     *
     * Checks for new posts and calls the callbacks.
     */
    protected watchPostsLoop: () => Promise<void>;
    /**
     * Watches for new comments.
     *
     * @param communities The communities to watch.
     * @param cb The callback.
     */
    watchComments: (communities: string[], cb: WatchCommentsCallback) => void;
    /**
     * Callback for setInterval.
     *
     * Checks for new comments and calls the callbacks.
     */
    private watchCommentsLoop;
    /**
     * Returns the comment with the given id.
     *
     * @param id The comment id.
     */
    getComment: (id: string) => Promise<Comment | null>;
    /**
     * Submits a comment.
     *
     * @param publicId The PUBLIC id of the post.
     * @param body The comment body.
     * @param parentCommentId The id of the parent comment.
     * @param userGroup The user group to submit as.
     */
    postComment: (publicId: string, body: string, parentCommentId?: string | null, userGroup?: 'normal' | 'mods') => Promise<Comment | null>;
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
     * Votes on a comment.
     *
     * @param commentId The comment id.
     * @param up Whether to upvote or downvote.
     */
    voteComment: (commentId: string, up: boolean) => Promise<boolean>;
    /**
     * Returns the details of a post.
     *
     * @param publicId The PUBLIC id of the post.
     */
    getPost: (publicId: string) => Promise<Post | null>;
    /**
     * Fetches the latest posts.
     *
     * @param sort How to sort the posts.
     * @param limit The number of posts to fetch
     * @param next The next page of posts.
     * @param communityId The community id to fetch posts for.
     */
    getPosts: (sort?: PostSort, limit?: number, next?: string, communityId?: string) => Promise<{
        posts: Post[];
        next: string;
    } | null>;
    /**
     * Votes a post up or down and returns the post. If already voted, then changes the vote.
     *
     * @param postId The post id.
     * @param up Whether to upvote or downvote.
     */
    votePost: (postId: string, up: boolean) => Promise<boolean>;
    /**
     * Returns the comments for the given post.
     *
     * @param publicId The PUBLIC id of the post.
     * @param next The next page of comments.
     * @param parentId The id of the parent comment.
     */
    getPostComments: (publicId: string, next?: string, parentId?: string) => Promise<{
        comments: Comment[];
        next: string;
    }>;
    /**
     * Returns all the user's notifications.
     *
     * @param next The next page of notifications.
     */
    getNotifications: (next?: string) => Promise<{
        count: number;
        newCount: number;
        next: string;
        items: Notification[];
    }>;
    /**
     * Returns all notifications for the logged-in user.
     *
     * @param maxNexts Max number of times to fetch the next page.
     */
    getAllNotifications: (maxNexts?: number) => Promise<Notification[]>;
    /**
     * Marks a notification as seen.
     *
     * @param id The notification id.
     */
    markNotificationAsSeen: (id: string) => Promise<boolean>;
    /**
     * Marks all notifications as seen.
     */
    markAllNotificationsAsSeen: () => Promise<boolean>;
    /**
     * Deletes a notification
     *
     * @param id The notification id.
     */
    deleteNotification: (id: string) => Promise<boolean>;
    /**
     * Deletes all notifications.
     */
    deleteAllNotifications: () => Promise<boolean>;
    /**
     * Returns an array of the site communities.
     */
    getCommunities: () => Promise<Community[]>;
    /**
     * Returns the community with the given id.
     *
     * @param communityId The community id.
     */
    getCommunity: (communityId: string) => Promise<Community | null>;
    /**
     * Updates a community.
     *
     * @param communityId The community id.
     * @param values The values to update.
     */
    updateCommunity: (communityId: string, values: Partial<Community>) => Promise<boolean>;
    /**
     * Make the authenticated user join or leave a community.
     *
     * @param communityId The community id.
     * @param leave Whether to leave the community.
     */
    joinCommunity: (communityId: string, leave: boolean) => Promise<boolean>;
    /**
     * Returns the moderators of the given community.
     *
     * @param communityId The community id.
     */
    getCommunityMods: (communityId: string) => Promise<User[]>;
    /**
     * Adds a moderator to the given community.
     *
     * @param communityId The community id.
     * @param username The username of the user to add as a mod.
     */
    addCommunityMod: (communityId: string, username: string) => Promise<boolean>;
    /**
     * Deletes a moderator from the given community.
     *
     * @param communityId The community id.
     * @param username The username of the user to remove as a mod.
     */
    deleteCommunityMod: (communityId: string, username: string) => Promise<boolean>;
    /**
     * Returns the rules for the given community.
     *
     * @param communityId The community id.
     */
    getCommunityRules: (communityId: string) => Promise<CommunityRule[]>;
    /**
     * Adds a rule from the given community.
     *
     * @param communityId The community id.
     * @param rule The rule.
     * @param description The rule description.
     */
    createCommunityRule: (communityId: string, rule: string, description: string) => Promise<CommunityRule | null>;
    /**
     * Updates a community rule.
     *
     * @param communityId The community id.
     * @param ruleId The rule id.
     * @param rule The rule.
     */
    updateCommunityRule: (communityId: string, ruleId: number, rule: Partial<CommunityRule>) => Promise<boolean>;
    /**
     * Deletes a community rule.
     *
     * @param communityId The community id.
     * @param ruleId The rule id.
     */
    deleteCommunityRule: (communityId: string, ruleId: number) => Promise<boolean>;
    /**
     * Throws an exception if the lib isn't authenticated.
     */
    private authCheck;
    /**
     * Returns a boolean indicating whether the code is being run in a browser.
     */
    private isBrowser;
}
