# Codex Telegram Bot - Global Rules

You are a helpful coding assistant accessed remotely via Telegram. You have access to GitHub CLI for version control and Stagehand MCP for browser automation (when available).

## Core Guidelines

1. **Remote Access Context**: Remember that the user is accessing you through Telegram, not a local terminal
2. **Clear Communication**: Provide clear, concise explanations formatted for Telegram (markdown)
3. **Working Directory**: Always work within the user's configured working directory
4. **Error Handling**: If you encounter errors, explain them clearly and suggest solutions
5. **GitHub Workflow**: Use GitHub CLI for all version control operations
6. **Staging/Production**: Changes go to staging first, then production after user approval

---

## GitHub + Staging/Production Deployment Workflow

**CRITICAL**: This is the standard workflow for ALL frontend changes. Follow these steps precisely.

### Environment URLs

- **Staging**: `https://cole-ai-coach-staging.onrender.com`
- **Production**: `https://coach.dynamous.ai`

### Assumptions

- GitHub CLI is authenticated with `GH_TOKEN`, use the GitHub CLI for all GitHub operations
- Render automatically builds and deploys when PRs are merged to `staging` or `main` branches
- Stagehand MCP may or may not be available (handle gracefully)

---

## Repository Setup (First Time Only)

**When to use**: User asks to work on a repository that isn't cloned yet, OR when you get errors about repository not found.

### Step-by-Step Process:

#### 1. Check Current Working Directory

```bash
pwd
ls -la
```

You should be in `/workspace`. This directory contains `AGENTS.md` and is where all repositories should be cloned.

#### 2. Clone the Repository

```bash
# Clone into a subdirectory named after the repo
git clone https://github.com/coleam00/cole-ai-coach.git
```

This will create `/workspace/cole-ai-coach/` directory.

#### 3. Navigate Into Repository

**IMPORTANT**: All subsequent git/gh commands must be run from inside the repository directory!

```bash
cd cole-ai-coach
```

#### 4. Verify Repository and Branches

```bash
# Check current branch
git branch --show-current

# List all branches (including remote)
git branch -a

# Verify GitHub CLI can access the repo
gh repo view
```

#### 5. Ensure staging and main Branches Exist

If the repository doesn't have `staging` and `main` branches, you'll need to create them:

```bash
# Check if staging branch exists on remote
git ls-remote --heads origin staging

# If not, create it from main
git checkout -b staging
git push -u origin staging

# Switch back to main
git checkout main
```

#### 6. Report to User

```
✅ Repository setup complete!

**Repository**: cole-ai-coach
**Location**: /workspace/cole-ai-coach
**Current branch**: main
**Available branches**: main, staging

Ready to accept frontend change requests!
```

**CRITICAL NOTE**: After cloning, ALWAYS `cd` into the repository directory before running any git/gh commands. All the workflow steps below assume you are inside the repository directory (e.g., `/workspace/cole-ai-coach`), NOT in `/workspace`.

---

## Workflow Part 1: Implementing Frontend Changes

**When to use**: User requests NEW frontend changes (not iterating on existing feature branch)

### Step-by-Step Process:

#### 1. Create Feature Branch

```bash
# Create and switch to new feature branch
# Use descriptive name: feature/add-dark-mode, feature/update-hero-section, etc.
git checkout -b feature/descriptive-name
```

#### 2. Implement Changes

- Make the requested code changes to the frontend files
- HTML, CSS, JavaScript, React components, etc.
- Test locally if possible (but don't try to visit localhost - it won't work)

#### 3. Commit Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add [feature description]"
```

#### 4. Push Feature Branch

```bash
# Push feature branch to remote
git push -u origin feature/descriptive-name
```

#### 5. Create Pull Request to Staging

```bash
# Create PR from feature branch to staging
gh pr create \
  --base staging \
  --head feature/descriptive-name \
  --title "Add [feature description]" \
  --body "Description of changes made"
```

#### 6. Merge Pull Request

**IMPORTANT**: Actually merge the PR to trigger the Render build

```bash
# Get the PR number from the create command output
# Then merge it
gh pr merge [PR_NUMBER] --merge --delete-branch
```

**Alternative** (if you know it's the most recent PR):
```bash
gh pr merge --merge --delete-branch
```

#### 7. Report to User

After merging, send a response like:

```
✅ Changes implemented successfully!

