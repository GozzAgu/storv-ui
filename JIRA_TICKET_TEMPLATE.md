# Quick Reference: Jira Ticket Templates

## Epic Template

```
**Epic Name:** Staff Account Management System

**Epic Description:**
Implement a comprehensive staff account creation and management system that allows super admins to create staff members who can log in with their own credentials and access role-appropriate UI.

**Acceptance Criteria:**
- Super admins can create staff members from departments page
- Staff members can log in with email and password
- Staff members see role-appropriate UI (limited access)
- Staff authentication is secure and follows Firebase best practices

**Labels:** feature, authentication, staff-management, role-based-access, firebase
```

---

## Story Template

```
**Story Type:** Feature
**Story Points:** [5-8]
**Priority:** High/Medium
**Component:** Staff Management

**As a** [user role]
**I want** [goal/desire]
**So that** [benefit/value]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Technical Notes:**
- Files affected: [list files]
- Dependencies: [list dependencies]

**Labels:** feature, backend/frontend, staff-management
```

---

## Task Template

```
**Task:** [Specific task name]

**Description:**
[Brief description of what needs to be done]

**Acceptance Criteria:**
- [ ] Specific deliverable 1
- [ ] Specific deliverable 2

**Files to Modify:**
- [file path 1]
- [file path 2]

**Estimated Time:** [hours]

**Dependencies:** [other tasks/stories]

**Labels:** task, backend/frontend
```

---

## Bug Template

```
**Bug Title:** [Short description]

**Priority:** High/Medium/Low
**Component:** [Component name]

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [browser version]
- Device: [device type]
- User Role: [staff/super admin]

**Screenshots/Logs:**
[Attach relevant files]

**Labels:** bug, [component-name]
```

---

## Quick Copy-Paste Ticket Titles

### Epics
- `Staff Account Management System`

### Stories
- `Staff Creation Modal Enhancement`
- `Firebase Auth Account Creation for Staff`
- `Staff Login Flow Implementation`
- `Role-Based UI Filtering`
- `Staff Profile & User Document Management`
- `Security & Error Handling`
- `Testing & Documentation`

### High Priority Tasks
- `Add password field to StaffModal component`
- `Integrate Firebase Auth account creation in createStaff method`
- `Implement staff account check in signin flow`
- `Add role-based navigation filtering`
- `Update Firestore security rules for staff collection`

---

## Jira Field Mappings

### Issue Type
- Epic → Epic
- Feature Story → Story
- Technical Task → Task
- Bug → Bug

### Priority Levels
- **Critical:** Blocks all other work, production broken
- **High:** Must be done in current sprint
- **Medium:** Should be done soon
- **Low:** Nice to have

### Story Points (Fibonacci)
- 1: Very small task (< 1 hour)
- 2: Small task (1-2 hours)
- 3: Medium-small (2-4 hours)
- 5: Medium (4-8 hours)
- 8: Large (1-2 days)
- 13: Very large (> 2 days)

### Labels Convention
- `feature` - New feature
- `bug` - Bug fix
- `security` - Security-related
- `backend` - Backend work
- `frontend` - Frontend work
- `firebase` - Firebase integration
- `authentication` - Auth-related
- `staff-management` - Staff features

---

## Sprint Planning Checklist

When planning a sprint with these stories:

1. **Review Dependencies**
   - [ ] Ensure Firebase is configured
   - [ ] Auth store is functional
   - [ ] User store is functional

2. **Estimate Story Points**
   - [ ] Review each story complexity
   - [ ] Consider team velocity
   - [ ] Account for unknowns

3. **Identify Risks**
   - [ ] Firebase Auth limitations
   - [ ] Security concerns
   - [ ] Integration points

4. **Plan Testing**
   - [ ] Unit tests planned
   - [ ] Integration tests planned
   - [ ] Manual testing time allocated

---

## Jira Workflow States

1. **To Do** → Initial state, ready to start
2. **In Progress** → Actively being worked on
3. **Code Review** → PR created, awaiting review
4. **QA Testing** → Ready for testing
5. **Done** → Completed and verified

---

## Git Branch Naming Convention

Based on Jira ticket numbers:

```
feature/STAFF-123-staff-creation-modal
feature/STAFF-124-firebase-auth-integration
bugfix/STAFF-125-password-validation-fix
```

---

## PR Description Template

```markdown
## Description
[Brief description of changes]

## Related Jira Ticket
Closes STAFF-XXX

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Security fix
- [ ] Documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases handled

## Checklist
- [ ] Code follows project style guide
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

---

## Example Jira Queries

### View all staff-related tickets
```
project = STORV AND labels in (staff-management) ORDER BY priority DESC
```

### View in-progress staff tickets
```
project = STORV AND labels in (staff-management) AND status = "In Progress"
```

### View high-priority staff tickets
```
project = STORV AND labels in (staff-management) AND priority = High
```

### View unestimated stories
```
project = STORV AND type = Story AND "Story Points" IS EMPTY
```

