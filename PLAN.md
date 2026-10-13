# Codexgram — Product and Implementation Plan

## 1. Purpose

Build a clean, minimal, mobile-first social app for sharing photos and short videos with friends and discovering public posts. The first release is an invite-only beta for fewer than 100 adult testers, distributed through TestFlight and Android internal testing. There is no monetization or fixed launch date for v1.

The core product promise is: users can publish a moment, see recent posts from people they follow, and interact through likes, comments, and direct messages.

## 2. Product scope

### In v1

- iOS and Android apps; no web target.
- Google sign-in on iOS and Android, plus Sign in with Apple on iOS.
- Public profiles and public posts; following is immediate, with no approval step.
- One photo or one video per post, with an optional caption.
- Chronological Home feed containing posts from followed users.
- Explore with account search and recent public posts; no recommendation ranking.
- Follow and unfollow; like and unlike; comment; delete your own posts and comments. A post owner can also delete comments on their post.
- One-to-one direct messages with text and image/video attachments, live updates, and an unread badge.
- View and edit profile: username, display name, bio, and avatar.
- Block and report users/content; a small owner/admin review flow for reports and account/content moderation.
- Activity history and push notifications for follows, likes, comments, and messages, with category preferences.
- Account deletion that removes the user’s authored posts, comments, messages, media, profile, and follow edges.
- Four primary tabs: Home, Messages, Explore, and Profile. A create-post action is available from Home. Activity is a secondary screen reached from Home.
- NativeWind styling, a restrained modern visual system, and system light/dark appearance.

### Explicitly out of scope for v1

- Stories, reels, carousels, private accounts, follow requests, group chats, media filters/editing, web, ranked recommendations, monetization, end-to-end encrypted DMs, and behavioral product analytics.
- No v2 feature is committed yet.

## 3. Users, access, and account lifecycle

- Audience: adults (18+); beta audience is invited externally, without an in-app invite gate.
- Authentication: Clerk handles identity and sessions. Enable Google on both platforms and Apple on iOS. Use a custom NativeWind sign-in experience.
- On first provider sign-in, collect a full date of birth and require the user to choose a unique username before entering the app. Block self-declared under-18 users. This is an age gate, not identity verification.
- Seed display name and avatar from the identity provider once. The editable profile stored in Convex becomes the app’s source of truth thereafter.
- Link providers only from an authenticated account settings flow. Do not automatically merge accounts because their email addresses match.
- Roles: ordinary user and owner/admin. Admin-only operations cover report review, hiding reported content, and suspending accounts.
- Username rules: 3–30 characters; letters, numbers, periods, and underscores; unique case-insensitively. Users may change their username; the old username becomes available again.
- Public access does not mean anonymous access: interactions require sign-in. Blocked users cannot view each other’s profiles/posts or contact/follow one another.

## 4. Main journeys and screens

### First launch and sign-in

1. Show a branded welcome/sign-in screen with Google and, on iOS, Apple sign-in.
2. Return from Clerk authentication into the app and check whether a Convex profile exists.
3. For a new account, collect date of birth and username; show username availability/validation inline. Seed the display name and avatar, then allow edits later.
4. For an existing account, restore the session and open Home. Handle cancelled auth, provider errors, and network loss with clear retry paths.

### Home and publishing

1. Home opens to a reverse-chronological feed from followed accounts, with pull-to-refresh and paginated loading.
2. A new user or a user following nobody sees a useful empty state, suggested accounts, and a path to Explore.
3. Each post shows author, media, caption, like/comment actions, and post detail/comments. Video is tap-to-play and muted by default.
4. The Home header includes create-post and Activity actions. Create-post opens the device photo library only; there is no in-app camera.
5. Select exactly one photo or video, preview it, optionally add a caption, upload, then publish. Show upload/publish progress and retry on failure. Do not create a visible feed post until the media upload has been finalized.

### Explore and profiles

1. Explore provides account search and a recent-public-post feed.
2. Tapping an account opens its public profile with avatar, name, username, bio, counts, posts, and follow/message actions.
3. Follow is immediate. The follow button updates optimistically and rolls back if the request fails.
4. Profile tab shows the signed-in user’s profile and posts, with edit-profile and account/settings entry points.
5. Edit profile supports username, display name, bio, and avatar. Validate username rules and uniqueness before saving.