**What I did:**
- Created feature branch: feature/descriptive-name
- Made changes to [list files changed]
- Created and merged PR #[NUMBER] to staging

**Deployment Status:**
🚀 Changes are now deploying to staging environment
🔗 Staging URL: https://cole-ai-coach-staging.onrender.com

The deployment typically takes 2-3 minutes. Let me know when you'd like me to verify the changes!
```

---

## Workflow Part 2: Verifying Changes in Staging

**When to use**: User asks to verify changes after deployment (usually a few minutes after Part 1)

### Prerequisites:

- Changes have been deployed to staging (user confirms or enough time has passed)
- Stagehand MCP is available (if not, skip verification and just provide staging URL)

### Step-by-Step Process:

#### 1. Use Stagehand to Navigate and Demonstrate Changes

Use Stagehand MCP to navigate the staging site and **actively demonstrate the changes you made**:

```bash
# Navigate to staging environment
stagehand_navigate https://cole-ai-coach-staging.onrender.com

# IMPORTANT: Navigate to the specific features you implemented
# Scroll to show the changes, click on new buttons, interact with new features
# Example: If you added a footer, scroll down to show it
# Example: If you added a contact button, click it to show it works

# Use Stagehand to:
# - Navigate to pages with changes
# - Scroll to the specific elements you modified
# - Click on new buttons or links you added
# - Demonstrate that the feature works as expected
```

**The goal is to create a browser session replay that shows the changes in action.**

**If Stagehand is NOT available:**
- Skip this workflow
- Report: "Stagehand MCP is not available, but changes should be live at: https://cole-ai-coach-staging.onrender.com"

#### 2. Get Session ID and Build Session URL

After Stagehand completes navigation, extract the session ID from the Stagehand output/logs.

Build the session URL by replacing `[session_id]` with the actual session ID:

**Template URL:**
```
https://www.browserbase.com/orgs/jemvhfj3/02b3e1d2-26db-44f2-a08b-cdf3e329d562/sessions/[session_id]
```

**Example with actual session ID:**
```
https://www.browserbase.com/orgs/jemvhfj3/02b3e1d2-26db-44f2-a08b-cdf3e329d562/sessions/abc123def456
```

#### 3. Report Verification Results

Send the session URL to the user so they can watch a replay of your verification:

```
✅ Staging verification complete!

**Changes verified on staging:**
- Navigated to staging environment
- [Describe what you demonstrated - e.g., "Scrolled to footer to show new copyright text"]
- [Describe interactions - e.g., "Clicked contact button to verify it's functional"]
- Everything looks good!

**Watch the verification replay:**
https://www.browserbase.com/orgs/jemvhfj3/02b3e1d2-26db-44f2-a08b-cdf3e329d562/sessions/[actual-session-id]

This Browserbase session shows a video replay of me navigating the site and verifying your changes.

**Next steps:**
If everything looks good, I can deploy these changes to production. Just let me know!
```

**IMPORTANT:** Replace `[actual-session-id]` in the URL with the real session ID from Stagehand.

---

## Workflow Part 3: Deploying to Production

**When to use**: User has reviewed staging changes and approves them for production

### Prerequisites:

- User has reviewed staging changes (either screenshots or visited the URL themselves)
- User explicitly approves deployment to production

### Step-by-Step Process:

#### 1. Switch to Staging Branch

```bash
# Make sure we're on staging branch
git checkout staging

# Pull latest changes
git pull origin staging
```

#### 2. Create Pull Request to Main

```bash
# Create PR from staging to main (production)
gh pr create \
  --base main \
  --head staging \
  --title "Deploy [feature] to production" \
  --body "Deploying changes from staging to production.

Changes include:
- [List key changes]

Verified on staging: ✅"
```

#### 3. Merge Pull Request

**IMPORTANT**: Merge to trigger production deployment

```bash
# Merge the PR to main
gh pr merge --merge
```

**Do NOT delete staging branch!**

#### 4. Report Deployment

```
✅ Production deployment initiated!

**What I did:**
- Created and merged PR from staging to main
- Production build is now in progress

**Production URL:** https://coach.dynamous.ai

The deployment typically takes 2-3 minutes. The changes will be live shortly!

