/**
 * How posts should be sorted.
 */
export type PostSort = 'hot' | 'latest' | 'activity' | 'day' | 'week' | 'month' | 'year';
/**
 * The type of post.
 */
export type PostType = 'link';
/**
 * Not real sure what this is.
 */
export type UserGroups = 'normal' | 'moderator' | 'admin';
/**
 * Represents an image.
 */
export interface Image {
    url: string;
    averageColor: string;
    height: number;
    width: number;
    mimetype: string;
    size: number;
    copies: any[];
}
/**
 * Represents a community rule.
 */
export interface CommunityRule {
    id: number;
    communityId: string;
    createdAt: string;
    createdBy: string;
    description: string;
    rule: string;
    zIndex: number;
}
/**
 * The details of a community.
 */
export interface Community {
    id: string;
    about: string;
    bannerImage: Image;
    createdAt: string;
    deletedAt: string | null;
    mods: User[];
    name: string;
    noMembers: number;
    nsfw: boolean;
    proPic?: Image;
    rules: CommunityRule[];
    userId: string;
    userJoined: boolean;
    userMod: boolean;
}
/**
 * Represents a post link.
 */
export interface Link {
    url: string;
    hostname: string;
    image: Image;
}
/**
 * Represents a post.
 */
export interface Post {
    id: string;
    type: PostType;
    publicId: string;
    postPublicId: string;
    userId: string;
    username: string;
    userGroup: string;
    userDeleted: boolean;
    isPinned: boolean;
    community?: Community;
    communityId: string;
    communityName: string;
    communityProPic?: Image;
    communityBannerImage?: Image;
    title: string;
    body: string | null;
    link: Link | null;
    locked: boolean;
    lockedBy: string | null;
    lockedAt: string | null;
    upvotes: number;
    downvotes: number;
    hotness: number;
    createdAt: string;
    editedAt: string | null;
    lastActivityAt: string;
    deleted: boolean;
    deletedAt: string | null;
    deletedContent: boolean;
    noComments: number;
    commentsNext: string;
    userVoted: boolean;
    userVotedUp: boolean;
    comments?: Comment[];
}
/**
 * Represents a comment.
 */
export interface Comment {
    id: string;
    parentId: string | null;
    ancestors: any[];
    body: string;
    communityId: string;
    communityName: string;
    createdAt: string;
    deletedAt: string | null;
    depth: number;
    upvotes: number;
    downvotes: number;
    editedAt: string | null;
    noReplies: number;
    noRepliesDirect: number;
    postDeleted: boolean;
    postId: string;
    postPublicId: string;
    userDeleted: boolean;
    userGroup: UserGroups;
    userId: string;
    userVoted: boolean;
    userVotedUp: boolean;
    username: string;
}
/**
 * The types of notifications.
 */
export type NotificationType = 'new_votes' | 'new_comment';
/**
 * Represents the types of notifications.
 */
export interface Notification {
    id: number;
    type: NotificationType;
    seen: boolean;
    seenAt: string | null;
    createdAt: string;
    notif: {
        comment?: Comment;
        post: Post;
        postId: string;
        targetId?: string;
        targetType?: string;
        commentAuthor?: string;
        commentId?: string;
    };
}
/**
 * Represents a user.
 */
export interface User {
    id: string;
    username: string;
    email: string;
    emailConfirmedAt: string | null;
    aboutMe: string | null;
    points: number;
    isAdmin: boolean;
    noPosts: number;
    noComments: number;
    createdAt: string;
    deletedAt: string | null;
    bannedAt: string | null;
    isBan: boolean;
    notificationsNewCount: number;
    moddingList: null;
}
/**
 * Used to determine whether the watch() command has seen a post before.
 */
export interface ISeenChecker {
    /**
     * Marks a post as seen.
     *
     * @param id The post id.
     */
    add: (id: string) => Promise<void>;
    /**
     * Returns a value indicating whether the post has been seen.
     *
     * @param id The post id.
     */
    isSeen: (id: string) => Promise<boolean>;
}
/**
 * Request methods.
 */
export type Method = 'get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH' | 'purge' | 'PURGE' | 'link' | 'LINK' | 'unlink' | 'UNLINK';
/**
 * Class that makes HTTP requests.
 */
export interface IFetch {
    /**
     * Gets a CSRF token.
     */
    getToken: () => Promise<string | null>;
    /**
     * Makes an HTTP request.
     *
     * @param method The request method.
     * @param path Request path relative to the base URL.
     * @param body The post body.
     */
    request: <T>(method: Method, path: string, body?: any) => Promise<FetchResponse<T> | null>;
    /**
     * Whether the client has a CSRF token.
     */
    hasToken: () => boolean;
}
/**
 * Header value.
 */
export type HeaderValue = string | string[] | number | boolean | null;
/**
 * Map of headers.
 */
export interface Headers {
    [key: string]: HeaderValue;
}
export interface FetchResponse<T> {
    statusCode: number;
    data: any;
    headers: Headers;
}
