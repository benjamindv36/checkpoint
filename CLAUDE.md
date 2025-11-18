# CLAUDE2.md

General guidance for AI-assisted development workflows.

## 🚨 SESSION START CHECKLIST

**ALWAYS do this at the start of EVERY session:**
1. Read mission, roadmap and tech stack files in /agent-os/product/ to understand the product
2. Read project overview/specification files for current task (in /agent-os)
3. Acknowledge what you've read
4. Ask clarifying questions before coding

**Philosophy**: Plan upfront to get it right first time, not iterate on wrong assumptions.

**CRITICAL**: If user's request seems unclear, ambiguous, or nonsensical → ALWAYS ask for clarification before taking action. Never assume intent.


## Meta-Instruction: Behavior Updates

**CRITICAL**: When user makes remarks about AI behavior or workflow preferences:
1. **IMMEDIATELY update the CLAUDE.md file** to incorporate the feedback
2. Add specific instructions in the relevant section
3. This ensures the behavior change persists across all future sessions
4. Never just say "I'll remember that" - **DOCUMENT IT**

**Atomic TODOs rule**: Mark todos as completed only after the work is finished and verified, never before. Update the todo tracker after successful execution to keep state atomic.

**How to update CLAUDE.md:**
- **Keep it concise** - 1-2 lines per instruction, follow existing pattern
- **Match the document style** - short bullets, clear rules, no walls of text
- **Generalize** - extract the principle, not verbose explanations
- **Bad**: 127 lines with examples, checklists, code samples
- **Good**: "Never query same table from its own RLS policy (causes infinite recursion)"

**When asking user for decisions**: Always provide your recommendation for what works best for AI-assisted development, since user may not know optimal AI guidance patterns.

## Decision Trees

### Before Database/Backend Work
1. Search for existing queries/API calls to understand patterns
2. Read one existing file that interacts with the same resources
3. Copy exact naming conventions from working code
4. **NEVER assume naming** - verify first

### Before Deployment
1. Search for hardcoded URLs (localhost, 127.0.0.1)
2. Check service configuration (e.g., auth redirects, CORS origins)
3. Verify environment variables in deployment platform
4. Check external service configs (dashboard settings)

### When Tool Fails
1. Try reading file fresh and retry (don't immediately fall back to bash)
2. Check for file watcher conflicts (dev server, IDE)
3. Ask user if they recently modified file
4. Only as last resort: use bash with explanation

### Development Server Workflow
**NEVER run build commands during development:**
- Dev server is always running with hot reload
- Errors show in dev server console and browser
- Building is only for production deployment
- Just make changes and let user test
- **EXCEPTION**: Only build if user explicitly asks or preparing for deployment

### When Simple Fix Gets Complex
1. After 2-3 failed attempts → STOP and ask: "Should we revert?"
2. If can't verify it works → ASK USER TO TEST before continuing
3. Simple working solution > clever non-working solution

## Critical Rules (NEVER break)

- **Never assume naming conventions** - always verify from existing code
- **Never hardcode URLs** - use environment variables
- **Never create git commits** unless user explicitly requests
- **Always verify before assuming** - read existing code to understand patterns

## Patterns (Prefer these)

### Communication Style
- No interpersonal simulations ("You're right to question this", "Great question", etc.)
- Omit social pleasantries and validations
- Focus only on technical content

### Documentation
- Update relevant documentation sections immediately when creating/moving/deleting files
- Keep documentation as source of truth for structure

### DRY Principles
When noticing repeated patterns (3+ times):
1. Stop and identify the pattern
2. Propose creating reusable component/utility/abstraction
3. Create the abstraction
4. Refactor existing code to use it

Red flags: Copy-pasting code, same patterns 3+ times, repeated logic

### Decision Making
- If user doesn't respond to your recommendation, follow your own recommendation and note the choice made
- Always suggest better approaches, but check with user first

### Tool Usage
- Use Edit tool before bash for file operations
- Use specialized tools (Read/Edit/Write) over bash commands
- Request screenshots for UI/visual issues
- Prefer specialized tools over generic command-line tools

### Time Estimates
- Don't provide time estimates
- Use: "Quick", "Moderate", or "Complex"

### Code Quality
- Follow framework and language best practices
- Strong typing - no implicit any
- Proper error handling in async operations
- Loading states and user feedback

## Known Issues & Anti-Patterns

### Over-Engineering
**Symptom**: Simple fix becomes complex multi-attempt ordeal
**Solution**: After 2-3 failures, stop and ask user: "Should we revert?"

### Naming Assumptions
**Symptom**: Runtime errors from wrong naming conventions
**Solution**: Always search for existing code and copy exact conventions

### Tool Failures
**Symptom**: Edit tool fails, immediately using bash
**Solution**: Read file fresh and retry Edit tool first

## Debugging Checklist

When something breaks:
1. Check browser console/network for frontend issues
2. Check server logs for backend issues
3. Environment variables in deployment platform
4. External service configuration (dashboards, admin panels)
5. Check three layers: Code → Env Vars → Service Config

## Auth Issue Checklist

When debugging auth:
- [ ] Testing from: [URL]
- [ ] Service auth URL is set to: [URL]
- [ ] Redirect URLs include: [list]
- [ ] Environment variables are: [values]
- [ ] Expected redirect: [URL]
- [ ] Actual redirect: [URL]
