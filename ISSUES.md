# StellarCert Issue Tracker

---

## Backend

---

**Title:** Webhook `createSubscription` returns the HMAC secret in the response body
**Labels:** `bug` `security` `backend`
**Body:** The full webhook subscription entity — including the raw HMAC `secret` field — is returned from `createSubscription`. The secret should be displayed once at creation and then stored hashed server-side. Subsequent reads of the subscription should never return the secret, only an indicator that one is set.

---

**Title:** Multisig DTO constructors inject `LoggingService` as a property — broken instantiation
**Labels:** `bug` `backend`
**Body:** In `multisig.controller.ts`, several DTOs declare `constructor(private readonly logger: LoggingService)`. NestJS's `class-transformer` instantiates DTOs with `new Dto(plainBody)` — it does not use the DI container. The first (and only) constructor argument becomes `logger`, which receives the raw body object instead of a logger instance. Every multisig DTO is broken on instantiation.

---

**Title:** Multisig service calls `getTransaction` immediately after `sendTransaction` without polling
**Labels:** `bug` `backend`
**Body:** In `multisig.service.ts`, every Soroban transaction flow calls `getTransaction` in the same tick as `sendTransaction`. The transaction is almost always still `PENDING` or `NOT_FOUND` at the RPC node at that point. There is no polling loop or retry mechanism. The service always reads an unfinalized result and the returned data is stale or empty.

---

**Title:** `proposeCertificate` and `approveRequest` return hardcoded mock objects
**Labels:** `bug` `backend`
**Body:** `multisig.service.ts` contains comments that say "mock object" and "mock success result". These methods build fabricated response objects instead of parsing actual contract return values. Any client relying on these responses receives made-up data.

---

**Title:** All multisig controller handlers typed `Promise<any>` — no compile-time shape safety
**Labels:** `tech-debt` `backend`
**Body:** Every handler in `multisig.controller.ts` returns `Promise<any>`. Breaking changes in service return types will not be caught by the TypeScript compiler. Define and use proper response DTO interfaces for all multisig endpoints.

---

**Title:** `listIssuers` returns all rows with no pagination — unbounded memory usage
**Labels:** `enhancement` `backend`
**Body:** `GET /issuers` calls an unbounded `findAll()` query. In production with many issuers this loads the entire table into memory and returns a potentially multi-MB JSON response. Add `page` and `limit` query parameters and return a paginated response matching the rest of the API.

---

**Title:** `incrementCertificateCount` never called from certificate issuance flow
**Labels:** `bug` `backend`
**Body:** The issuer certificate counter in the issuers table is never incremented when a certificate is issued. Issuer stats displayed in the UI always show zero or stale counts because the increment hook was never wired from `CertificateService.issue()` to `IssuersService.incrementCertificateCount()`.

---

**Title:** IP rate-limit guard stores state in process-local `Map` — ineffective in multi-instance deployments
**Labels:** `bug` `backend`
**Body:** `ip-rate-limit.guard.ts` uses an in-memory `Map` to track request counts. In any multi-replica deployment (Docker Swarm, Kubernetes) each pod maintains its own counter, and an attacker can trivially bypass the limit by round-robining across instances. All state is also lost on process restart. Rate-limit state must be stored in Redis or another shared store.

---

**Title:** IP rate-limit guard trusts `X-Forwarded-For` without sanitization — trivial bypass
**Labels:** `bug` `security` `backend`
**Body:** The `getClientIp` helper reads `X-Forwarded-For` and `X-Real-IP` headers without any validation or sanitization. An attacker can set these headers to an arbitrary IP address string and bypass per-IP rate limiting entirely. Only trust these headers when the request comes from a known trusted proxy.

---

**Title:** Pre-signed S3 profile picture URL expires after 1 hour — broken images app-wide
**Labels:** `bug` `backend`
**Body:** `StorageService.uploadFile()` generates a pre-signed URL with a 1-hour TTL and saves it to `user.profilePicture`. Every profile picture across the app returns HTTP 403 one hour after upload. The database should store the S3 object key, not the pre-signed URL. URLs should be generated on-demand per request or the bucket should use a public read policy.

---

**Title:** `StorageService` crashes startup when S3 config is absent and `STORAGE_REQUIRED` is not set
**Labels:** `bug` `backend`
**Body:** If `STORAGE_REQUIRED` is not explicitly set to `false` in `.env`, the `StorageService` throws a fatal error during `onModuleInit()` and prevents the app from starting. The default behavior should be a non-fatal warning in development. Add `STORAGE_REQUIRED=false` to `.env.example` and make startup non-fatal when the flag is absent.

---

**Title:** Analytics service only counts three roles — RECIPIENT, VERIFIER, AUDITOR omitted
**Labels:** `bug` `backend`
**Body:** `admin-analytics.service.ts` `getUsersByRole` only queries for `USER`, `ISSUER`, and `ADMIN`. The additional roles defined in `UserRole` are silently omitted from role distribution charts. Refactor to dynamically query all enum values.

---

**Title:** Analytics cache TTL may be 33 minutes instead of 2 minutes due to unit mismatch
**Labels:** `bug` `backend`
**Body:** `admin-analytics.service.ts` passes `this.CACHE_TTL * 1000` to `cacheManager.set`. If `cache-manager` v4+ expects milliseconds this is correct, but if a configured adapter expects seconds the TTL becomes 2,000 seconds (~33 minutes). Audit the installed cache-manager version and confirm the expected unit before applying the multiplier.

---

**Title:** `ForgotPasswordDto.email` has no `@IsEmail()` validator
**Labels:** `bug` `backend`
**Body:** The email field in `ForgotPasswordDto` (in `change-password.dto.ts`) is decorated with only `@IsString()` and `@IsNotEmpty()`. Any non-empty string passes validation and is handed to the email queue, causing silent delivery failures and potentially leaking the password-reset flow to non-email inputs.

---

**Title:** On-chain certificate issuance failure leaves orphaned database record
**Labels:** `bug` `backend` `stellar`
**Body:** In `CertificateService`, the database record is committed before the Soroban on-chain call. If the on-chain call fails the error is re-thrown but the DB record persists without a `stellarTransactionHash`. There is no retry mechanism or reconciliation job. Add a background job or expose a `/certificates/:id/sync-chain` endpoint so issuers can re-attempt on-chain issuance for orphaned records.

---

---

## Frontend

---

**Title:** `CertificateTable.tsx` swallows errors from all actions — users never see failure
**Labels:** `bug` `frontend`
**Body:** Revoke, CSV export, PDF export, freeze, unfreeze, transfer, and history fetch all catch errors with only `console.error`. There is no toast notification, no error banner, no UI state change. Users clicking action buttons have no way to know their action failed silently.

---

**Title:** `NotificationPreferences.tsx` swallows save error — user clicks "Save" and nothing happens
**Labels:** `bug` `frontend`
**Body:** The save-preferences error is caught and logged to the console. No toast or error message is shown. From the user's perspective, clicking Save produces no response on failure, leaving them unable to tell whether preferences were saved.

---

