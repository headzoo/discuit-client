import { PostSort, Post, User, ISeenChecker, IFetch, UserGroups, Comment } from './types';
import { MemorySeenChecker } from './MemorySeenChecker';
import { AxiosFetch } from './AxiosFetch';
import { ILogger } from './ILogger';
import { sleep } from './utils';

export type WatchCallback = (community: string, post: Post) => void;
export interface Watcher {
  community: string;
  callbacks: WatchCallback[];
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
  public readonly fetcher: IFetch;

  /**
   * The authenticated user.
   */
  public user: User | null;

  /**
   * Communities being watched.
   */
  protected watchers: Watcher[] = [];

  /**
   * How often the client should check for new posts in the watched communities.
   */
  public watchInterval: NodeJS.Timer | number = 1000 * 60 * 10; // 10 minutes

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
  constructor() {
    this.fetcher = new AxiosFetch(this.logger);
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
  public watch = (communities: string[], cb: (community: string, post: Post) => void): void => {
    for (let i = 0; i < communities.length; i++) {
      const community = communities[i].toLowerCase();

      const found = this.watchers.find((w) => w.community === community);
      if (found) {
        found.callbacks.push(cb);
      } else {
        this.watchers.push({ community, callbacks: [cb] });
      }
    }

    if (!this.watchInterval) {
      this.watchInterval = setInterval(this.watchLoop, this.watchInterval as number);
    }
    this.watchLoop().then();
  };

  /**
   * Callback for setInterval.
   *
   * Checks for new posts and calls the callbacks.
   */
  protected watchLoop = async (): Promise<void> => {
    try {
      if (this.logger) {
        this.logger.debug('Running watch loop.');
      }

      const recent = await this.getPosts('latest', 50);
      for (let i = 0; i < recent.length; i++) {
        const post = recent[i];

        // Have we already seen this?
        if (await this.seenChecker.isSeen(post.id)) {
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
              } catch (error) {
                if (this.logger) {
                  this.logger.error(error as string);
                }
              }

              await this.seenChecker.add(post.id);
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
    if (!this.user) {
      throw new Error('Not logged in');
    }

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
    if (!this.user) {
      throw new Error('Not logged in');
    }

    return await this.fetcher
      .request('DELETE', `/posts/${postId}/comments/${commentId}?deleteAs=${as || 'normal'}`)
      .then(() => {
        return true;
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
}
