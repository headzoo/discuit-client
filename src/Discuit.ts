import { PostSort, Post, User, ISeenChecker, IFetch, HeaderValue } from './types';
import { MemorySeenChecker } from './MemorySeenChecker';
import { AxiosFetch } from './AxiosFetch';
import { ILogger } from './ILogger';

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
  public watchInterval: NodeJS.Timer | number = 1000 * 60 * 5; // 5 minutes

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
    if (!this.fetcher.hasToken() && !(await this.getToken())) {
      console.warn('Failed to get csrf token');
      return null;
    }

    return await this.fetcher
      .request<User>('POST', '/_login', {
        username,
        password,
      })
      .then((res) => {
        if (!res.data.id) {
          return null;
        }
        this.user = res.data;

        return this.user;
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
            watcher.callbacks[k](post.communityName, post);
            await this.seenChecker.add(post.id);
          }
        }
      }
    }
  };

  /**
   * Submits a comment.
   *
   * @param publicId The public id of the post.
   * @param body The comment body.
   * @param parentCommentId The id of the parent comment.
   */
  public comment = async (
    publicId: string,
    body: string,
    parentCommentId: string | null = null,
  ): Promise<any> => {
    if (!this.user) {
      throw new Error('Not logged in');
    }

    return await this.fetcher
      .request('POST', `/posts/${publicId}/comments?userGroup=normal`, {
        body,
        parentCommentId,
      })
      .then((res) => {
        return res;
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
        return res.data.posts;
      });
  };

  /**
   * Fetches a csrf token from the server.
   *
   * Also stores the token internally for future requests.
   */
  public getToken = async (): Promise<string | null> => {
    if (this.logger) {
      this.logger.debug(`Making GET request to /_initial`);
    }

    return await this.fetcher.request<string | null>('GET', '/_initial').then((res) => {
      return this.formatToken(res.headers['csrf-token']);
    });
  };

  /**
   * Formats a csrf token.
   *
   * @param token The token to format.
   */
  private formatToken = (token: HeaderValue): string => {
    if (!token) {
      return '';
    }

    if (Array.isArray(token)) {
      return token[0];
    }
    if (typeof token === 'number') {
      return token.toString();
    }

    return token.toString();
  };
}