### Likes, comments, and Activity

- Signed-in users may like/unlike and comment on any visible public post.
- Users may delete their own comments. The post owner may delete comments on that owner’s post.
- Activity lists follows, likes, and comments, with a deep link to the relevant profile or post. The Activity route is secondary navigation, not a fifth tab.
- Likes are unique per user/post. Comments are text-only and are not editable in v1.

### Messages

1. Messages tab shows one-to-one conversations, last-message preview, time, and unread state.
2. Users can start a conversation with any user who has not blocked them.
3. Conversation view streams new messages in real time and supports text and image/video attachments.
4. Unread counts update live. No typing indicator or read receipt in v1.
5. DMs are server-accessible and are not end-to-end encrypted. Blocking prevents new contact. Deleting an account removes its authored messages and attachments from conversations.

### Safety and account deletion

- Block removes the mutual follow edge and blocks profile/post viewing, following, and messaging in both directions.
- Report captures the reporter, target, reason, and time, and enters an owner/admin review queue.
- Admin can hide reported content or suspend an account. Reported content is not automatically removed solely because it was reported.
- Account deletion requires an explicit confirmation. Delete user-owned Convex records and R2 objects, revoke/remove device tokens, and clear the Clerk account. Define and implement retryable deletion jobs so partial failures can be reconciled. Other participants’ conversation records remain, but messages authored by the deleted user are purged.

## 5. Data model and source of truth

Clerk is the source of truth for authentication identity and sessions. Convex is the source of truth for application profiles, relationships, posts, interactions, messages, moderation, and notification preferences. R2 stores media bytes; Convex stores media metadata and object keys, never long-lived secrets.

Proposed Convex tables (use Convex IDs and indexes, not client-chosen IDs):

- **profiles**: clerkUserId (unique), normalized username (unique), display name, bio, avatar media ID, date of birth, account status, created/updated timestamps. Index by Clerk ID and username.
- **follows**: follower profile ID, followed profile ID, created timestamp. Enforce one directed edge per pair; index by follower and by followed profile.
- **posts**: author profile ID, media ID, media type, caption, created timestamp, visibility/status. Index by author and by creation time for feed/explore queries.
- **media**: owner profile ID, R2 object key, media type, MIME type, byte size, optional duration, access class, upload/finalization state, created timestamp. Index by owner and upload state.
- **likes**: post ID, user profile ID, created timestamp. Unique pair; indexes by post and user.
- **comments**: post ID, author profile ID, text, created timestamp, status. Index by post/time and author.
- **conversations**: normalized two-member pair, created/last-message timestamps. Enforce one conversation per unordered pair; index by both members and last-message time.
- **messages**: conversation ID, sender profile ID, kind (text/media), text or media ID, created timestamp. Index by conversation/time and sender.
- **blocks**: blocker and blocked profile IDs, created timestamp. Unique directed pair; lookup from either side for authorization.
- **reports**: reporter, target kind/ID, reason, optional details, status, created/reviewed timestamps, reviewer. Index by status/time.
- **activities**: recipient, actor, kind, relevant post/profile ID, created timestamp, read state. Index by recipient/time.
- **push devices/preferences**: Clerk/profile ID, Expo push token and platform; per-category notification preferences. Store only tokens needed for delivery and remove invalid tokens.

Validate all client input on the server. Use server-side authorization on every query/mutation/action: authenticated identity must resolve to an active profile; enforce ownership, block rules, and admin role checks centrally. Clients must never be trusted to enforce visibility or permissions.

## 6. Architecture and integrations

