# Fix All GitHub Issues (Autonomous Mode)

**IMPORTANT**: This workflow runs AUTONOMOUSLY without human intervention.
- Do NOT use AskUserQuestion or ask for clarification during execution
- Use your best judgment to make decisions
- Leverage available tools, skills (e.g., `frontend-design`), and agents (e.g., `Explore`, `Plan`) as needed
- If truly blocked with no way forward, mark the issue and move on

Work through all open GitHub issues sequentially with the following workflow:

## Setup
1. Fetch all open issues from GitHub: `gh issue list --state open --json number,title,body,labels`
2. Create a todo list with all issues to track progress
3. Ensure local environment is running (backend on port 8080, frontend on port 3000)
4. Create required labels if they don't exist:
```bash
gh label create "in-progress" --color "FFA500" --description "Currently being worked on" 2>/dev/null || true
gh label create "ready-for-deploy" --color "90EE90" --description "Fix committed, awaiting deployment" 2>/dev/null || true
gh label create "blocked" --color "D93F0B" --description "Blocked - requires human intervention" 2>/dev/null || true
```

## For Each Issue (Sequential Processing)

### 1. Start Working on Issue
- Add comment to issue: `gh issue comment <number> -b "🚧 Started working on this issue"`
- Add "in-progress" label: `gh issue edit <number> --add-label "in-progress"`
- Update todo list to mark issue as in_progress

### 2. Understand the Issue
- Read the issue description and acceptance criteria
- Identify if it's a frontend (FE), backend (BE), or full-stack issue
- Use the `Explore` agent to search the codebase and understand context
- Determine affected components and files

### 3. Implement the Fix
- Make the necessary code changes
- Use the `frontend-design` skill for UI components if needed
- Follow existing patterns in the codebase
- Keep changes focused on the issue scope

### 4. Add Unit Tests (If Necessary)
- For BE: Add JUnit tests in `proppilot-backend/src/test/java/`
- For FE: Add tests if testing infrastructure exists
- Test both happy path and edge cases

### 5. Build and Verify
- BE: Run `./mvnw clean compile -f proppilot-backend/pom.xml`
- FE: Run `npm run build` in proppilot-frontend
- Fix any compilation errors autonomously

### 6. Test Locally with Playwright
- Use browser automation to test the fix
- **Happy path**: Test the expected behavior works correctly
- **Non-happy path**: Test error handling, validation, edge cases
- Create/modify test data as needed through the UI
- Take screenshots to document test results

### 7. Commit the Fix
- Stage only files related to this issue
- Commit with message format: `fix: <issue title> (#<issue number>)`
- Do NOT include Claude Code authoring references

### 8. Mark Issue as Ready for Deploy
- Add comment: `gh issue comment <number> -b "✅ Fix committed, awaiting deployment"`
- Remove "in-progress" label: `gh issue edit <number> --remove-label "in-progress"`
- Add "ready-for-deploy" label: `gh issue edit <number> --add-label "ready-for-deploy"`
- Update todo list to mark implementation as completed (but issue stays open)
- Move to next issue

## Handling Blocked Issues

If an issue cannot be resolved autonomously (e.g., unclear requirements, external dependency, access issues, needs business decision):

1. **Document the blocker** in a comment with details:
```bash
gh issue comment <number> -b "🚫 **Blocked - Requires Human Intervention**

**Reason**: <describe what's blocking>
**Attempted**: <what was tried>
**Needed**: <what human action is required>

Moving to next issue."
```

2. **Update labels**:
```bash
gh issue edit <number> --remove-label "in-progress"
gh issue edit <number> --add-label "blocked"
```

3. **Update todo list** to mark as blocked and move to next issue

4. **Do NOT close blocked issues** - leave them open for human review

## After All Issues Are Fixed

### Deploy to Production
1. Ensure all commits are in place
2. Push to main branch: `git push origin main`
3. Wait for Railway deployments to complete:
   - Backend: Check Railway dashboard or logs
   - Frontend: Check Railway dashboard or logs
4. Verify deployment is live and working

### Replicate Data Changes in Production
After deployment, replicate any test data changes made locally to production using the test account:
- **Test account email**: juanmgracia@gmail.com
- Use Playwright to interact with the production app (https://proppilot-frontend-production.up.railway.app or similar)
- Create the same test entities (properties, tenants, leases, payments) that were used during testing
- This ensures the test account has representative data for ongoing QA

### Close All Fixed Issues
After successful deployment and verification:
1. For each issue that was fixed (NOT blocked):
   - Add final comment: `gh issue comment <number> -b "🚀 Deployed to production and verified"`
   - Remove "ready-for-deploy" label: `gh issue edit <number> --remove-label "ready-for-deploy"`
   - Close the issue: `gh issue close <number>`
2. Update todo list to mark all issues as completed
3. Leave blocked issues open with their documentation

## Issue Status Flow
```
Open → in-progress → ready-for-deploy → Closed (after prod deploy)
                  ↘ blocked (requires human intervention, stays open)
```

## Labels Used
- `in-progress`: Currently being worked on
- `ready-for-deploy`: Fix committed, waiting for deployment
- `blocked`: Cannot proceed without human intervention

## Important Notes
- **AUTONOMOUS**: Do not ask user for input - make decisions independently
- **USE AGENTS**: Leverage Explore agent for codebase navigation, Plan agent for complex tasks
- **USE SKILLS**: Use frontend-design skill for UI work
- One commit per issue - keep changes atomic
- No pull requests - commit directly to main
- Test thoroughly before moving to next issue
- Issues are ONLY closed after successful production deployment
- Blocked issues stay open with detailed documentation
- All database queries should respect multi-tenant architecture (filter by owner_id)
