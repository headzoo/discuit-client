"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySeenChecker = void 0;
/**
 * Seen checker that stores seen posts in memory.
 */
class MemorySeenChecker {
    constructor() {
        /**
         * Posts that have been seen by the watcher.
         */
        this.seenPosts = [];
        /**
         * @inheritdoc
         */
        this.add = (id) => {
            this.seenPosts.push(id);
            return Promise.resolve();
        };
        /**
         * @inheritdoc
         */
        this.isSeen = (id) => {
            return Promise.resolve(this.seenPosts.includes(id));
        };
    }
}
exports.MemorySeenChecker = MemorySeenChecker;
