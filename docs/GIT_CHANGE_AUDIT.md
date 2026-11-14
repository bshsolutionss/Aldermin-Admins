# Git change-count audit

Read-only Git inventory; no files deleted, reverted, staged, moved or committed. Counts describe the instant of inspection and include existing uncommitted work.

## C:/Users/USAID JAVED/Documents/GitHub/Aldermin-Admins

Tracked files: **480**. Existing HEAD commit: **true**. Modified/staged entries: **76**; untracked files: **163**; total expanded changed files: **239**. Deleted entries: **0**.

Directory counts: app/: 118; components/: 29; lib/: 35; (root): 4; .vscode/: 1; docs/: 30; scripts/: 2; tests/: 20.

Ignored build/cache artifacts: **9296**, grouped as {".next/":9294,"next-env.d.ts":1,"tsconfig.tsbuildinfo":1}. Generated build/cache candidates in changed files: **0**.

## C:/Users/USAID JAVED/Documents/lms/lms-backend

Tracked files: **0**. Existing HEAD commit: **false**. Modified/staged entries: **0**; untracked files: **253**; total expanded changed files: **253**. Deleted entries: **0**.

Directory counts: (root): 16; docs/: 25; scripts/: 1; src/: 154; test/: 57.

Ignored build/cache artifacts: **448**, grouped as {"dist/":444,"node_modules/":3,"tsconfig.build.tsbuildinfo":1}. Generated build/cache candidates in changed files: **0**.

The backend has no HEAD commit and no tracked files, so Git reports the entire existing backend source/configuration/test tree as new. This is the main reason its change count looks unusually large; it is not a diff against an established backend baseline. The frontend has an existing committed baseline plus accumulated uncommitted integrations. Git cannot assign authorship of uncommitted files.

Build outputs, compiler caches and dependency folders are ignored. Lockfiles are generated dependency manifests; SQL reviews, migration application evidence and route inventories are generated deliverables that remain intentionally visible for review. They are not disposable build output. Nothing was removed or reverted. Exact paths/statuses: [JSON inventory](./GIT_CHANGE_AUDIT.json).
