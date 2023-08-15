import {
  PostSort,
  Post,
  User,
  Notification,
  ISeenChecker,
  IFetch,
  UserGroups,
  Comment,
  Community,
  CommunityRule,
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
   * Returns the logged-in user.
   */
  public getMe = async (): Promise<User | null> => {
    return await this.fetcher.request<User>('GET', '/_user').then((res) => {
      if (!res || !res.data.id) {
        return null;
      }

      return res.data;
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
          `Watching ${communities.length} communities at interval ${this.watchTimeout}`,
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
      if (!recent) {
        if (this.logger) {
          this.logger.debug('getPosts return null.');
        }
        return;
      }

      for (let i = 0; i < recent.posts.length; i++) {
        const post = recent.posts[i];

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
          `Watching ${communities.length} communities at interval ${this.watchTimeout}`,
        );
      }
    }

    // Automatically run the watch loop the first time this method is called.
    this.watchCommentsLoop().then();
  };

  /**
   * Stops watching for new comments.
   */
  public unwatchComments = (): void => {
    this.watchersComments = [];
    clearInterval(this.watchCommentsInterval);
    if (this.logger) {
      this.logger.debug('Watching stopped.');
    }
  };

  /**
   * Callback for setInterval.
   *
   * Checks for new comments and calls the callbacks.
   */
  private watchCommentsLoop = async (): Promise<void> => {
    try {
      if (this.logger) {
        this.logger.debug('Running watch loop.');
      }

      for (let i = 0; i < this.watchersComments.length; i++) {
        const watcher = this.watchersComments[i];

        // Check the 'activity' feed, which contains posts with recent comment activity.
        const activity = await this.getPosts('activity', 50, '', watcher.community);
        if (!activity) {
          if (this.logger) {
            this.logger.debug('getPosts return null.');
          }
          continue;
        } else {
          if (this.logger) {
            this.logger.debug(`Got ${activity.posts.length} posts.`);
          }
        }

        // Loop through the posts and get the comments.
        for (let j = 0; j < activity.posts.length; j++) {
          const post = activity.posts[j];

          // Slurp down all the comments in thread.
          let counter = 0;
          let next = '';
          let comments: Comment[] = [];
          do {
            const c = await this.getPostComments(post.publicId, next);
            if (c.comments.length !== 0) {
              comments = comments.concat(c.comments);
            }
            if (c && c.next) {
              next = c.next;
            }
            if (++counter > 10) {
              break;
            }
          } while (next !== '');
          if (this.logger) {
            this.logger.debug(`Got ${comments.length} comments.`);
          }

          // Loop through the comments and call the watchers.
          for (let k = 0; k < comments.length; k++) {
            const comment = comments[k];

            // Have we already seen this?
            const seenKey = `comment-${comment.id}-${comment.editedAt ? comment.editedAt : '0'}`;
            if (await this.seenChecker.isSeen(seenKey)) {
              if (this.logger) {
                this.logger.debug(
                  `Skipping comment ${comment.id} because it has already been seen`,
                );
              }
              continue;
            }

            // Loop through the watchers.
            for (let l = 0; l < watcher.callbacks.length; l++) {
              try {
                watcher.callbacks[l](post.communityName, comment);
              } catch (error) {
                if (this.logger) {
                  this.logger.error(error as string);
                }
              }

              await this.seenChecker.add(seenKey);
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
   * @param userGroup The user group to submit as.
   */
  public postComment = async (
    publicId: string,
    body: string,
    parentCommentId: string | null = null,
    userGroup?: 'normal' | 'mods',
  ): Promise<Comment | null> => {
    this.authCheck();

    return await this.fetcher
      .request('POST', `/posts/${publicId}/comments?userGroup=${userGroup || 'normal'}`, {
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
   * Votes on a comment.
   *
   * @param commentId The comment id.
   * @param up Whether to upvote or downvote.
   */
  public voteComment = async (commentId: string, up: boolean): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request('POST', `/_commentVote`, {
        commentId,
        up,
      })
      .then(() => {
        return true;
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
   * @param next The next page of posts.
   * @param communityId The community id to fetch posts for.
   */
  public getPosts = async (
    sort: PostSort = 'latest',
    limit: number = 10,
    next?: string,
    communityId?: string,
  ): Promise<{ posts: Post[]; next: string } | null> => {
    let url = `/posts?sort=${sort}&limit=${limit}`;
    if (communityId) {
      url = `${url}&communityId=${communityId}`;
    }
    if (next) {
      url = `${url}&next=${next}`;
    }

    return await this.fetcher.request<{ posts: Post[]; next: string }>('GET', url).then((res) => {
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
   * Votes a post up or down and returns the post. If already voted, then changes the vote.
   *
   * @param postId The post id.
   * @param up Whether to upvote or downvote.
   */
  public votePost = async (postId: string, up: boolean): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request('POST', `/_postVote`, {
        postId,
        up,
      })
      .then(() => {
        return true;
      });
  };

  /**
   * Returns the comments for the given post.
   *
   * @param publicId The PUBLIC id of the post.
   * @param next The next page of comments.
   * @param parentId The id of the parent comment.
   */
  public getPostComments = async (
    publicId: string,
    next?: string,
    parentId?: string,
  ): Promise<{ comments: Comment[]; next: string }> => {
    let url = `/posts/${publicId}/comments`;
    if (next) {
      url += `${url.indexOf('?') === -1 ? '?' : '&'}next=${next}`;
    }
    if (parentId) {
      url += `${url.indexOf('?') === -1 ? '?' : '&'}parentId=${parentId}`;
    }

    return await this.fetcher.request<Comment[]>(`GET`, url).then((res) => {
      if (!res) {
        if (this.logger) {
          this.logger.debug(`Got null response from /posts`);
        }

        return {
          comments: [],
          next: '',
        };
      }

      return res.data;
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

        // Discuit returns null instead of an empty array.
        if (!res.data.items) {
          res.data.items = [];
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
   * Returns an array of the site communities.
   */
  public getCommunities = async (): Promise<Community[]> => {
    return await this.fetcher.request<Community[]>('GET', '/communities').then((res) => {
      if (!res) {
        return null;
      }

      return res.data;
    });
  };

  /**
   * Returns the community with the given id.
   *
   * @param communityId The community id.
   */
  public getCommunity = async (communityId: string): Promise<Community | null> => {
    return await this.fetcher
      .request<Community>('GET', `/communities/${communityId}`)
      .then((res) => {
        if (!res) {
          return null;
        }

        return res.data;
      });
  };

  /**
   * Updates a community.
   *
   * @param communityId The community id.
   * @param values The values to update.
   */
  public updateCommunity = async (
    communityId: string,
    values: Partial<Community>,
  ): Promise<boolean> => {
    return await this.fetcher
      .request<Community>('PUT', `/communities/${communityId}`, values)
      .then(() => {
        return true;
      });
  };

  /**
   * Make the authenticated user join or leave a community.
   *
   * @param communityId The community id.
   * @param leave Whether to leave the community.
   */
  public joinCommunity = async (communityId: string, leave: boolean): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request<boolean>('POST', `/_joinCommunity`, {
        communityId,
        leave,
      })
      .then(() => {
        return true;
      });
  };

  /**
   * Returns the moderators of the given community.
   *
   * @param communityId The community id.
   */
  public getCommunityMods = async (communityId: string): Promise<User[]> => {
    return await this.fetcher
      .request<User[]>('GET', `/communities/${communityId}/mods`)
      .then((res) => {
        if (!res) {
          return [];
        }

        return res.data;
      });
  };

  /**
   * Adds a moderator to the given community.
   *
   * @param communityId The community id.
   * @param username The username of the user to add as a mod.
   */
  public addCommunityMod = async (communityId: string, username: string): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request<boolean>('POST', `/communities/${communityId}/mods`, {
        username,
      })
      .then(() => {
        return true;
      });
  };

  /**
   * Deletes a moderator from the given community.
   *
   * @param communityId The community id.
   * @param username The username of the user to remove as a mod.
   */
  public deleteCommunityMod = async (communityId: string, username: string): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request<boolean>('DELETE', `/communities/${communityId}/mods/${username}`)
      .then(() => {
        return true;
      });
  };

  /**
   * Returns the rules for the given community.
   *
   * @param communityId The community id.
   */
  public getCommunityRules = async (communityId: string): Promise<CommunityRule[]> => {
    return await this.fetcher
      .request<CommunityRule[]>('GET', `/communities/${communityId}/rules`)
      .then((res) => {
        if (!res) {
          return [];
        }

        return res.data;
      });
  };

  /**
   * Adds a rule from the given community.
   *
   * @param communityId The community id.
   * @param rule The rule.
   * @param description The rule description.
   */
  public createCommunityRule = async (
    communityId: string,
    rule: string,
    description: string,
  ): Promise<CommunityRule | null> => {
    this.authCheck();

    return await this.fetcher
      .request<CommunityRule>('POST', `/communities/${communityId}/rules`, {
        rule,
        description,
      })
      .then((res) => {
        if (!res) {
          return null;
        }

        return res.data;
      });
  };

  /**
   * Updates a community rule.
   *
   * @param communityId The community id.
   * @param ruleId The rule id.
   * @param rule The rule.
   */
  public updateCommunityRule = async (
    communityId: string,
    ruleId: number,
    rule: Partial<CommunityRule>,
  ): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request<boolean>('PUT', `/communities/${communityId}/rules/${ruleId}`, rule)
      .then(() => {
        return true;
      });
  };

  /**
   * Deletes a community rule.
   *
   * @param communityId The community id.
   * @param ruleId The rule id.
   */
  public deleteCommunityRule = async (communityId: string, ruleId: number): Promise<boolean> => {
    this.authCheck();

    return await this.fetcher
      .request<boolean>('DELETE', `/communities/${communityId}/rules/${ruleId}`)
      .then(() => {
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
