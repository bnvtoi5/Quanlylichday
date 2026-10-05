# Security Specification: EduTrack Firestore Architecture

## 1. Data Invariants
1. Only authenticated users (`request.auth != null`) can read or write documents.
2. An authorized user profile at `/users/{userId}` can only be created or modified if `request.auth.uid == userId`.
3. Document IDs in paths `/semesters/{semesterId}`, `/catalogs/{catalogId}`, and `/users/{userId}` must conform to safe regex rules (`isValidId(id)`).
4. System modification timestamp must not be arbitrarily backdated.
5. All write operations to `/semesters/{semesterId}` and `/catalogs/{catalogId}` require authenticated users.
6. Catch-all fallback rule denies all reads and writes to undefined collections (`match /{document=**} { allow read, write: if false; }`).

## 2. The "Dirty Dozen" Payloads
The following payloads illustrate forbidden manipulation attempts that must be denied with `PERMISSION_DENIED`:

1. **Unauthenticated Read on Semesters**: Anonymous request without `request.auth` trying to list `/semesters`.
2. **Unauthenticated Write on Semesters**: Anonymous user writing `/semesters/sem-hack`.
3. **ID Poisoning Attack**: Document ID injection with 1KB non-alphanumeric string `/semesters/../../evil`.
4. **User Profile Impersonation**: Attacker with UID `user-A` attempting to write to `/users/user-B`.
5. **Privilege Escalation on User Profile**: Non-admin attempting to set `role: "admin"` on another user's document.
6. **Corrupt Semester Payload (Missing Required Fields)**: Writing a semester document with empty `name` or missing `startDate`.
7. **Giant String Memory Bomb**: Attempting to write a 2MB payload into semester title.
8. **Catalog Overwrite with Invalid Schema**: Writing raw non-array objects into `masterSubjects`.
9. **Direct Write to Undefined Collection**: Writing to `/confidential_tokens/{tokenId}` or `/admins/{id}`.
10. **Shadow Key Injection on Semester**: Inserting shadow admin keys like `__isAdmin: true` into `/semesters/{semesterId}`.
11. **Malicious Catalog ID**: Writing catalog to non-alphanumeric ID `/catalogs/!@#$%`.
12. **Unauthenticated List on Users**: Trying to list all users without auth tokens.

## 3. Test Runner Design
A test runner validates that each of the Dirty Dozen requests yields `PERMISSION_DENIED` under strict ABAC and Zero-Trust rules.