**Title:** `IssuerProfile.tsx` swallows all data-load and update errors — blank panels silently
**Labels:** `bug` `frontend`
**Body:** Profile load, stats load, activity load, and profile update errors are all caught and logged to `console.error` with no user-visible feedback. Blank panels display with no indication of failure, giving users no path to retry or understand what went wrong.

---

**Title:** `authApi.refresh` calls `/auth/refresh` — backend route is `/users/refresh-token`
**Labels:** `bug` `frontend`
**Body:** Both the explicit `authApi.refresh()` call and the 401-retry interceptor in `endpoints.ts` request `POST /auth/refresh`. The backend route is `POST /users/refresh-token`. Every automatic token refresh fails with 404, causing silent session expiry and forcing users to log in again.

---

**Title:** `registerApi` comment says refresh tokens use `HttpOnly` cookies — code stores in `localStorage`
**Labels:** `tech-debt` `frontend`
**Body:** The comment at the top of the register response handler reads "Note: refreshToken is handled server-side via httpOnly cookies," but immediately below, `tokenStorage.setRefreshToken(response.refreshToken)` stores the token in `localStorage`. The misleading comment will cause future developers to incorrectly believe the secure pattern is in place.

---

**Title:** `AUDITOR` role absent from frontend `UserRole` enum — auditors redirected on every protected page
**Labels:** `bug` `frontend`
**Body:** The frontend `UserRole` enum in `api/types.ts` does not include `AUDITOR`. A user with the backend `auditor` role hits `allowedRoutes = []` in `ProtectedRoute` and is redirected to `/` on every page visit. Add `AUDITOR = "auditor"` to the enum and define appropriate allowed paths.

---

**Title:** `IssueCertificate.tsx` date validation uses local timezone, backend validates against UTC
**Labels:** `bug` `frontend`
**Body:** Client-side validation compares `issueDate > today` using `new Date()` in the local timezone. The backend validates against UTC. A certificate issued at 11 PM UTC-5 passes client validation but may fail server validation, surfacing a confusing validation error to the user.

---

**Title:** `User` type inconsistency — `'firstName' in user` guard suggests multiple conflicting type shapes
**Labels:** `tech-debt` `frontend`
**Body:** `IssueCertificate.tsx` uses `'firstName' in user` to conditionally access the field, indicating that the `User` type used in that context may not reliably have `firstName`. Multiple diverging `User` interfaces likely exist in the codebase and are used interchangeably.

---

**Title:** No loading skeleton shown while QR codes are fetched per certificate in wallet
**Labels:** `enhancement` `frontend`
**Body:** `CertificateWallet.tsx` fetches QR codes sequentially in a `useEffect` loop. While each request is in flight, image placeholders display as blank rectangles with no spinner or skeleton. Add a per-card loading state that shows a skeleton until the QR code resolves.

---

**Title:** Dashboard `IssuanceChart` is hand-rolled SVG with no tooltip or accessibility
**Labels:** `enhancement` `frontend`
**Body:** The `IssuanceChart` in `Dashboard.tsx` is custom SVG with no hover tooltip, no accessible axis labels beyond a single `aria-label`, and no fallback for screen readers. Bar labels are truncated when many data points exist. Consider using Recharts (already in many React stacks) or add `<title>`, `role="img"`, and interactive tooltips at minimum.

---

**Title:** `NotFound` page filename case mismatch — import fails on Linux/CI
**Labels:** `bug` `frontend`
**Body:** `App.tsx` does `import('./pages/NotFound')` but the file may be named `Notfound.tsx` (lowercase 'f'). On case-sensitive filesystems (Linux, all CI environments) this import fails at runtime when the 404 route is hit, showing a blank screen instead of a 404 page.

---

**Title:** `USE_DUMMY_DATA` is a runtime flag — dummy data branches cannot be tree-shaken from production bundle
**Labels:** `tech-debt` `frontend`
**Body:** `VITE_USE_DUMMY_DATA` is read at runtime from `import.meta.env` but evaluated into a `const` that is checked in regular `if` branches rather than `if (import.meta.env.VITE_USE_DUMMY_DATA)` which Vite can statically analyze. The dummy data objects (large arrays of hardcoded certificates, users, templates) remain in the production bundle, adding dead weight and exposing internal data structures to anyone inspecting the bundle.

---

**Title:** Two separate dashboard stats APIs with different endpoints — only one can be correct
**Labels:** `tech-debt` `frontend`
**Body:** Both `analyticsApi.getDashboardSummary` (calls `/admin/analytics`) and `dashboardApi.getStats` (calls `/admin/analytics/dashboard`) exist in `endpoints.ts` and fetch statistics. It is unclear which components should use which, and if the backend route changes only one caller is updated. Consolidate to a single API function with a single correct endpoint.

---

**Title:** `CertificateWallet` shows issuer-owned action buttons to `VERIFIER` role users
**Labels:** `bug` `frontend`
**Body:** `ProtectedRoute` allows `VERIFIER` to access `/wallet`. The wallet renders download, transfer, and revoke buttons without checking whether the logged-in user actually owns the displayed certificates or has the appropriate role. A verifier can attempt actions the API will reject. Action buttons should be conditionally rendered based on `user.role` and certificate ownership.

---

**Title:** Login redirect after `ProtectedRoute` block does not preserve `returnUrl`
**Labels:** `enhancement` `frontend`
**Body:** When `ProtectedRoute` redirects an unauthenticated user to `/login`, no `?returnUrl=...` query parameter is appended. After logging in, the user is always sent to `/` regardless of where they were trying to go. Add `?returnUrl=${encodeURIComponent(location.pathname + location.search)}` to the redirect and honor it in the post-login success handler.

---

---

## Stellar Contracts

---

**Title:** `crl.rs` `set_admin` writes to `instance()` storage, `get_admin` reads from `persistent()` — admin is never readable
**Labels:** `bug` `contract`
**Body:** `crl.rs` `set_admin` writes `DataKey::Admin` to `env.storage().instance()`. `get_admin` reads `DataKey::Admin` from `env.storage().persistent()`. The two operations target different storage backends. A written admin value can never be read back, so every admin check in the CRL contract fails.

---

**Title:** `crl.rs` `update_crl_metadata` ignores `_issuer` parameter — no authorization performed
**Labels:** `bug` `security` `contract`
**Body:** `crl.rs` `update_crl_metadata` accepts an `_issuer: Address` parameter (prefixed with `_` indicating intentional non-use) but performs no authorization check against it. Any account can call this function and update CRL metadata without being the CRL owner or an authorized issuer.

---

**Title:** `crl.rs` uses 0-indexed pagination while `lib.rs` uses 1-indexed — off-by-one for API consumers
**Labels:** `bug` `contract`
**Body:** Pagination in `crl.rs` is 0-indexed (page 0 = first page). In `lib.rs`, pagination is 1-indexed with a `page.saturating_sub(1)` offset. A client that correctly uses 1-indexed pagination for certificates will skip the first page of CRL results. Unify pagination to 1-indexed across all contract functions.

---

