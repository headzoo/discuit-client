Discuit Client
==============

* [Install](#install)
* [Usage](#usage)
* [Methods](#methods)
  * [login](#loginusername-string-password-string-promise)
  * [getMe](#getme-promiseuser--null)
  * [getPosts](#getpostssort-string-limit-number-promisepost)
  * [getPost](#getpostpublicid-string-promisepost--null)
  * [votePost](#votepostpostid-string-up-boolean-promise)
  * [getPostComments](#getpostcommentspublicid-string-promise)
  * [getNotifications](#getnotifications-promisenotification)
  * [markNotificationAsSeen](#marknotificationasseenid-number-promise)
  * [deleteNotification](#deletenotificationid-number-promise)
  * [deleteAllNotifications](#deleteallnotifications-promise)
  * [getComment](#getcommentid-string-promisecomment--null)
  * [postComment](#postcommentpublicid-number-content-string-promise)
  * [updateComment](#updatecommentpublicid-string-commentid-string-content-string-promise)
  * [deleteComment](#deletecommentpostid-number-commentid-number-promise)
  * [watchPosts](#watchpostscommunities-string-callback-community-string-post-post)
  * [voteComment](#votecommentcommentid-string-up-boolean-promise)
  * [getCommunities](#getcommunities-promisecommunity)
  * [getCommunity](#getcommunitycommunityid-string-promisecommunity--null)
  * [updateCommunity](#updatecommunitycommunityid-string-community-partialcommunity-promise)
  * [joinCommunity](#joincommunitycommunityid-string-leave-boolean-promise)
  * [getCommunityMods](#getcommunitymodscommunityid-string-promise)
  * [addCommunityMod](#addcommunitymodcommunityid-string-username-string-promise)
  * [deleteCommunityMod](#deletecommunitymodcommunityid-string-username-string-promise)
  * [getCommunityRules](#getcommunityrulescommunityid-string-promise)
  * [createCommunityRule](#createcommunityrulecommunityid-string-rule-string-description-string-promise)
  * [updateCommunityRule](#updatecommunityrulecommunityid-string-ruleid-number-rule-partialcommuityrule-promise)
  * [deleteCommunityRule](#deletecommunityrulecommunityid-string-ruleid-number-promise)

## Install
```
yarn add @headz/discuit
```

## Usage
```typescript
import { Discuit } from '@headz/discuit';

const discuit = new Discuit();
await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);

// Get the latest posts.
const posts = await discuit.getPosts('latest', 50);
for (let i = 0; i < posts.length; i++) {
  const post = posts[i];
  const comment = await discuit.postComment(post.id, 'Welcome to the community!');
  await discuit.deleteComment(comment.postId, comment.id);
}

// Get the user's notifications.
const notifications = await discuit.getNotifications();
console.log(notifications);

for (let i = 0; i < notifications.length; i++) {
  const notification = notifications[i];
  await discuit.markNotificationAsSeen(notification.id);
  await discuit.deleteNotification(notification.id);
}

await discuit.deleteAllNotifications();
```

Using the watch method.
```typescript
import { Discuit } from '@headz/discuit';

const communities = ['news', 'politics', 'sports'];

const discuit = new Discuit();
await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);

// Watch for new posts in the communities.
discuit.watchPosts(communities, async (community, post) => {
  console.log(community, post);

  const comment = await discuit.postComment(post.id, 'Welcome to the community!');
  await discuit.deleteComment(comment.postId, comment.id);
});
```

Configuration
```typescript
import { Discuit } from '@headz/discuit';
import winston from 'winston';

const discuit = new Discuit();

// Attach a logger.
discuit.logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    defaultMeta: { service: 'discuit' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    ],
});

// Configure how often the watch() command checks for new posts.
// Don't set this too low or discuit will rate limit the bot.
discuit.watchInterval = 1000 * 60 * 10 // 10 minutes

// How long to wait between callbacks in the watch loop.
discuit.sleepPeriod = 5000;
```

## Methods
The library is still in development, so the API is subject to change.

### login(username: string, password: string): Promise<void>
Logs into the server.

```typescript
import { Discuit } from '@headz/discuit';

const discuit = new Discuit();
await discuit.login('DISCUIT_USERNAME', 'DISCUIT_PASSWORD');
```

### getMe(): Promise<User | null>
Returns the logged-in user.

```typescript
const user = await discuit.getMe();
```

### getPosts(sort: string, limit: number, next?: string, communityId?: string): Promise<Post[]>
Fetches the latest posts.

```typescript
const posts = await discuit.getPosts('latest', 50);
```

### getPost(publicId: string): Promise<Post | null>
Returns the details of a post.

```typescript
const post = await discuit.getPost('12345');
```

### votePost(postId: string, up: boolean): Promise<boolean>
Votes a post up or down and returns the post. If already voted, then changes the vote.

```typescript
await discuit.votePost('12345', true);
```

### getPostComments(publicId: string, next?: string, parentId?: string): Promise<{ comments: Comment[]; next: string }>
Returns the comments for the given post.

```typescript
const comments = await discuit.getPostComments('12345');
```

### getNotifications(): Promise<Notification[]>
Returns all the user's notifications.

```typescript
const notifications = await discuit.getNotifications();
```

### markNotificationAsSeen(id: number): Promise<void>
Marks a notification as seen.

```typescript
await discuit.markNotificationAsSeen(80155);
```

### deleteNotification(id: number): Promise<void>
Deletes a notification.

```typescript
await discuit.deleteNotification(80155);
```

### deleteAllNotifications(): Promise<void>
Deletes all notifications.

```typescript
await discuit.deleteAllNotifications();
```

### getComment(id: string): Promise<Comment | null>
Returns the comment with the given id.

```typescript
const comment = await discuit.getComment('12345');
```

### postComment(publicId: number, content: string): Promise<Comment>
Submits a comment.

```typescript
const comment = await discuit.postComment(12345, 'Welcome to the community!');
```

### updateComment(publicId: string, commentId: string, content: string): Promise<Comment>
Updates a comment.

```typescript
const comment = await discuit.updateComment('12345', '67890', 'Welcome to the community!');
```

### deleteComment(postId: string, commentId: string): Promise<void>
Deletes a comment.

```typescript
await discuit.deleteComment('12345', '67890');
```

### watchPosts(communities: string[], callback: (community: string, post: Post) => void): Promise<void>
Watches for new posts.

```typescript
discuit.watchPosts(['news', 'politics', 'sports'], async (community, post) => {
  console.log(community, post);

  const comment = await discuit.postComment(post.id, 'Welcome to the community!');
  await discuit.deleteComment(comment.postId, comment.id);
});
```

### voteComment(commentId: string, up: boolean): Promise<boolean>
Votes on a comment.

```typescript
await discuit.voteComment('12345', true);
```

### getCommunities(): Promise<Community[]>
Returns an array of the site communities.

```typescript
const communities = await discuit.getCommunities();
```

### getCommunity(communityId: string): Promise<Community | null>
Returns the community with the given id.

```typescript
const community = await discuit.getCommunity('12346');
```

### updateCommunity(communityId: string, community: Partial<Community>): Promise<boolean>

```typescript
const community = await discuit.updateCommunity('12346', {
  nsfw: true,
  about: 'My community description.',
});
```

### joinCommunity(communityId: string, leave: boolean): Promise<boolean>
Make the authenticated user join or leave a community.

```typescript
await discuit.joinCommunity('12346', false);
```

### getCommunityMods(communityId: string): Promise<User[]>
Returns the moderators of a community.

```typescript
const mods = await discuit.getCommunityMods('12346');
```

### addCommunityMod(communityId: string, username: string): Promise<boolean>
Adds a moderator to a community.

```typescript
await discuit.addCommunityMod('12346', 'username');
```

### deleteCommunityMod(communityId: string, username: string): Promise<boolean>
Removes a moderator from a community.

```typescript
await discuit.deleteCommunityMod('12346', 'username');
```

### getCommunityRules(communityId: string): Promise<CommunityRule[]>
Returns the rules of a community.

```typescript
const rules = await discuit.getCommunityRules('12346');
```

### createCommunityRule(communityId: string, rule: string, description: string): Promise<boolean>
Creates a rule for a community.

```typescript
await discuit.createCommunityRule('12346', 'Rule 1', 'This is rule 1.');
```

### updateCommunityRule(communityId: string, ruleId: number, rule: Partial<CommuityRule>): Promise<boolean>
Updates a rule for a community.

```typescript
await discuit.updateCommunityRule('12346', 1, {
  rule: 'Rule 1',
  description: 'This is rule 1.',
    zIndex: 4,
});
```

### deleteCommunityRule(communityId: string, ruleId: number): Promise<boolean>
Deletes a rule from a community.

```typescript
await discuit.deleteCommunityRule('12346', 1);
```