- **Client:** Expo + React Native, Expo Router routes under src/app/, NativeWind for styling. Use Expo Router native tabs for the four primary tabs. Keep reusable UI, hooks, and utilities outside the route tree.
- **Auth:** Clerk Expo SDK for Google/Apple auth and session lifecycle; Clerk identity integrated with Convex auth. Native authentication and push support require development builds, not Expo Go alone.
- **Backend:** Convex queries/mutations/actions for app data and real-time subscriptions. Keep authorization and business rules in Convex functions, not screens.
- **Media:** Cloudflare R2 for all uploaded media. Client requests a narrowly scoped upload URL through an authenticated Convex action; server validates user, type, size, and limits before signing. Client uploads directly to R2, then calls a finalization mutation. Public post/avatar objects may be served through the chosen public/CDN path. DM attachments remain private and are delivered using short-lived signed read URLs after membership/block authorization. Presigned URLs are bearer credentials until expiry; never log them or persist them as public profile data.
- **Media handling:** Expo Image Picker for library selection and Expo Video for playback. No camera, cropping, filters, or transcoding in v1. Original media compatibility and playback should be validated on both platforms.
- **Push:** Expo Notifications and Expo Push Service for messages, likes, comments, and follows. Ask for OS permission contextually after a relevant action (follow or starting a conversation), not immediately at launch. Tapping a notification deep-links to the exact conversation, post, or profile.
- **Monitoring:** capture crashes/errors and backend failures. No behavioral analytics in v1. Monitoring vendor remains to be selected.
- **Secrets:** Clerk keys, Convex deployment configuration, R2 credentials, and push credentials belong in environment/deployment secret storage, never in client code or source control.

### Media constraints

- One asset per post; optional caption.
- Photos: maximum 15 MB.
- Videos: maximum 30 seconds and 50 MB; tap-to-play, muted by default.
- DM attachments: image/video supported; set matching limits during implementation before enabling uploads.
- On upload failure, keep the draft locally where feasible and offer retry. Reconcile abandoned uploads and orphaned R2 objects with a scheduled cleanup process. Never publish a post whose media was not finalized.

## 7. State, async work, and failure behavior

- Convex subscriptions provide live updates for feeds where practical, conversation messages, unread counts, and activity. Paginate feed/history queries; avoid loading a user’s entire social graph or message history at once.
- Likes and follows may update optimistically and must roll back on server failure. Other writes show pending/success/failure states.
- Previously loaded content remains viewable offline. New writes retry when possible, but v1 has no durable offline mutation queue. Clearly show stale/offline state and failed submissions.
- Uploads should continue while the app is suspended where supported; on reopen, reconcile upload/finalization status. A force-closed app may need to retry an upload; do not promise guaranteed background completion.
- Handle empty feeds, no search results, deleted/hidden posts, suspended accounts, expired signed URLs, invalid push tokens, rate limiting, duplicate actions, slow networks, and partial cleanup failures.
- Use idempotent operations for upload finalization, notification dispatch, and deletion cleanup so retries do not create duplicate posts/events or leave inconsistent records.

## 8. Privacy, security, and quality requirements

- Collect date of birth for the chosen 18+ gate; document purpose, retention, and account deletion behavior in the privacy notice before beta.
- Treat email, date of birth, messages, and private attachment URLs as sensitive. Minimize logging and never log auth tokens, signed URLs, or message bodies.
- Add server-side rate limits/abuse controls for sign-up/profile search, posting, comments, messaging, reports, and upload URL issuance before public expansion.
- Accessibility: screen-reader labels, scalable text, adequate contrast, and comfortable touch targets. Support system light/dark mode.
- Performance: paginated feeds and message history, image sizing/caching, avoid excessive rerenders, and avoid downloading full-resolution video before playback.
- Beta target: fewer than 100 invited testers, so prioritize correctness, privacy, and observable failures over premature scaling. Configure budget alerts/usage limits before expanding usage.

## 9. Environments and delivery

- Keep local development and beta/production Convex deployments and credentials separate. Exact staging topology is an open decision; initial assumption is development plus beta/production.
- Use EAS development builds for native Clerk auth, notifications, and other native modules; distribute iOS through TestFlight and Android through internal testing.
- Keep generated ios/ and android/ projects out of hand edits; use app config and config plugins under Continuous Native Generation.
- No web build is in scope. No launch date has been committed.

## 10. Step-by-step implementation sequence

### Phase 0 — Confirm setup and service decisions