**Title:** `crl.rs` `revoke_certificate` emits no event — backend cannot detect CRL changes
**Labels:** `enhancement` `contract`
**Body:** `crl.rs` `revoke_certificate` stores the revocation but emits no contract event. The backend webhook system and off-chain indexers have no on-chain signal to trigger certificate status updates. Add and emit a `CRLRevocationAddedEvent`.

---

**Title:** CRL and main contract revocations are not synchronized — a certificate can be revoked in one but not the other
**Labels:** `bug` `contract`
**Body:** `revoke_certificate` on `CertificateContract` updates certificate status in the main contract but does NOT call or notify the `CRLContract`. The CRL `revoke_certificate` must be called separately by the issuer. A certificate can be revoked in the main contract but still pass CRL checks, or be on the CRL but still show `Active` in the main contract. Either make revocation atomic via a cross-contract call or enforce both are always called together in tooling.

---

**Title:** `admin_multisig.rs` `cancel_proposal` records status as `Rejected` instead of `Cancelled`
**Labels:** `bug` `contract`
**Body:** `admin_multisig.rs` line ~229 sets `AdminProposalStatus::Rejected` when a proposal is cancelled by its proposer. A genuine rejection (voted down, threshold not reached) cannot be distinguished from a cancellation in audit logs or the event stream.

---

**Title:** `admin_multisig.rs` `execute_action` for `AdminAction::Other(_)` is a silent no-op
**Labels:** `bug` `contract`
**Body:** The match arm for `AdminAction::Other(_)` in `execute_action` is an empty block `{}`. A governance proposal of type `Other` can be fully approved, reach execution, succeed, and perform absolutely nothing — no state change, no event, no error. Add a `panic!("Unsupported action type")` or implement the intended behavior.

---

**Title:** `admin_multisig.rs` `get_proposal` has no authorization check — any account can read governance proposals
**Labels:** `bug` `security` `contract`
**Body:** `admin_multisig.rs` `get_proposal` reads and returns the full `AdminProposal` from instance storage with no `require_auth()` call. Any network participant can inspect the details of any pending admin governance proposal without being a signer or admin.

---

**Title:** `admin_multisig.rs` `approve_action` does not validate threshold vs. registered signer count
**Labels:** `bug` `contract`
**Body:** If the contract is initialized with `threshold = 5` and only 3 signers are ever registered, the threshold can never be reached. Approvals accumulate but no proposal can ever be executed. No validation at init time or during approval checks for this condition. Add a guard: `require threshold <= signers.len()` at initialization.

---

**Title:** `shadow.rs` `register_schema` writes a `String` then reads the same key as `Vec<String>` — panic on read
**Labels:** `bug` `contract`
**Body:** `shadow.rs` `register_schema` sets the name-index key to `schema.id` (a `String`). Later in the same function it reads that key expecting a `Vec<String>` for schema history. The stored type is incompatible with the expected type — deserialization will panic or produce garbage data.

---

**Title:** `shadow.rs` stores all metadata schemas in `instance()` storage — hits size limit rapidly
**Labels:** `bug` `contract`
**Body:** `shadow.rs` writes schemas, name indexes, history lists, and schema counts all to `env.storage().instance()`. Instance storage is a single ledger entry with a fixed maximum size (~16 KB in current Soroban). Storing many schemas will exhaust this limit and cause all subsequent schema writes to fail. Schemas should be stored in `persistent()` keyed by schema ID.

---

**Title:** `multisig.rs` stores all `PendingRequest` entries in `instance()` storage — unbounded growth
**Labels:** `bug` `contract`
**Body:** `multisig.rs` stores `PendingRequest`, `IssuerRequestIds`, and `SignerRequestIds` in `env.storage().instance()`. Instance storage is size-limited and grows unboundedly with every new request. Once the size limit is exceeded, all writes fail. Each pending request should be stored in `persistent()` storage under a unique key.

---

**Title:** `multisig.rs` `init_multisig_config` panics if already initialized — no upgrade or reconfiguration path
**Labels:** `bug` `contract`
**Body:** Once the multisig contract is initialized it cannot be reconfigured — not even by the admin. There is no `update_config` function. If the threshold or signer list needs to change after deployment, the entire contract must be redeployed, losing all pending request history. Add an `update_multisig_config` function gated by admin auth.

---

**Title:** `freeze_certificate` does not verify caller is still in the authorized issuer list
**Labels:** `bug` `security` `contract`
**Body:** `lib.rs` `freeze_certificate` calls `cert.issuer.require_auth()`, which requires the stored issuer address to authorize. However it does not check whether that issuer is still in the active authorized-issuers list. An issuer who has been removed via `remove_issuer()` can still freeze certificates they previously issued. Add a check that `DataKey::Issuer(cert.issuer)` resolves to `true` in persistent storage.

---

**Title:** `update_certificate_metadata` panics for frozen certificates — no unfreeze-update-refreeze path
**Labels:** `enhancement` `contract`
**Body:** `update_certificate_metadata` panics if `cert.status != Active`. A frozen certificate cannot have its metadata corrected without the issuer unfreezing it first, which creates a window where the certificate is temporarily unfrozen. Consider allowing metadata-only updates for frozen certificates, or document the required workaround prominently.

---

**Title:** No maximum cap on `limit` in `get_certificates_by_issuer` / `get_certificates_by_owner`
**Labels:** `enhancement` `contract`
**Body:** `paginate_certificates` respects the caller-supplied `limit` with no upper bound. Passing `limit = u32::MAX` causes the function to iterate over the entire certificate list in a single invocation, exhausting all available compute units and causing the transaction to fail. Enforce a maximum limit constant (e.g. 100) and reject values above it.

---

<!-- ============================================================= -->
<!-- Findings added 2026-08-27 after booting the full stack        -->
<!-- (backend + frontend + docker services) and running an audit.  -->
<!-- These are NEW issues, distinct from the ones above.           -->
<!-- ============================================================= -->

## 🔴 Build Blockers (app does not compile) — ✅ ALL RESOLVED 2026-08-27

> These were discovered by actually running the stack: the backend production build (`nest build`) failed, the app crashed on boot with an unresolved DI dependency, and the Soroban contract crate (`stellar-contracts`) did not compile. **All of the blockers in this section have now been fixed** — `nest build` passes, the backend boots and serves `GET /api/v1/health → 200`, and `npm run build` (frontend `tsc -b && vite build`) passes. The three contract fixes are mechanical and resolve the identified compile errors, but could not be `cargo check`-verified locally (Rust toolchain not installed in the audit environment).

---

**Title:** Backend `nest build` fails — `CertificatesController` references undefined `this.certificatesService`
**Labels:** `bug` `backend` `build-blocker`
**Status:** ✅ Fixed 2026-08-27 — deleted the orphaned `backend/src/certificates/` directory (controller + dto).
**Body:** `certificates.controller.ts:13` did `return this.certificatesService.search(queryDto);`, but `CertificatesController` had no constructor and no `certificatesService` property — and no `CertificatesService` class existed anywhere in the repo (verified by grep). `nest build` failed with `TS2339: Property 'certificatesService' does not exist`. The controller was also orphaned (registered in no module) and a redundant duplicate of the already-registered `GET /certificates/search` route in `CertificateController` (`certificate.controller.ts:97`). **Resolution:** removed the dead `src/certificates/` directory. If a standalone certificates search controller is wanted later, wire it to the existing `CertificateSearchService`.

