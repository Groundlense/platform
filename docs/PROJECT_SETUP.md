# Groundlense Project Setup Notes

This document explains the current project structure, the tooling choices, the setup steps completed so far, and the terminal issues that were fixed during initial setup.

## Current Stack

- Package manager: pnpm `11.4.0`
- Monorepo task runner: Turborepo `2.9.15`
- Backend app: NestJS API in `apps/api`
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
    web/                 # Placeholder folder, no package.json yet
    mobile/              # Placeholder folder, no package.json yet
  docs/                  # Project documentation
  infra/
    docker/              # Placeholder infra folder
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
  unrs-resolver: true
```

The `allowBuilds` section was added because pnpm flagged `@nestjs/core` and `unrs-resolver` as packages that run build/postinstall scripts. Setting these to `true` avoids pnpm asking for that decision interactively.

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
  "test": "turbo run test"
}
```

The previous `devEngines.packageManager` block was removed because it conflicted with the top-level `packageManager` field.

## API App Scripts

The API app is a NestJS project at `apps/api`.

Important scripts:

```json
"scripts": {
  "dev": "nest start --watch",
  "build": "nest build",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

The `dev` script was added so the root command `turbo run dev` can discover and run the API app using a standard monorepo task name.

## Commands To Use

From the repo root:

```powershell
pnpm.cmd install
pnpm.cmd dev
pnpm.cmd build
pnpm.cmd lint
pnpm.cmd test
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

## Notes For Other Developers

- Run commands from the repo root unless you specifically want to work inside `apps/api`.
- Use `pnpm.cmd` on Windows PowerShell if `pnpm` is blocked.
- `apps/api` currently contains its own `.git` folder, so the root repo may show `apps/` as untracked or treat the API folder like a nested repository. If this is meant to be a single monorepo, that nested `.git` folder should eventually be removed or converted intentionally into a submodule.
- `.env` is ignored and should remain local.
- `pnpm-lock.yaml` is currently ignored by `.gitignore`. For most pnpm projects, committing the lockfile is recommended for reproducible installs; decide this as a team before changing it.
