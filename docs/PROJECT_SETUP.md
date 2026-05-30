# Groundlense Project Setup Notes

This document explains the current project structure, the tooling choices, the setup steps completed so far, and the terminal issues that were fixed during initial setup.

## Current Stack

- Package manager: pnpm `11.4.0`
- Monorepo task runner: Turborepo `2.9.15`
- Backend app: NestJS API in `apps/api`
- API runtime port: `3000`
- API global prefix: `/api/v1`
- Database: PostgreSQL through Prisma
- Cache/queue dependency: Redis, used by BullMQ/ioredis dependencies
- Local infrastructure: Docker Compose in `infra/docker/docker-compose.yml`
- Workspace file: `pnpm-workspace.yaml`
- Root task config: `turbo.json`

## Folder Structure

```text
groundlense/
  apps/
    api/                 # NestJS backend app, currently the only runnable app
      src/
      test/
      package.json
      nest-cli.json
      tsconfig.json
      tsconfig.build.json
      eslint.config.mjs
      prisma/
        schema.prisma
      prisma.config.ts
    web/                 # Placeholder folder, no package.json yet
    mobile/              # Placeholder folder, no package.json yet
  docs/                  # Project documentation
  infra/
    docker/
      docker-compose.yml # Local Postgres and Redis services
    nginx/               # Placeholder infra folder
    scripts/             # Placeholder infra scripts folder
  packages/
    api-client/          # Placeholder shared package folder
    config/              # Placeholder shared package folder
    types/               # Placeholder shared package folder
  package.json           # Root monorepo package
  pnpm-workspace.yaml    # pnpm workspace configuration
  turbo.json             # Turborepo task pipeline
  pnpm-lock.yaml         # pnpm lockfile
  .env                   # Local environment file, ignored by Git
```

Only `apps/api` is currently a real package with dependencies and scripts. The other app/package folders are placeholders for future work.

## Workspace Configuration

The pnpm workspace includes all apps and packages:

```yaml
packages:
  - "apps/*"
  - "packages/*"
allowBuilds:
  '@nestjs/core': true
  '@prisma/client': true
  '@prisma/engines': true
  bcrypt: true
  msgpackr-extract: true
  prisma: true
  unrs-resolver: true
```

The `allowBuilds` section was added because pnpm flagged packages that run build/postinstall scripts. These approvals are set to real boolean values so pnpm can install non-interactively.

## Root Scripts

The root `package.json` now declares the package manager in the format Turborepo expects:

```json
"packageManager": "pnpm@11.4.0"
```

Root scripts:

```json
"scripts": {
  "dev": "turbo run dev",
  "build": "turbo run build",
  "lint": "turbo run lint",
  "test": "turbo run test",
  "prisma:validate": "pnpm --filter api exec prisma validate",
  "prisma:generate": "pnpm --filter api exec prisma generate",
  "prisma:migrate:dev": "pnpm --filter api exec prisma migrate dev"
}
```

The previous `devEngines.packageManager` block was removed because it conflicted with the top-level `packageManager` field.

## API App Scripts

The API app is a NestJS project at `apps/api`.

The app currently boots with:

- Global route prefix: `/api/v1`
- Validation pipe enabled globally
- Validation settings: `whitelist`, `transform`, and `forbidNonWhitelisted`
- HTTP port: `3000`

Important scripts:

```json
"scripts": {
  "dev": "nest start --watch",
  "build": "nest build",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "prisma:validate": "prisma validate",
  "prisma:generate": "prisma generate",
  "prisma:migrate:dev": "prisma migrate dev",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

The `dev` script was added so the root command `turbo run dev` can discover and run the API app using a standard monorepo task name.

## API Dependencies Added

The backend package includes the NestJS baseline plus dependencies for the expected backend foundation:

- Configuration: `@nestjs/config`
- Authentication building blocks: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- Validation and transformation: `class-validator`, `class-transformer`, `zod`
- Database: `prisma`, `@prisma/client`
- Password hashing: `bcrypt`
- Queues/cache clients: `bullmq`, `ioredis`
- IDs/utilities: `uuid`

Prisma is configured in `apps/api/prisma.config.ts`, with schema at `apps/api/prisma/schema.prisma`.

The current Prisma schema uses PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

The Prisma client generator currently outputs to:

```text
apps/api/generated/prisma
```

That generated folder is ignored by `apps/api/.gitignore`.

## Local Docker Services

Local infrastructure was added at `infra/docker/docker-compose.yml`.

Services:

- `postgres`: PostgreSQL 16, exposed on host port `5432`
- `redis`: Redis 7, exposed on host port `6379`
- `postgres_data`: named Docker volume for PostgreSQL data

Default local Postgres settings:

```text
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=groundlense
```

Expected API database URL for local development:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/groundlense"
```

