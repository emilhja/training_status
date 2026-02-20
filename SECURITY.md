# Security Guide

This document covers secret management practices for this project, what was found in the security audit, and how to protect credentials going forward.

## Audit Results (2026-02-20)

### Git history
**Clean.** No real secrets have ever been committed. The `.env` file has never appeared in any commit across all 5 commits in history.

### Current files on disk
The `.env` file exists locally and contains three real credentials:

| Variable | Description |
|----------|-------------|
| `INTERVALS_ID` | Your Intervals.icu athlete ID |
| `INTERVALS_API_KEY` | 25-character API key for Intervals.icu |
| `SMASHRUN_TOKEN` | Long-lived bearer token for Smashrun |

These are correctly gitignored and pose no git risk, but see the recommendations below for local and rotation hygiene.

---

## Recommendations

### 1. Rotate credentials periodically

Even though the secrets were never committed, it is good practice to rotate them regularly — especially if:
- You clone this repo on another machine
- Your machine is shared or your home directory is cloud-synced (Dropbox, iCloud, etc.)
- You ever paste a secret into a terminal with shell history logging

**Intervals.icu API key:**
Log in → Settings → API → regenerate key → update `.env`.

**Smashrun token:**
The Smashrun token is a bearer token obtained via OAuth. Re-run the auth flow in the app (`/api/smashrun/auth`) to get a new one. The token may expire on its own — the app already detects expiry and shows a re-auth prompt.

---

### 2. Add a pre-commit hook to block `.env` from being committed

Even though `.env` is gitignored, a `git add -f .env` or a misconfigured gitignore could bypass that. A pre-commit hook adds a second layer of protection.

**Option A — Simple manual hook**

Create the file `.git/hooks/pre-commit` with this content:

```bash
#!/bin/sh
if git diff --cached --name-only | grep -qE "^\.env$|^\.env\.local$"; then
  echo "ERROR: Attempting to commit a .env file. Remove it from staging:"
  echo "  git reset HEAD .env"
  exit 1
fi
```

Then make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

Note: `.git/hooks/` is not committed to the repository, so each developer/machine needs to set this up manually.

**Option B — `pre-commit` framework (recommended for teams)**

Install the [`pre-commit`](https://pre-commit.com/) tool and create `.pre-commit-config.yaml` at the project root:

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

Then initialize:

```bash
pip install pre-commit detect-secrets
detect-secrets scan > .secrets.baseline   # creates baseline of known non-secrets
pre-commit install                        # installs the hook
```

This scans every staged file for high-entropy strings and known secret patterns before each commit.

---

### 3. Protect your local `.env` file

The secrets live in plain text on disk. A few steps to reduce local exposure:

- **File permissions:** Restrict read access to your own user only:
  ```bash
  chmod 600 .env
  ```
- **Cloud sync exclusion:** If your home directory is synced (Dropbox, iCloud Drive, etc.), exclude this project folder or at minimum the `.env` file from sync.
- **Shell history:** Avoid copying secrets directly into the terminal. Use `export $(cat .env | xargs)` rather than `export INTERVALS_API_KEY=<paste>` to keep values out of `~/.bash_history` / `~/.zsh_history`.

---

### 4. Never commit `.env.example` with real values

The current `.env.example` file is safe — it contains only placeholder strings like `your_api_key_here`. Keep it that way. If you update `.env.example`, double-check that no real values crept in before committing.

---

### 5. Consider a secrets manager for production

If this app is ever deployed to a server or container, avoid shipping `.env` files to the server. Instead, use:

- **Environment variables set by the host** (systemd unit file, Docker `-e` flags, Kubernetes secrets)
- **A secrets manager** such as HashiCorp Vault, AWS Secrets Manager, or Doppler

The app already reads credentials via `pydantic_settings.BaseSettings`, so it will pick up environment variables set by the host without any code changes.

---

## Current Gitignore Coverage

The following patterns in `.gitignore` protect secrets from accidental commits:

```
.env
.env.local
```

These cover the standard file names. If you ever add other secret files (e.g. `.env.production`, `secrets.yaml`), add them to `.gitignore` immediately.

---

## Summary

| Risk | Current Status | Action Needed |
|------|---------------|---------------|
| Secrets in git history | None — clean | None |
| `.env` committed | Never happened | None |
| Credential rotation | Not done recently | Recommended |
| Pre-commit hook | Not set up | Recommended |
| Local file permissions | Unknown | Run `chmod 600 .env` |
| `.env.example` safety | Clean (placeholders only) | None |
