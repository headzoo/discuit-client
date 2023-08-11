import {
  PostSort,
  Post,
  User,
  Notification,
  ISeenChecker,
  IFetch,
  UserGroups,
  Comment,
} from './types';
import { MemorySeenChecker } from './MemorySeenChecker';
import { AxiosFetch } from './AxiosFetch';
import { ILogger } from './ILogger';
import { sleep } from './utils';

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
export class Discuit {
  /**
   * Sets a logger that will be used to log messages.
   */
  public logger: ILogger | null;

  /**
   * Makes the HTTP requests to the api.
   */
  public fetcher: IFetch;

  /**
   * The authenticated user.
   */
  public user: User | null;

  /**
   * Community posts being watched.
   */
  protected watchersPosts: PostWatcher[] = [];

  /**
   * Community comments being watched.
   */
  protected watchersComments: CommentWatcher[] = [];

  /**
   * The timer used to run the watch posts loop.
   */
  private watchPostsInterval: NodeJS.Timer | number;

  /**
   * The timer used to run the watch comments loop.
   */
  protected watchCommentsInterval: NodeJS.Timer | number;

  /**
   * How often the client should check for new posts in the watched communities.
   */
  public watchTimeout: NodeJS.Timeout | number = 1000 * 60 * 10; // 10 minutes

  /**
   * How often the client should check for new comments in the watched communities.
   */
  public watchCommentsTimeout: NodeJS.Timeout | number = 1000 * 60 * 10; // 10 minutes

  /**
   * How long to wait between callbacks in the watch loop.
   */
  public sleepPeriod: number = 5000; // 5 seconds

  /**
   * Keeps track of which posts the watch() command has seen.
   */
  public seenChecker: ISeenChecker = new MemorySeenChecker();

  /**
   * Constructor
   */
  constructor(fetcher?: IFetch) {
    this.fetcher = fetcher || new AxiosFetch(this.logger);
  }

  /**
   * Logs into the server.
   *
   * @param username The username.
   * @param password The password.
   */
  public login = async (username: string, password: string): Promise<User | null> => {
    if (!this.fetcher.hasToken() && !(await this.fetcher.getToken())) {
      if (this.logger) {
        this.logger.warn('Failed to get csrf token');
      }
      return null;
    }

    return await this.fetcher
      .request<User>('POST', '/_login', {
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
  };

  /**
   * Watches for new posts.
   *
   * @param communities The communities to watch.
   * @param cb The callback.
   */
  public watchPosts = (communities: string[], cb: WatchPostsCallback): void => {
    for (let i = 0; i < communities.length; i++) {
      const community = communities[i].toLowerCase();

      const found = this.watchersPosts.find((w) => w.community === community);
      if (found) {
        found.callbacks.push(cb);
      } else {
        this.watchersPosts.push({ community, callbacks: [cb] });
      }
    }

    if (!this.watchPostsInterval) {
      this.watchPostsInterval = setInterval(this.watchPostsLoop, this.watchTimeout as number);
      if (this.logger) {
        this.logger.debug(
          `Watching ${communities.length} communities at interval ${this.watchPostsInterval}`,
        );
      }
    }

    // Automatically run the watch loop the first time this method is called.
    this.watchPostsLoop().then();
  };

  /**
   * Stops watching for new posts.
   */
  public unwatchPosts = (): void => {
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
  protected watchPostsLoop = async (): Promise<void> => {
    try {
      if (this.logger) {
        this.logger.debug('Running watch loop.');
      }

      const recent = await this.getPosts('latest', 50);
      for (let i = 0; i < recent.length; i++) {
        const post = recent[i];

        // Have we already seen this?
        if (await this.seenChecker.isSeen(`post-${post.id}`)) {
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
              } catch (error) {
                if (this.logger) {
                  this.logger.error(error as string);
                }
              }

              await this.seenChecker.add(`post-${post.id}`);
              await sleep(this.sleepPeriod);
            }
          }
        }
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error(error as string);
      }
    }
  };