- Verify package baseline and matching SDK 57 docs before adding or changing Expo APIs.
- Create Clerk, Convex, Cloudflare R2, and Expo/EAS project credentials for separate development and beta environments.
- Decide R2 public-media delivery domain, private bucket/access policy, signed URL TTL, monitoring vendor, locale scope, and DM upload limits.
- Record the privacy and age-gate treatment before collecting real beta user data.

**Exit:** service accounts and environment boundaries are documented; no secrets are committed.

### Phase 1 — App shell and visual foundation

- Add NativeWind compatible with the existing Expo 57 baseline; establish Tailwind config, design tokens, typography, spacing, and light/dark behavior.
- Set up Expo Router layouts and the four native tabs; add secondary route placeholders for sign-in, onboarding, Activity, profiles, post details, conversations, settings, and editing.
- Implement shared loading, empty, error, and offline states; accessibility basics.

**Exit:** app navigates between four tabs on iOS/Android with consistent responsive layouts and system appearance.

### Phase 2 — Authentication and profile onboarding

- Integrate Clerk with Convex auth and protect authenticated routes.
- Implement Google sign-in on both platforms and Apple sign-in on iOS; configure deep links/redirects.
- Implement first-sign-in DOB and username onboarding, provider profile seeding, returning-user routing, username editing, and account linking rules.
- Add account/profile deletion entry point and server-side account status checks.

**Exit:** new and returning users authenticate, create a valid profile, and reach the correct app screen on both platforms.

### Phase 3 — Convex schema and authorization foundation

- Create schema, indexes, validators, typed Convex functions, and centralized ownership/block/admin authorization helpers.
- Add profile lookup/search, profile editing, follow/unfollow, and block/unblock operations.
- Add server-side uniqueness enforcement for usernames and relationship pairs.

**Exit:** data invariants and permissions are enforced on the backend, including attempts made outside the UI.

### Phase 4 — R2 media pipeline and posts

- Implement authenticated R2 upload URL issuance, direct upload, finalization, signed private reads, and orphan cleanup.
- Add library selection, type/size/duration validation, preview, caption, upload progress, retry, and publish.
- Implement post deletion with media cleanup; build profile post grid and post detail.
- Add image/video rendering and playback behavior within Expo 57 APIs.

**Exit:** supported media can be uploaded and viewed on both platforms; invalid/oversized media is rejected; failed or abandoned uploads do not become visible posts.

### Phase 5 — Home, Explore, likes, and comments

- Build paginated chronological Home feed from followed accounts, empty-state suggestions, and pull-to-refresh.
- Build Explore account search and recent public posts.
- Add like/unlike and comment creation/deletion with ownership checks and optimistic updates where appropriate.
- Ensure block, deletion, and moderation states are reflected in feed and profile queries.

**Exit:** core social feed behavior works for empty, normal, blocked, deleted, and error cases.

### Phase 6 — Direct messages

- Add unique one-to-one conversation creation, inbox ordering, real-time message subscriptions, unread state, text messages, and private image/video attachments.
- Enforce conversation membership and block rules on every operation and signed URL request.
- Implement upload/read failures and attachment cleanup.

**Exit:** two users can exchange live text and media messages; unauthorized users cannot read conversations or attachments.

### Phase 7 — Activity, push, and moderation

- Add Activity records for follows/likes/comments and matching preference controls.
- Register/manage Expo push tokens and send category-specific notifications; implement deep-link routing and invalid-token cleanup.
- Add reports, owner/admin review queue, hide-content and suspend-account actions.

**Exit:** notification preferences and delivery work end to end; report actions are authorization protected and auditable.

### Phase 8 — Hardening, beta, and release

- Implement retryable account deletion across Clerk, Convex, R2, and push tokens; test partial-failure recovery.
- Add error/crash monitoring, rate limits, abuse controls, privacy notice, and budget alerts.
- Complete automated tests for core Convex rules and flows plus manual iOS/Android smoke checks.
- Run npx expo lint and npx tsc --noEmit; run Expo Doctor and resolve applicable SDK/config issues.
- Create EAS beta builds and distribute through TestFlight and Android internal testing; review beta feedback and production readiness before wider release.

