/**
 * How posts should be sorted.
 */
export type PostSort = 'hot' | 'latest' | 'activity' | 'day' | 'week' | 'month' | 'year';
/**
 * Represents a post link.
 */
export interface Link {
    url: string;
    hostname: string;
    image: {
        mimetype: string;
        width: number;
        height: number;
        size: number;
        averageColor: string;
        url: string;
    };
}
/**
 * Represents a post.
 */
export interface Post {
    id: string;
    type: string;
    publicId: string;
    postPublicId: string;
    userId: string;
    username: string;
    userGroup: string;
    userDeleted: boolean;
    isPinned: boolean;
    communityId: string;
    communityName: string;
    communityProPic: any;
    communityBannerImage: any;
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
