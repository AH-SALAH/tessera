#!/usr/bin/env bash
#
# setup-branch-protection.sh
#
# Configures branch protection rules for the main branch via GitHub CLI.
# Requires: gh CLI authenticated (run `gh auth login` first).
#
# Usage:
#   ./scripts/setup-branch-protection.sh [owner/repo]
#
# If no repo is provided, it auto-detects from the git remote.

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[info]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; }

# --- Preflight checks ---
if ! command -v gh &>/dev/null; then
  error "GitHub CLI (gh) is not installed. Install it: https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  error "Not authenticated. Run: gh auth login"
  exit 1
fi

# --- Resolve repo ---
if [[ -n "${1:-}" ]]; then
  REPO="$1"
else
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
  if [[ -z "$REPO" ]]; then
    error "Could not detect repo from git remote. Pass owner/repo as argument."
    exit 1
  fi
fi

info "Configuring branch protection for: $REPO (main)"

# --- Apply branch protection ---
# This uses the GitHub REST API via gh to set required status checks,
# required reviews, and restrictions on the main branch.
gh api \
  --method PUT \
  "repos/${REPO}/branches/main/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "typecheck",
      "lint",
      "unit-tests",
      "design-token-audit"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

echo ""
info "Branch protection configured for main."
echo ""
echo "  Required status checks:  typecheck, lint, unit-tests, design-token-audit"
echo "  Required reviews:        1 approval, stale reviews dismissed"
echo "  Conversation resolution: required"
echo "  Force pushes:            blocked"
echo "  Admin bypass:            enabled (admins can merge without reviews)"
echo ""
echo "  NOTE: e2e-tests, graphql-schema-diff, storybook, and lighthouse are"
echo "  NOT required checks — they run on PRs but won't block merge if they"
echo "  fail (they're slower and can be flaky). Remove this note if you want"
echo "  them required too."
echo ""
info "Done."
