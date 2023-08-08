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
export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'purge'
  | 'PURGE'
  | 'link'
  | 'LINK'
  | 'unlink'
  | 'UNLINK';

/**
 * Class that makes HTTP requests.
 */
export interface IFetch {
  /**
   * Makes an HTTP request.
   *
   * @param method The request method.
   * @param path Request path relative to the base URL.
   * @param body The post body.
   */
  request: <T>(method: Method, path: string, body?: any) => Promise<FetchResponse<T>>;

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