  /**
   * Watches for new comments.
   *
   * @param communities The communities to watch.
   * @param cb The callback.
   */
  public watchComments = (communities: string[], cb: WatchCommentsCallback): void => {
    for (let i = 0; i < communities.length; i++) {
      const community = communities[i].toLowerCase();

      const found = this.watchersComments.find((w) => w.community === community);
      if (found) {
        found.callbacks.push(cb);
      } else {
        this.watchersComments.push({ community, callbacks: [cb] });
      }
    }

    if (!this.watchCommentsInterval) {
      this.watchCommentsInterval = setInterval(
        this.watchCommentsLoop,
        this.watchCommentsTimeout as number,
      );
      if (this.logger) {
        this.logger.debug(
          `Watching ${communities.length} communities at interval ${this.watchCommentsInterval}`,
        );
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
  private watchCommentsLoop = async (): Promise<void> => {};

  /**
   * Returns the comment with the given id.
   *
   * @param id The comment id.
   */
  public getComment = async (id: string): Promise<Comment | null> => {
    return await this.fetcher.request('GET', `/comments/${id}`).then((res) => {
      return res?.data;
    });
  };

  /**
   * Submits a comment.
   *
   * @param publicId The PUBLIC id of the post.
   * @param body The comment body.
   * @param parentCommentId The id of the parent comment.
   */
  public postComment = async (
    publicId: string,
    body: string,
    parentCommentId: string | null = null,
  ): Promise<Comment | null> => {
    this.authCheck();

    return await this.fetcher
      .request('POST', `/posts/${publicId}/comments?userGroup=normal`, {
        body,
        parentCommentId,
      })
      .then((res) => {
        return res?.data;
      });
  };

  /**
   * Deletes a comment.
   *
   * @param postId The PRIVATE id of the post.
   * @param commentId The comment id.
   * @param as The user group to delete as.
   */
  public deleteComment = async (
    postId: string,
    commentId: string,
    as?: UserGroups,
  ): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request('DELETE', `/posts/${postId}/comments/${commentId}?deleteAs=${as || 'normal'}`)
      .then(() => {
        return true;
      });
  };

  /**
   * Updates a comment.
   *
   * @param publicId The PUBLIC id of the post.
   * @param commentId The comment id.
   * @param body The comment body.
   */
  public updateComment = async (
    publicId: string,
    commentId: string,
    body: string,
  ): Promise<Comment | null> => {
    this.authCheck();

    return await this.fetcher
      .request('PUT', `/posts/${publicId}/comments/${commentId}`, {
        body,
      })
      .then((res) => {
        return res?.data;
      });
  };

  /**
   * Returns the details of a post.
   *
   * @param publicId The PUBLIC id of the post.
   */
  public getPost = async (publicId: string): Promise<Post | null> => {
    return await this.fetcher.request<Post>('GET', `/posts/${publicId}`).then((res) => {
      if (!res) {
        if (this.logger) {
          this.logger.debug(`Got null response from /posts`);
        }

        return null;
      }

      return res.data;
    });
  };

  /**
   * Fetches the latest posts.
   *
   * @param sort How to sort the posts.
   * @param limit The number of posts to fetch
   */
  public getPosts = async (sort: PostSort = 'latest', limit: number = 10): Promise<Post[]> => {
    return await this.fetcher
      .request<{ posts: Post[] }>('GET', `/posts?sort=${sort}&limit=${limit}`)
      .then((res) => {
        if (!res) {
          if (this.logger) {
            this.logger.debug(`Got null response from /posts`);
          }

          return [];
        }

        return res.data.posts;
      });
  };

  /**
   * Returns all the user's notifications.
   *
   * @param next The next page of notifications.
   */
  public getNotifications = async (
    next?: string,
  ): Promise<{ count: number; newCount: number; next: string; items: Notification[] }> => {
    this.authCheck();

    return await this.fetcher
      .request<{ count: number; newCount: number; next: string; items: Notification[] }>(
        'GET',
        `/notifications${next ? `?next=${next}` : ''}`,
      )
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

        return res.data;
      });
  };

  /**
   * Returns all notifications for the logged-in user.
   *
   * @param maxNexts Max number of times to fetch the next page.
   */
  public getAllNotifications = async (maxNexts: number = 3): Promise<Notification[]> => {
    const notifications: Notification[] = [];
    let next: string | undefined = undefined;
    let counter = 0;

    do {
      const res = await this.getNotifications(next);
      notifications.push(...res.items);
      next = res.next;
      counter++;
    } while (next && counter < maxNexts);

    return notifications;
  };

  /**
   * Marks a notification as seen.
   *
   * @param id The notification id.
   */
  public markNotificationAsSeen = async (id: string): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request('PUT', `/notifications/${id}?action=markAsSeen&seen=true`)
      .then(() => {
        return true;
      });
  };

  /**
   * Marks all notifications as seen.
   */
  public markAllNotificationsAsSeen = async (): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request('POST', `/notifications?action=markAllAsSeen&type=`) // Not sure why "type" is empty
      .then(() => {
        return true;
      });
  };

  /**
   * Deletes a notification
   *
   * @param id The notification id.
   */
  public deleteNotification = async (id: string): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher.request('DELETE', `/notifications/${id}`).then(() => {
      return true;
    });
  };

  /**
   * Deletes all notifications.
   */
  public deleteAllNotifications = async (): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher.request('POST', `/notifications?action=deleteAll`).then(() => {
      return true;
    });
  };

  /**
   * Throws an exception if the lib isn't authenticated.
   */
  private authCheck = () => {
    if (!this.isBrowser() && !this.user) {
      throw new Error('Not authenticated. Must login first.');
    }
  };

  /**
   * Returns a boolean indicating whether the code is being run in a browser.
   */
  private isBrowser = () => typeof window !== 'undefined' && typeof window.document !== 'undefined';
}