**Exit:** release checklist passes on both platforms; known open risks have owners and explicit acceptance.

## 11. Definition of done for v1

- Google authentication works on iOS and Android; Apple authentication works on iOS; onboarding enforces age and username rules.
- All four tabs and required secondary screens work on both platforms with accessible light/dark UI.
- Users can publish permitted photo/video posts, browse Home/Explore, follow users, like/comment, and remove allowed content.
- Users can start one-to-one conversations and exchange text and image/video attachments with correct access control and unread state.
- Block/report/admin moderation and account deletion enforce the documented behaviors.
- Push preferences, contextual permission prompts, and deep links work; notification failures do not break core app flows.
- Backend authorization, validation, limits, and key failure paths have automated coverage; both platforms pass manual smoke checks.
- Lint, typecheck, Expo Doctor, and EAS beta build complete without unresolved release-blocking issues.

## 12. Assumptions and open decisions

### Assumptions used for this plan

- Public accounts/posts and immediate follows are the only visibility mode in v1.
- A post contains exactly one media asset; comments are text-only and cannot be edited.
- Any signed-in user may interact with public content unless blocked or suspended.
- R2 stores all media; post/avatar media may be publicly deliverable, while DM media uses temporary signed reads.
- No media transformations/transcoding are included in v1.
- Beta is invite-only by distribution, but the app has no in-product invite code.
- Development and beta/production are separate environments; staging is not yet defined.

### Open decisions to settle before the relevant phase

1. Which additional locales, if any, are required for the beta? Current working assumption: English UI, structured so localization can be added.
2. What signed URL lifetime should private DM media use? Choose the shortest TTL that supports normal playback and retries.
3. Which crash/error monitoring provider should be used? No vendor selected.
4. What is the exact environment topology and who owns Clerk, Convex, R2, and EAS credentials?
5. What DM attachment size/duration limits should match post limits?
6. What are the date-of-birth retention and privacy-notice requirements for the target jurisdictions?
7. Which public media delivery domain/cache policy and R2 cleanup schedule will be used?
8. Which rate limits and beta spending alerts should be configured? Exact dollar limits have not been set.

### Risks

- Expo Router native tabs are marked unstable in the SDK 57 documentation; validate behavior early on both platforms and retain a navigation fallback decision.
- Native Clerk auth and remote push require development builds and correct provider/EAS configuration; Expo Go is insufficient for full validation.
- R2 signed URLs are bearer links while valid. A leaked URL can be used until expiry; authorization must happen before issuing one and TTLs/logging must be controlled.
- Without transcoding, device-generated video codecs, dimensions, and network conditions may cause playback problems. Validate real devices and sample media before beta.
- Account deletion spans several services and can partially fail. Make cleanup idempotent, retryable, and visible to operators.
- Self-declared age gating does not verify age; the privacy/legal approach and target jurisdictions need review before beta.
- A general social app has no differentiated niche defined yet; beta feedback should test whether the core sharing and messaging loop is compelling.

## 13. Version and documentation guardrails

Current repository baseline: Expo ~57.0.27, Expo Router ~57.0.25, React 19.2.3, React Native 0.86.3; package manager appears to be npm (package lock, no Bun lock). Re-check the actual lockfile and versions before implementation. Do not upgrade the SDK casually.

Before changing Expo, EAS, or React Native APIs, read the Expo major version from package.json and consult the matching versioned docs. Install Expo-compatible modules with npx expo install. This project uses Expo Router; screens belong in src/app/. Keep generated native projects under Continuous Native Generation.

References to verify at implementation time:

- [Expo SDK 57 native tabs](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/)
- [Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)
- [Expo SDK 57 Video](https://docs.expo.dev/versions/v57.0.0/sdk/video/)
- [Expo SDK 57 Notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
- [Expo SDK 57 FileSystem](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/)
- [NativeWind installation](https://www.nativewind.dev/docs/getting-started/installation)
- [Clerk Google sign-in for Expo](https://clerk.com/docs/expo/guides/configure/auth-strategies/sign-in-with-google)
- [Convex authentication with Clerk](https://docs.convex.dev/auth/clerk)
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
