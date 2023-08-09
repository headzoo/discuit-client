import { ISeenChecker } from './types';
/**
 * Seen checker that stores seen posts in memory.
 */
export declare class MemorySeenChecker implements ISeenChecker {
    /**
     * Posts that have been seen by the watcher.
     */
    protected seenPosts: string[];
    /**
     * @inheritdoc
     */
    add: (id: string) => Promise<void>;
    /**
     * @inheritdoc
     */
    isSeen: (id: string) => Promise<boolean>;
}
