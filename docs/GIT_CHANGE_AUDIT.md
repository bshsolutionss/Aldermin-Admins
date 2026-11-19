# Git change-count audit

This read-only inventory command does not delete, revert, stage, move or commit source files. Counts describe the instant of inspection and include existing uncommitted work.

## C:/Users/USAID JAVED/Documents/GitHub/Aldermin-Admins

Tracked files: **645**. Existing HEAD commit: **true**. Modified/staged entries: **177**; untracked files: **88**; total expanded changed files: **265**. Deleted entries: **1**.

Directory counts: app/: 135; components/: 44; docs/: 25; (root): 1; scripts/: 3; tests/: 36; lib/: 21.

Ignored build/cache artifacts: **10787**, grouped as {".next/":10785,"next-env.d.ts":1,"tsconfig.tsbuildinfo":1}. Generated build/cache candidates in changed files: **0**.

## C:/Users/USAID JAVED/Documents/lms/lms-backend

Tracked files: **0**. Existing HEAD commit: **false**. Modified/staged entries: **0**; untracked files: **384**; total expanded changed files: **384**. Deleted entries: **0**.

Directory counts: (root): 16; docs/: 65; scripts/: 1; src/: 200; test/: 102.

Ignored build/cache artifacts: **586**, grouped as {"dist/":582,"node_modules/":3,"tsconfig.build.tsbuildinfo":1}. Generated build/cache candidates in changed files: **0**.

The backend has no HEAD commit and no tracked files, so Git reports the entire existing backend source/configuration/test tree as new. This is the main reason its change count looks unusually large; it is not a diff against an established backend baseline. The frontend has an existing committed baseline plus accumulated uncommitted integrations. Git cannot assign authorship of uncommitted files.

Build outputs, compiler caches and dependency folders are ignored. Lockfiles are generated dependency manifests; SQL reviews, migration application evidence and route inventories are generated deliverables that remain intentionally visible for review. They are not disposable build output. Nothing was removed or reverted. Exact paths/statuses: [JSON inventory](./GIT_CHANGE_AUDIT.json).