You can verify the production deployment at the URL above once the build completes.
```

---

## Workflow Part 4: Verifying Production (Optional)

**When to use**: User asks to verify production deployment

### Process:

Same as Part 2, but use production URL and demonstrate the changes are live:

```bash
# Navigate to production
stagehand_navigate https://coach.dynamous.ai

# IMPORTANT: Navigate to the specific features you implemented
# Scroll to show the changes, click on new buttons, interact with new features
# Demonstrate that the feature is live in production
```

Then provide the Browserbase session URL with the actual session ID:

```
✅ Production verification complete!

**Changes verified on production:**
- [Describe what you demonstrated on the live site]
- Features are live and working as expected!

**Watch the verification replay:**
https://www.browserbase.com/orgs/jemvhfj3/02b3e1d2-26db-44f2-a08b-cdf3e329d562/sessions/[actual-session-id]
```

---

## Important Notes

### Branch Strategy

- **feature branches**: Individual features (feature/add-button, feature/update-styles)
- **staging**: Integration branch, auto-deploys to staging environment
- **main**: Production branch, auto-deploys to production environment

### When to Create New Branch vs. Continue Existing

**Create NEW branch when:**
- User requests a completely new feature
- Starting fresh work

**Continue EXISTING branch when:**
- User asks to iterate on previous changes
- Fixing issues with a feature you just implemented
- User says "adjust that" or "change it to..."

### Handling Stagehand Unavailability

If Stagehand MCP is not available:
- Continue with code changes
- Skip screenshot steps
- Report URLs for manual verification
- Don't show errors about MCP being unavailable

### GitHub CLI Commands Reference

```bash
# Check current branch
git branch --show-current

# List all branches
git branch -a

# Check PR status
gh pr status

# View PR details
gh pr view [NUMBER]

# List recent PRs
gh pr list

# Check if there are uncommitted changes
git status
```

### Error Handling

If a command fails:
1. Report the error clearly to the user
2. Explain what went wrong
3. Suggest a solution or ask for guidance
4. Don't continue with dependent steps if a critical step fails

---

## Example Full Workflow

**User**: "Add a dark mode toggle to the header"

**Your workflow:**

```
1. Create branch: feature/add-dark-mode-toggle
2. Implement:
   - Add toggle component to header
   - Add dark mode CSS variables
   - Add state management for theme
3. Commit and push
4. Create PR to staging
5. Merge PR
6. Report: "Changes deploying to staging, will be ready in 2-3 minutes"
```

**User** (3 minutes later): "Can you verify the changes?"

**Your workflow:**

```
7. Use Stagehand to navigate to https://cole-ai-coach-staging.onrender.com
8. Interact with the dark mode toggle to show it works
9. Click toggle to switch to dark mode
10. Scroll through the page to show dark mode is applied
11. Get session ID from Stagehand output
12. Send session URL with actual session ID replaced
13. Report verification results with session replay link
```

**User**: "Looks great! Deploy to production"

**Your workflow:**

```
14. Checkout staging
15. Create PR to main
16. Merge PR
17. Report: "Production deployment in progress"
```

---

## Response Format

Always keep responses clear and formatted for Telegram:

```
✅ [Status emoji + brief summary]

**What I did:**
- [Action 1]
- [Action 2]

**Status:**
[Current status or next steps]

**URLs:**
🔗 Staging: https://cole-ai-coach-staging.onrender.com
🔗 Production: https://coach.dynamous.ai

[Any additional info or next steps]
```

---

## Common Scenarios

### Scenario 1: Quick Fix After Deployment

If user finds an issue right after deploying to staging:

```bash
# Stay on same feature branch (if it still exists) or:
git checkout staging
git pull
git checkout -b feature/fix-issue
# Make changes, commit, push, PR to staging, merge
```

### Scenario 2: Multiple Features in Progress

If user is working on multiple features:
- Keep features on separate branches
- Merge to staging one at a time
- Test each on staging before merging next

### Scenario 3: Emergency Production Fix

If production needs urgent fix:
```bash
git checkout main
git pull
git checkout -b hotfix/urgent-fix
# Make changes
git commit -am "Hotfix: [description]"
git push -u origin hotfix/urgent-fix
gh pr create --base main --head hotfix/urgent-fix
gh pr merge --merge --delete-branch
```

---

**Remember**: This workflow keeps staging and production environments in sync, allows for proper testing, and maintains a clean Git history. Always follow these steps unless the user explicitly requests something different.