---

**Title:** Backend `nest build` fails — `redis.health.ts` imports `Queue` as a value in a decorated signature
**Labels:** `bug` `backend` `build-blocker`
**Status:** ✅ Fixed 2026-08-27 — changed to `import type { Queue } from 'bull';`.
**Body:** `redis.health.ts:8` did `import { Queue } from 'bull'` and used `Queue` as a constructor parameter type decorated with `@InjectQueue(...)`. With `isolatedModules` + `emitDecoratorMetadata` enabled, TypeScript raised `TS1272: A type referenced in a decorated signature must be imported with 'import type'`. **Resolution:** switched to a type-only import. (Note: `tsc --noEmit` via `tsconfig.json` did not surface the `CertificatesController` error while `nest build` did — the two build paths disagree, worth reconciling.)

---

**Title:** Backend crashes on boot — `RedisHealthIndicator` cannot resolve `BullQueue_stellar-email-queue`
**Labels:** `bug` `backend` `build-blocker`
**Status:** ✅ Fixed 2026-08-27 — registered the queue in `HealthModule`.
**Body:** Once the two compile errors above were fixed, the app crashed at startup with a Nest DI error: `RedisHealthIndicator` (provided in `HealthModule`) injects `@InjectQueue('stellar-email-queue')`, but `HealthModule` never registered that Bull queue, so the `BullQueue_stellar-email-queue` provider could not be resolved. **Resolution:** added `BullModule.registerQueue({ name: 'stellar-email-queue' })` to `HealthModule.imports` (`backend/src/modules/health/health.module.ts`). The backend now boots and health checks (Redis + Stellar) return `up`.

---

**Title:** Soroban contract crate does not compile — stray `issuer.require_auth();` outside any function body in `lib.rs`
**Labels:** `bug` `contract` `build-blocker`
**Status:** ✅ Fixed 2026-08-27 — moved the call to the first line of `propose_certificate`.
**Body:** In `lib.rs:879` the statement `issuer.require_auth();` sat at `impl`-block level, between the closing brace of `update_multisig_config` and the `pub fn propose_certificate` declaration. A bare statement cannot exist outside a function body, so `cargo build` failed to compile the whole crate. **Resolution:** removed the stray line and added `issuer.require_auth();` as the first statement inside `propose_certificate` — this also closes the missing-authorization gap described in the contracts section below.

---

**Title:** Soroban `lib.rs` contains a committed raw unified-diff / patch fragment (invalid Rust)
**Labels:** `bug` `contract` `build-blocker`
**Status:** ✅ Fixed 2026-08-27 — deleted the diff fragment; applied its intended change.
**Body:** The tail of `lib.rs` (formerly lines 1459-1470) contained literal diff-hunk text — `@@ -1,4 +1,4 @@`, `-`/`+`-prefixed lines, and a stray `env.events().publish(...)` snippet — leftover from a botched merge/patch application. This was not valid Rust and guaranteed a compile failure. **Resolution:** removed the fragment and applied its intended change (the `transfer_done` symbol fix below) directly in `complete_transfer`.

---

**Title:** Soroban `symbol_short!("transfer_done")` exceeds the 9-character limit — will not compile
**Labels:** `bug` `contract` `build-blocker`
**Status:** ✅ Fixed 2026-08-27 — replaced with `Symbol::new(&env, "transfer_done")`.
**Body:** `lib.rs:678` emitted the transfer-completion event with `symbol_short!("transfer_done")`. The `symbol_short!` macro only accepts symbols up to 9 characters; `transfer_done` is 12, so it failed to compile. **Resolution:** switched to `Symbol::new(&env, "transfer_done")` and added `Symbol` to the `soroban_sdk` import list.

---

## Backend (new)

---