## Commands To Use

From the repo root:

```powershell
pnpm.cmd install
pnpm.cmd dev
pnpm.cmd build
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd prisma:validate
pnpm.cmd prisma:generate
pnpm.cmd prisma:migrate:dev
```

To start local infrastructure:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

To stop it:

```powershell
docker compose -f infra/docker/docker-compose.yml down
```

On this Windows machine, `pnpm.cmd` is safer in PowerShell because plain `pnpm` may resolve to `pnpm.ps1`, which can be blocked by PowerShell execution policy.

To permanently allow plain `pnpm` in PowerShell:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

After that, these should work:

```powershell
pnpm install
pnpm dev
pnpm build
```

## What Was Fixed

During setup, these issues were found and fixed:

1. PowerShell blocked `pnpm.ps1`

   Error:

   ```text
   pnpm.ps1 cannot be loaded because running scripts is disabled on this system
   ```

   Workaround: use `pnpm.cmd`.

2. Turborepo could not resolve the workspace

   Error:

   ```text
   Could not resolve workspaces.
   Missing `packageManager` field in package.json
   ```

   Fix: added top-level `"packageManager": "pnpm@11.4.0"` to root `package.json`.

3. Root `dev` task did not match the API app

   Root was running:

   ```text
   turbo run dev
   ```

   But `apps/api` only had `start:dev`.

   Fix: added:

   ```json
   "dev": "nest start --watch"
   ```

   to `apps/api/package.json`.

4. pnpm had placeholder build approvals

   `pnpm-workspace.yaml` contained placeholder values asking whether to allow build scripts.

   Fix: set:

   ```yaml
   allowBuilds:
     '@nestjs/core': true
     unrs-resolver: true
   ```

5. Local generated folders were visible to Git

   `.pnpm-store` and `.turbo` were added to `.gitignore`.

6. API app accidentally contained a nested Git repository

   Error:

   ```text
   error: 'apps/api/' does not have a commit checked out
   error: unable to index file 'apps/api/'
   fatal: adding files failed
   ```

   Cause: `apps/api` had its own `.git` directory, but this project is intended to be a single monorepo and there was no root `.gitmodules` file.

   Fix: removed only `apps/api/.git`, then staged `apps/api` as normal files in the root repository.

7. Windows line-ending warnings appeared during `git add`

   Example:

   ```text
   warning: in the working copy of 'package.json', LF will be replaced by CRLF the next time Git touches it
   ```

   These warnings are not fatal. They come from Git line-ending normalization on Windows.

8. Prisma was accidentally initialized at the repo root

   Symptoms:

   ```text
   prisma.config.ts
   prisma/schema.prisma
   ```

   appeared at the repo root, while the intended API schema already lived under `apps/api/prisma/schema.prisma`.

   Fix: removed the accidental root Prisma config/schema and added root scripts that route Prisma commands to the `api` workspace package with `pnpm --filter api exec ...`.

## Verification Completed

The workspace was refreshed with:

```powershell
pnpm.cmd install --config.confirmModulesPurge=false
```

The build was verified with:

```powershell
.\node_modules\.bin\turbo.cmd run build
```

Result:

```text
Tasks: 1 successful, 1 total
```

Git staging was also verified after removing the accidental nested API repository:

```powershell
git add .
git status --short --branch
```

The API files were staged as normal files under the root repository.

Prisma validation was verified with:

```powershell
pnpm.cmd prisma:validate
```

Result:

```text
The schema at prisma\schema.prisma is valid
```

## Notes For Other Developers

- Run commands from the repo root unless you specifically want to work inside `apps/api`.
- Use `pnpm.cmd` on Windows PowerShell if `pnpm` is blocked.
- `apps/api` previously contained its own `.git` folder. That nested Git metadata has been removed so the root repo tracks the API as normal monorepo files.
- `.env` is ignored and should remain local.
- `pnpm-lock.yaml` is currently ignored by `.gitignore`. For most pnpm projects, committing the lockfile is recommended for reproducible installs; decide this as a team before changing it.
