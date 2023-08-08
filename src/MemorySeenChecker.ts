import { ISeenChecker } from './types';

/**
 * Seen checker that stores seen posts in memory.
 */
export class MemorySeenChecker implements ISeenChecker {
  /**
   * Posts that have been seen by the watcher.
   */
  protected seenPosts: string[] = [];

  /**
   * @inheritdoc
   */
  public add = (id: string): Promise<void> => {
    this.seenPosts.push(id);
    return Promise.resolve();
  };

  /**
   * @inheritdoc
   */
  public isSeen = (id: string): Promise<boolean> => {
    return Promise.resolve(this.seenPosts.includes(id));
  };
}