**Title:** Logout / token blacklist is never enforced on protected routes
**Labels:** `bug` `security` `backend`
**Body:** `AuthService.logout` blacklists the access token via `JwtManagementService.blacklistToken` (cache-backed), but the request-time [jwt-auth.guard.ts:58-65](backend/src/common/guards/jwt-auth.guard.ts#L58-L65) only calls `jwtService.verify(token)` and never calls `isTokenBlacklisted`; the passport [jwt.strategy.ts:38-56](backend/src/modules/auth/strategies/jwt.strategy.ts#L38-L56) also never consults the blacklist. As a result, logout has zero effect — a "logged out" token keeps working until natural expiry. The guard also never checks `user.isActive`/existence, so a suspended or deleted user's still-valid token keeps authenticating. Fix: make `JwtAuthGuard` async, check the blacklist, and re-load the user (active check), or route all auth through a single guard that does both.

---

**Title:** Two divergent JWT auth guards produce inconsistent `req.user` shapes
**Labels:** `tech-debt` `backend`
**Body:** `JwtAuthGuard` sets `req.user = { ...payload, id: payload.sub }` (raw claims + `sub` + `id`), while passport `JwtStrategy.validate` returns `{ id, email, role, isEmailVerified, twoFactorEnabled }` (no `sub`). Controllers use `@CurrentUser('sub')` in some places (e.g. `certificate-transfer.controller.ts:43,56,73,90`) and `@CurrentUser('id')` in others. A `sub` lookup silently returns `undefined` on any endpoint guarded by the passport strategy, which would break audit logging and ownership checks the moment a `sub`-based controller is switched to the passport guard. Fix: consolidate on one guard and one canonical `req.user` shape.

---

**Title:** `CryptoUtils.generateToken` / `generateNumericCode` use `Math.random()` for security tokens
**Labels:** `bug` `security` `backend`
**Body:** [crypto.utils.ts:36-55](backend/src/common/utils/crypto.utils.ts#L36-L55) builds tokens and OTP/numeric codes from `Math.random()`, which is not cryptographically secure and is predictable. The doc comments explicitly advertise these for "reset tokens" and "OTP, verification codes" — exactly the security-sensitive uses where predictability enables account takeover. Fix: use `crypto.randomBytes` / `crypto.randomInt` (as `UserPasswordService.generateToken` already does correctly).

---

**Title:** `CryptoUtils.verifyHMAC` uses a timing-unsafe `===` comparison
**Labels:** `bug` `security` `backend`
**Body:** [crypto.utils.ts:76-79](backend/src/common/utils/crypto.utils.ts#L76-L79) compares signatures with `expectedSignature === signature`, which short-circuits on the first differing byte and leaks timing information usable to forge HMAC signatures byte-by-byte. Fix: use `crypto.timingSafeEqual` on equal-length buffers (guarding for a length mismatch first).

---

**Title:** Certificate verification codes and IDs are generated with `Math.random()`
**Labels:** `bug` `security` `backend`
**Body:** `generateVerificationCode()` and `generateCertificateId()` in `certificate-issuance.service.ts:141-158` and `certificate.service.ts:842-852` (and the transfer `generateConfirmationCode()` in `certificate-transfer.service.ts:340-347`) draw every character from `Math.random()`. Verification codes are the primary secret behind the public `verifyCertificate` endpoint, and transfer confirmation codes gate ownership changes, so predictable values undermine the core trust model. There is also no DB uniqueness check on the 8-char code, allowing silent collisions. Fix: generate from `crypto.randomBytes` and enforce a unique constraint / retry on collision.

---

**Title:** Certificate verification checks status but not expiry
**Labels:** `bug` `backend`
**Body:** `findByVerificationCode` in `certificate-verification.service.ts:21-38` filters on `status = 'active'` but never checks `expiresAt`, even though the entity exposes an `isExpired()` getter (`certificate.entity.ts:174-177`). Any certificate whose `expiresAt` has passed but which has not yet been swept by the expiration job verifies as fully valid and even emits a `CERTIFICATE_VERIFIED` webhook. Fix: add `AND (certificate.expiresAt IS NULL OR certificate.expiresAt > NOW())` to the query, or reject when `isExpired()`.

---

**Title:** Webhook delivery has no SSRF protection on the subscription URL
**Labels:** `bug` `security` `backend`
**Body:** The webhook DTO validates the URL only with a bare `@IsUrl()` (`create-webhook-subscription.dto.ts:16-18`), and `webhooks.processor.ts:48-56` does `axios.post(subscription.url, ...)` to whatever host the user supplied. An attacker can register a webhook pointing at `http://169.254.169.254/...` (cloud metadata), `http://localhost:*`, or other internal services and receive the response back via the webhook log — a classic SSRF. Fix: restrict to `https`, resolve the host and reject private/link-local/loopback ranges before dispatch, and consider an allowlist.

---

**Title:** NotificationsGateway allows any WebSocket origin (`cors: { origin: '*' }`)
**Labels:** `bug` `security` `backend`
**Body:** The gateway in `notifications.gateway.ts:12-16,35` is declared with `cors: { origin: '*' }`, so any website can open an authenticated socket against the API using a victim's token, and it only calls `jwtService.verify` (no blacklist/active check), widening the revocation gap to the realtime channel. Fix: restrict `origin` to the configured `ALLOWED_ORIGINS` and validate token revocation/active status on connect.

---

**Title:** `initiateTransfer` does not verify the initiator owns/issued the certificate (IDOR)
**Labels:** `bug` `security` `backend`
**Body:** The controller (`certificate-transfer.controller.ts:34-47`) only requires the `ISSUER`/`ADMIN` role; the service (`certificate-transfer.service.ts:32-84`) loads the certificate by ID and never checks that `initiatorId` matches `certificate.issuerId`. Any issuer can therefore initiate — and, with the returned confirmation code, complete — a transfer of a certificate belonging to a different issuer. Fix: verify `certificate.issuerId === initiatorId` (or admin) before creating the transfer.

---

**Title:** Transfer confirmation code is sent to the initiator, not the intended new owner
**Labels:** `bug` `backend`
**Body:** Both the "initiated" and "completed" notifications in `certificate-transfer.service.ts:104-109,216-221` are created for `initiatorId`/`approverId`, and the initiation notification embeds the secret `confirmationCode`. The new owner (`toEmail`) is never notified and never receives the code, so the intended flow (new owner confirms with the code) is impossible — effectively the initiator both starts and approves the transfer. Fix: send the confirmation-code notification/email to `toEmail`, and notify the recipient on completion.

---

**Title:** 2FA verification endpoint has no rate limiting (brute-force)
**Labels:** `bug` `security` `backend`
**Body:** `AuthRateLimitMiddleware` is applied only to `auth/login` and `auth/register` (`auth.module.ts:56-63`). The `2fa/verify` route and `validateLogin` (`two-factor.service.ts:97-131`) have no attempt throttling or lockout, so a 6-digit TOTP (or 8-hex-char backup code) can be brute-forced within the 5-minute pre-auth window. Fix: apply rate limiting / attempt-counting to `2fa/verify` and invalidate the pre-auth token after a few failures.

---

**Title:** `AuthRateLimitMiddleware`: spoofable IP, wrong TTL unit, window-reset-on-hit, fail-open
**Labels:** `bug` `security` `backend`
**Body:** [auth-rate-limit.middleware.ts:14,29-40](backend/src/modules/auth/middleware/auth-rate-limit.middleware.ts#L14) keys on `req.headers['x-forwarded-for']` without sanitization (an attacker rotating that header bypasses the 5/min login cap); writes TTL as `{ ttl: this.windowSeconds }` (the cache-manager v4 shape — under v5 the arg must be milliseconds, so entries may never expire or expire at the wrong time); re-`set`s the counter on every hit (resetting the window each request); and fails open on any cache error (disabling brute-force protection during a cache outage). Fix: derive client IP from trusted-proxy config, use the correct TTL unit, avoid resetting TTL on increment, and fail closed for auth.

---

**Title:** User-defined regex patterns in metadata schemas enable ReDoS / uncaught 500s
**Labels:** `bug` `security` `backend`
**Body:** `validateField` in `metadata-schema.service.ts:250-260` compiles `new RegExp(field.pattern)` from issuer-controlled schema data and runs it against submitted metadata. A malicious/careless pattern (e.g. `(a+)+$`) causes catastrophic backtracking (ReDoS) that blocks the event loop, and an invalid pattern string throws an uncaught `SyntaxError` → 500. Fix: validate/limit patterns at schema-creation time, run matching with a safe-regex library or timeout, and wrap compilation in try/catch.

---

**Title:** `MetadataSchemaService.update` bypasses the `(name, version)` uniqueness guard
**Labels:** `bug` `backend`
**Body:** `create` rejects duplicate `(name, version)` pairs, but `update` (`metadata-schema.service.ts:88-105`) does a blanket `Object.assign(schema, dto)` and saves, allowing an existing schema's `name`/`version` to be changed to collide with another record with no conflict check. This corrupts the versioning invariant that `findLatestByName`/`upgradeSchema` rely on. Fix: disallow mutating `version` (or re-run the uniqueness check) inside `update`.

---

**Title:** Several certificate list/search/export queries are unbounded (no pagination/limit)
**Labels:** `enhancement` `performance` `backend`
**Body:** `getCertificatesByRecipient`, `getCertificatesByIssuer`, `getDuplicateCertificates`, `exportCertificates`, and `search` in `certificate-search.service.ts:57-135` all call `getMany()` with no `take`/pagination, loading every matching row into memory and JSON-serializing it. On a large issuer this causes slow responses and potential OOM, and the endpoints are attacker-reachable amplification vectors. Fix: add pagination (limit/offset or keyset) and a hard maximum page size; stream exports.

---

**Title:** Certificate text search uses case-sensitive `LIKE` with unescaped wildcards
**Labels:** `bug` `backend`
**Body:** The search query in `certificate-search.service.ts:114-119` builds `LIKE :query` with `%${query}%`. On Postgres `LIKE` is case-sensitive, so `John` won't match `john`, and the raw input is not escaped, so `%`/`_` act as wildcards (a caller can pass `%` to match everything). Values are parameterized so this is not SQL injection, but it is a correctness bug. Fix: use `ILIKE` and escape `%`, `_`, `\` in the user term.

---

**Title:** Global input-sanitization middleware strips all control chars, corrupting multi-line/tab data
**Labels:** `bug` `backend`
**Body:** `sanitize` in `input-sanitization.middleware.ts:17-28` removes every character with code `< 32` (and 127) from all string bodies/queries/params, which deletes newlines, carriage returns, and tabs from legitimate fields such as multi-line certificate descriptions, addresses, or JSON-encoded metadata submitted as strings. Silently mutating every request body app-wide is both surprising and data-destroying, and the per-character `split('').filter()` is an unnecessary allocation on every request. Fix: preserve `\n`/`\r`/`\t`, scope sanitization to specific fields, or rely on the existing validation/sanitize pipes.

---

**Title:** `EmailService` initializes its transporter asynchronously in the constructor (send-before-ready race)
**Labels:** `bug` `backend`
**Body:** The `EmailService` constructor (`email.service.ts:30-35`) fires `initializeTransporter()` (async — it awaits `createTestAccount()`) without awaiting and only `.catch`-logs failures, while `this.transporter` stays `undefined` until it resolves. Any email send during startup (or after a failed init) dereferences `undefined.sendMail` and throws. Fix: implement `OnModuleInit` and `await` transporter setup there, or lazily initialize/guard `this.transporter` before each send.

---

## Frontend (new)

---

**Title:** `login()` calls a non-existent `tokenStorage.setRefreshToken` — every login/registration throws
**Labels:** `bug` `frontend` `build-blocker`
**Status:** ✅ Fixed 2026-08-27 — dropped the broken `setRefreshToken` call and made `login` a 2-arg `(accessToken, user)` method.
**Body:** `AuthContext.tsx:141` called `tokenStorage.setRefreshToken(refreshToken)`, but `tokenStorage` (`api/tokens.ts:20-29`) only defines `getAccessToken`, `setAccessToken`, `clearTokens`, and `hasAccessToken`. Invoking `login()` threw `TypeError: tokenStorage.setRefreshToken is not a function` before `setUserState` ran, so auth state was never set and the user was never actually logged in — breaking the primary auth flow end-to-end. **Resolution:** removed the `setRefreshToken` call (the refresh token lives in an HttpOnly cookie), changed the context signature to `login(accessToken, nextUser)`, and now also call `setAccessTokenState(accessToken)` so `isAuthenticated` reacts immediately.

---

**Title:** `Login.tsx` calls `login()` with the wrong arguments (user passed as refresh token)
**Labels:** `bug` `frontend`
**Status:** ✅ Fixed 2026-08-27 — resolved together with the item above by adopting the 2-arg `login(accessToken, user)` signature, which matches both existing call sites.
**Body:** The old context signature was `login(accessToken, refreshToken, user)`, but `Login.tsx:52,60` call `login(regRes.accessToken, regRes.user)` / `login(res.accessToken, res.user)` — only two arguments, so `user` was bound to `refreshToken` and the real `nextUser` was `undefined`. **Resolution:** the context now takes `(accessToken, nextUser)`, so the existing two-argument call sites are correct and no longer clear the user.

---

**Title:** `IssueCertificate.tsx` (component) has a broken dead function and fakes issuance
**Labels:** `bug` `frontend`
**Status:** ⚠️ Partially fixed 2026-08-27 — removed the dead `handleConfirmIssue` function (it blocked `tsc -b`). The **fake issuance still remains**: `handleSubmit` still just `await`s a 1500 ms timeout and `alert()`s success without calling any API. Still needs wiring to the real create-certificate API (or deletion, along with its aspirational `IssueCertificate.test.tsx`).
**Body:** `handleConfirmIssue` referenced `issueCertificate`, `payload`, `toast`, and `navigate`, none of which were imported or defined — a reference error in a function that was never called (it broke the production build). Separately, the actual `handleSubmit` just `await`s a 1500 ms timeout and shows `alert("Certificate issued successfully on the Stellar network!")` without calling any API, so the form always reports success while issuing nothing. The component is only imported by its own test.

---

**Title:** Frontend production build (`tsc -b`) failed on several pre-existing type errors
**Labels:** `bug` `frontend` `build-blocker`
**Status:** ✅ Fixed 2026-08-27 — `npm run build` (`tsc -b && vite build`) now passes.
**Body:** Beyond the login crash, `npm run build:frontend` was already red due to several pre-existing `tsc -b` errors, all now fixed: (1) `endpoints.ts:107` — the `retryCondition` default dereferenced `error.statusCode` on an `unknown` param (now narrowed); (2) `endpoints.ts:1395-1396` — audit-log mapping read `createdAt`/`errorMessage`/`userEmail` which were absent from `AuditLogItem` (added as optional fields in `types.ts`) and passed a possibly-`undefined` value into `new Date(...)` (added a `Date.now()` fallback); (3) `CertificatePreview.tsx` — `Toast` props and `showToast` param were implicitly `any`, and a corner-ornament `style` spread leaked a numeric `rotate` into `CSSProperties` (destructured `rotate` out before spreading); (4) `IssuerProfile.tsx` (component) was a broken 10-line stub with an undefined `setFormData` and no default export despite having a test — implemented as a minimal working component (state + "Generate Stellar Keypair" button) that satisfies `IssuerProfile.test.tsx`.

---

**Title:** `ErrorBoundary` is defined but never mounted — a render error white-screens the whole app
**Labels:** `bug` `frontend`
**Body:** A working class-based `ErrorBoundary` exists (`components/ErrorBoundary.tsx`) but is imported by no file (verified). Because `App` (`App.tsx:41-172`) wraps the lazy `Suspense`/`Routes` tree without any error boundary, a render error or a failed `lazy()` chunk load white-screens the entire app with no recovery UI. Fix: wrap the `<Suspense>`/`<Routes>` (and ideally each lazy page) in `<ErrorBoundary>`.

---

**Title:** `isAuthenticated` memo omits the reactive `accessToken` dependency
**Labels:** `bug` `frontend`
**Body:** In `AuthContext.tsx:46-54`, `accessToken` state was added "so `isAuthenticated` is reactive," but the `useMemo` reads `tokenStorage.getAccessToken()` directly and lists only `[user]` as a dependency. After a silent refresh where the user object is unchanged (the refresh response carries no `user`), `setAccessTokenState` fires but the memo does not recompute, so consumers keep the stale auth value until the next user change. Fix: add `accessToken` to the dependency array and derive from that state rather than re-reading storage.

---

**Title:** Socket token rotation relies on a same-tab `storage` event that never fires — realtime notifications silently stop
**Labels:** `bug` `frontend`
**Body:** `NotificationContext.tsx:84-94` comments that a `storage` listener "fires in the same tab via a custom dispatch," but `tokenStorage.setAccessToken` (`api/tokens.ts:22`) just calls `localStorage.setItem`, and the `storage` event only fires in *other* tabs — no `dispatchEvent`/`StorageEvent` exists anywhere (verified). When `apiClient` silently refreshes the access token in the current tab, the WebSocket is never reconnected and keeps authenticating with the expired token, so realtime notifications stop. Fix: hook into the existing `setTokenRefreshCallback` mechanism to call `connectSocket(newToken)` on rotation.

---

**Title:** `isTokenExpired` uses `atob` on a base64url JWT payload — can misdecode/throw and spuriously log out
**Labels:** `bug` `frontend`
**Body:** `AuthContext.tsx:6-14` decodes the JWT payload with `atob`, but JWT segments are base64url (`-`/`_`) while `atob` expects standard base64; payloads containing those characters decode incorrectly or throw, and the `catch` then treats the token as expired. This can spuriously log a user out immediately after a valid login. Fix: convert base64url→base64 (`replace(/-/g,'+').replace(/_/g,'/')` + padding) before `atob`, or use a JWT-aware decoder.

---

**Title:** Access token stored in `localStorage` — exposed to XSS token theft
**Labels:** `security` `frontend`
**Body:** The JWT access token and serialized `user` are persisted in `localStorage` (`api/tokens.ts:20-29`, `AuthContext.tsx:36-41,109`), which is readable by any injected script; a single XSS payload can exfiltrate the bearer token. The refresh token is correctly HttpOnly, but the access token is not. Fix: keep the access token in memory only (rehydrate via the refresh endpoint on load) or move it to an HttpOnly cookie so JS-accessible storage never holds a usable bearer token.

---

**Title:** Header shows a "Wallet" link to roles the route rejects (`USER`, `AUDITOR`)
**Labels:** `bug` `frontend`
**Body:** For any authenticated non-issuer/admin user, `Header.tsx:43-45` renders a `Wallet → /wallet` nav item, but the `/wallet` route's `allowedRoles` (`App.tsx:56-69`) is `[RECIPIENT, VERIFIER, ISSUER, ADMIN]` — excluding `USER` (the default role assigned at registration) and `AUDITOR`. A freshly registered `USER` sees a Wallet link that redirects to `/` on click. Fix: gate the nav item on the same allowed roles, or add `USER`/`AUDITOR` to the route.

---

**Title:** "View Certificate" action button in the certificate table does nothing
**Labels:** `bug` `frontend`
**Body:** The final `FileText` action button in each row of `CertificateTable.tsx:612-617` has `title="View Certificate"` but no `onClick` handler, so clicking it is a no-op. Users see a visible, enabled control that silently does nothing. Fix: wire it to open the certificate detail/preview view, or remove the button.

---

**Title:** `RevokeCertificate` always renders a hardcoded green "Active" badge for found certificates
**Labels:** `bug` `frontend`
**Body:** In `RevokeCertificate.tsx:67-83,193`, the lookup only special-cases `status === 'revoked'`; any other status (including `expired` or `frozen`) falls into the preview branch, which unconditionally renders `<span ...>Active</span>`. An expired or frozen certificate is therefore mislabeled "Active" and offered up for revocation. Fix: render the badge from `certificate.status` and block/adjust the revoke flow for non-active statuses.

---

**Title:** Post-registration flow logs the user in despite required email verification
**Labels:** `bug` `frontend`
**Body:** `registerApi`'s own comment (`api/endpoints.ts:919-924`) states "Registration requires email verification before login is allowed," yet on success `Login.tsx:44-55` immediately calls `login(...)` and `navigate(returnUrl)`. The user is dropped into the authenticated app with an unverified account and no "check your email" screen, and protected API calls then fail server-side. Fix: after registration, show a verification-pending state (using `requiresEmailVerification` from `AuthResponse`) instead of logging in and redirecting.

---

**Title:** Raw `fetch` calls bypass envelope unwrapping and 401-refresh handling
**Labels:** `tech-debt` `frontend`
**Body:** `certificateApi.bulkExport`, `bulkExportAll`, and `issuerProfileApi.uploadProfilePicture` (`api/endpoints.ts:685-695,743-754,1270-1287`) call `fetch` directly with a manually attached `Authorization` header. Unlike `apiClient`, they do not attempt a silent token refresh on 401, do not retry, and do not unwrap the `{ statusCode, message, data }` envelope, so an expired access token forces a hard mid-session failure and error shapes are inconsistent. Fix: route these through a shared client helper (e.g. an `apiClient` variant that returns a `Blob` / handles `FormData`).

---

**Title:** Notification-preferences link is a raw `<a href>` that triggers a full page reload
**Labels:** `tech-debt` `frontend`
**Body:** `NotificationDropdown.tsx:103` uses `<a href="/preferences">` instead of a React Router `<Link>`. Clicking it forces a full document navigation, tearing down and re-bootstrapping the SPA (re-fetching bundles, re-running auth/notification providers) instead of a client-side transition. Fix: replace with `<Link to="/preferences">`.

---

**Title:** `CertificateWallet` has no dark-mode styling despite an app-wide dark theme
**Labels:** `enhancement` `frontend`
**Body:** The entire wallet page (`CertificateWallet.tsx:232-425`) uses light-only utility classes (`bg-white`, `text-gray-600`, `bg-green-100 text-green-800`, …) with no `dark:` variants, while the rest of the app supports dark mode via `ThemeContext`. In dark mode the wallet renders as bright white cards with low-contrast text — inconsistent and jarring. Fix: add `dark:` variants to the cards, status badges, and modal.

---

**Title:** Admin/analytics features are built but unreachable; a stray Next.js-style page is committed
**Labels:** `tech-debt` `frontend`
**Body:** `src/app/admin/users/page.tsx` uses the Next.js App Router convention (`page.tsx` default export) inside a Vite + React Router SPA; there is no `/admin` route in `App.tsx`, so it and `UserManagement` never render. `AdminAnalyticsDashboard` is only reachable indirectly via `Dashboard`, and several components (`CRLComponent`, `CertificateDemoPage`, `CsvExportButton`, `CertificateSearchBar`) are imported nowhere (verified). Fix: add proper React Router routes for the admin surface and remove or wire up the orphaned files.

---

## Stellar Contracts (new)

---

**Title:** `propose_certificate` performs no caller authorization (impersonation / spam)
**Labels:** `bug` `security` `contract`
**Body:** Neither `propose_certificate` implementation calls `issuer.require_auth()` — in `lib.rs` the intended call is the orphaned stray statement at line 879 (outside the function), and `multisig.rs:122-168` has none. Any account can create a `PendingRequest` naming an arbitrary `issuer`/`proposer` and pollute that issuer's and its signers' request indexes (`IssuerRequestIds`/`SignerRequestIds`) — an unauthenticated spam/DoS vector against paginated queries. Fix: add `issuer.require_auth();` as the first line of both functions.

---

**Title:** `lib.rs` `reject_request` does not verify the rejector is an authorized signer
**Labels:** `bug` `security` `contract`
**Body:** Unlike `approve_request` (which checks `config.signers.contains(&approver)`) and unlike `multisig.rs::reject_request` (which checks at line 274), `lib.rs::reject_request` (lines 987-1035) only calls `rejector.require_auth()` and never confirms the rejector is a configured signer. Any account can push rejections; once `signers.len() - rejections.len() < threshold` the request is force-set to `Rejected`, letting an outsider unilaterally kill any pending request. Fix: after loading `config`, panic/return failure if `!config.signers.contains(&rejector)`.

---

**Title:** `multisig.rs` `set_certificate_contract` lets anyone hijack the target certificate contract
**Labels:** `bug` `security` `contract`
**Body:** `set_certificate_contract` (`multisig.rs:353-356`) takes an `admin` param, calls `admin.require_auth()`, then overwrites `DataKey::CertificateContract` — but never checks that `admin` is a stored/expected admin. Any account can authorize itself and repoint the multisig contract at a malicious certificate contract, so subsequent `issue_approved_certificate` calls invoke attacker-controlled code. Fix: store an admin/config at init and require `admin` to match it (mirroring the `IssuerAdmin` pattern), or restrict to a configured signer set.

---

**Title:** `admin_multisig.rs` `AdminAction::UpgradeContract` upgrades the wrong contract
**Labels:** `bug` `contract`
**Body:** The `UpgradeContract` branch (`admin_multisig.rs:313-316`) calls `env.deployer().update_current_contract_wasm(...)`, which replaces the WASM of the AdminMultisig contract *itself*, not the certificate contract it governs. The certificate contract exposes its own `upgrade(new_wasm_hash)` guarded by admin auth (`lib.rs:1156`), which is presumably the intended target. As written, an approved "upgrade certificate contract" proposal silently bricks/replaces the admin multisig. Fix: `env.invoke_contract(&certificate_contract, &Symbol::new(&env,"upgrade"), ...)` using the stored contract id.

---

**Title:** `complete_transfer` never re-validates certificate status or current owner (double-transfer)
**Labels:** `bug` `security` `contract`
**Body:** `complete_transfer` (`lib.rs:603-686`) only checks the transfer's own status is `Accepted`; it re-reads the certificate but does not verify `cert.status == Active` nor that `cert.owner == transfer.from_owner`. Since `initiate_transfer` does not prevent multiple concurrent pending transfers, owner A can initiate transfers to both B and C; after completing A→B, completing A→C reads `cert.owner` (now B) as `previous_owner`, removes B from the owner index, and reassigns the cert to C — stripping B without consent. It also allows completing a transfer of a certificate frozen/revoked after acceptance. Fix: assert `cert.owner == transfer.from_owner` and `cert.status == Active`, and/or block a second pending transfer per certificate.

---

**Title:** `reissue_certificate` does not index the new certificate and leaves the old one active
**Labels:** `bug` `contract`
**Body:** `issue_certificate` records new certs in `IssuerCertIds`/`OwnerCertIds`, but `reissue_certificate` (`lib.rs:400-476`) only stores the certificate and emits an event — it never calls `append_cert_id`. Reissued certificates are therefore invisible to `get_certificates_by_issuer` / `get_certificates_by_owner`. The parent (`old_id`) is also left `Active`, so both parent and child are simultaneously valid despite "reissue/supersede" semantics. Fix: append the new id to both indexes and mark the original `Revoked`/`Superseded` (emitting a revocation event).

---

**Title:** Issued certificate expiry is set to the request's approval deadline
**Labels:** `bug` `contract`
**Body:** `issue_approved_certificate` (`lib.rs:1049-1056`, `multisig.rs:335-346`) passes `Some(request.expires_at)` as the certificate's `expires_at`. But `request.expires_at` was computed as `created_at + expiration_days*86400` and is the *proposal approval deadline*, not a certificate lifetime. The resulting certificate expires the moment the proposal would have timed out (often days), rather than having a proper validity period. Fix: carry a separate `cert_expires_at` on `PendingRequest`, or compute certificate expiry from issuance time.

---

**Title:** `batch_verify_certificates` treats `Frozen` certificates as valid
**Labels:** `bug` `contract`
**Body:** The `is_revoked` computation in `batch_verify_certificates` (`lib.rs:1214-1217`) counts `Revoked`, `Suspended`, `Expired`, and time-expiry, but omits `CertificateStatus::Frozen`. A frozen certificate is thus reported as `revoked: false` and counted as `successful`, contradicting `is_valid` (`lib.rs:358`) which returns `false` for any non-`Active` status. Verifiers relying on batch results treat frozen certs as good. Fix: add `|| cert.status == CertificateStatus::Frozen` (better: invalid == `status != Active || time-expired`).

---

**Title:** `lib.rs` `cancel_request` can cancel already-issued/approved requests
**Labels:** `bug` `contract`
**Body:** `cancel_request` (`lib.rs:1140-1153`) sets `status = Cancelled` after only checking `proposer == requester`; it does not verify the request is still `Pending`. The proposer can therefore mark an `Approved` or already-`Issued` request as `Cancelled`, corrupting state and misleading indexers. (The `multisig.rs` twin at line 397 correctly returns `false` for non-pending.) Fix: return early / panic unless `request.status == RequestStatus::Pending`.

---

**Title:** `crl.rs` `build_merkle_root` panics on certificate IDs longer than 256 bytes (revocation DoS)
**Labels:** `bug` `contract`
**Body:** Leaf construction in `crl.rs:326-329` uses a fixed `let mut buf = [0u8; 256];` and `id.copy_into_slice(&mut buf[..len])` where `len = id.len()`. If any revoked certificate ID exceeds 256 bytes, `buf[..len]` is out of bounds and panics, so `revoke_certificate` (which calls `refresh_crl_info` → `build_merkle_root` over all revoked IDs) aborts. A single over-long ID permanently blocks all further revocations for that issuer. Fix: build the `Bytes` directly from the `String` length without a fixed stack buffer, or reject over-long IDs at issuance.

---

**Title:** `crl.rs` Merkle tree lacks leaf/node domain separation and duplicates odd leaves
**Labels:** `security` `contract`
**Body:** In `crl.rs:293-351`, leaves are `sha256(id)` and internal nodes are `sha256(left || right)` with no domain-separation tag distinguishing the two, and odd nodes are promoted by duplicating the last leaf. This is the classic Merkle second-preimage/forgery weakness: an attacker can present an internal node as if it were a leaf, or exploit odd-duplication to craft alternative trees with the same root, undermining any off-chain inclusion proof against `merkle_root`. Fix: prefix leaves with `0x00` and internal nodes with `0x01` before hashing, and handle odd counts without silent duplication.

---

**Title:** `admin_multisig.rs` stores every proposal in instance storage (unbounded growth)
**Labels:** `bug` `contract`
**Body:** Config, every `AdminProposal`, `CertificateContractId`, and each `RemovedIssuer` flag all live in the single instance storage entry (`admin_multisig.rs:146,210,238,352` via `set_instance`), which must be deserialized in full on every call and has a hard size ceiling. As proposals accumulate, the instance entry grows unbounded, raising per-call cost and eventually risking exceeding the limit — the same class of bug already flagged for `multisig.rs`/`shadow.rs`, but this file was not previously covered. Fix: move `AdminProposal` (and `RemovedIssuer`) records to `persistent()` storage keyed per id, keeping only config in instance storage.
