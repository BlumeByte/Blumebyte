# Automation & Workflows System Guide

## Overview
The Blumebyte HR platform now includes a comprehensive automation and workflows system that allows Super Admins and Admins to automate repetitive HR tasks, create intelligent workflows, define business rules, and manage notification templates.

## Features

### 1. **Automated Workflows** 🔄
Create event-driven workflows that automatically execute actions when specific triggers occur.

**Key Capabilities:**
- **Trigger-based Automation**: Respond to events like leave requests, late arrivals, expense submissions
- **Conditional Logic**: Define conditions that must be met before actions execute
- **Multi-action Workflows**: Chain multiple actions together
- **Enable/Disable Control**: Turn workflows on or off without deleting them

**Available Triggers:**
- Leave Request Submitted
- Employee Late Arrival
- Employee Absent
- Expense Report Submitted
- Timesheet Submitted
- Profile Change Request
- Task Overdue
- Performance Review Due
- Document Uploaded
- New Employee Hired
- Work Anniversary
- Probation Period Ending
- Contract Expiring Soon
- Training Due

**Available Actions:**
- Send Notification (In-app)
- Send Email
- Auto Approve
- Require Approval From (Manager/Admin)
- Assign Task
- Update Status
- Escalate to Manager
- Generate Report

**Example Workflow:**
```
Name: Auto-approve short leave requests
Trigger: Leave Request Submitted
Conditions:
  - days <= 3
  - type = "Casual Leave"
Actions:
  - Auto Approve
  - Send Notification: "Your leave request has been auto-approved"
```

### 2. **Scheduled Tasks** ⏰
Set up recurring tasks that run automatically at specified intervals.

**Key Capabilities:**
- **Flexible Scheduling**: Daily, Weekly, Monthly, Quarterly, or Yearly
- **Time-based Execution**: Specify exact time for task execution
- **Target Users**: Optionally target specific employees
- **Execution History**: Track when tasks last ran and when they'll run next

**Schedule Frequencies:**
- Daily (e.g., send daily attendance summary)
- Weekly (e.g., weekly performance review reminders)
- Monthly (e.g., monthly payroll reports)
- Quarterly (e.g., quarterly goal reviews)
- Yearly (e.g., annual contract renewal reminders)

**Example Scheduled Task:**
```
Name: Weekly Attendance Report
Frequency: Weekly
Time: 09:00 AM
Action: Generate Report (Attendance)
Target Users: All Managers
```

### 3. **Business Rules** 📋
Define conditional rules that automatically enforce business logic across your HR processes.

**Key Capabilities:**
- **Category-based Organization**: Group rules by HR function
- **Operator Support**: Equals, Not Equals, Greater Than, Less Than, etc.
- **Automatic Enforcement**: Rules apply automatically when conditions are met
- **Easy Testing**: Visual rule builder with preview

**Rule Categories:**
- Leave Management
- Attendance
- Expense
- Performance
- Approval
- Compliance

**Example Business Rule:**
```
Name: Escalate high-value expenses
Category: Expense
Condition: amount >= 5000
Action: Require Approval From (CFO)
```

### 4. **Notification Templates** 📧
Create reusable notification templates for consistent communication.

**Key Capabilities:**
- **Multi-channel Support**: In-app, Email, or Both
- **Dynamic Variables**: Use placeholders for personalized messages
- **Trigger Association**: Link templates to specific workflow triggers
- **Rich Formatting**: Support for structured email content

**Available Variables:**
- `{{employeeName}}` - Employee's full name
- `{{managerName}}` - Manager's full name
- `{{startDate}}` - Start date (for leave, etc.)
- `{{endDate}}` - End date
- `{{status}}` - Current status
- `{{reason}}` - Reason/description

**Example Template:**
```
Name: Leave Approved Notification
Channel: Both (In-app + Email)
Subject: Your leave request has been approved
Body: Hello {{employeeName}},

Your leave request from {{startDate}} to {{endDate}} has been approved by {{managerName}}.

Enjoy your time off!

Best regards,
HR Team
```

## Access Control

### Super Admin
- ✅ Create, edit, delete all automation items
- ✅ View all workflows, tasks, rules, and templates
- ✅ Enable/disable automation for entire company
- ✅ Execute workflows manually for testing

### Admin
- ✅ Create, edit, delete automation items for their company
- ✅ View automation items for their company only
- ✅ Enable/disable workflows and tasks
- ✅ Test workflows manually

### Manager
- ❌ View-only access (if needed)
- ❌ Cannot create or modify automation

### Employee
- ❌ No access to automation system
- ✅ Receives automated notifications and emails

## How to Use

### Creating a Workflow

1. **Navigate to Automation**
   - Super Admin: Dashboard → Automation & Workflows
   - Admin: Dashboard → Automation tab

2. **Click "Create Workflow"**

3. **Fill in Basic Details**
   - Name: Descriptive name (e.g., "Auto-approve 1-day leaves")
   - Description: What this workflow does
   - Trigger: Select the event that starts the workflow

4. **Add Conditions (Optional)**
   - Click "Add Condition"
   - Define field, operator, and value
   - Multiple conditions use AND logic

5. **Add Actions**
   - Click "Add Action"
   - Select action type
   - Configure action-specific settings
   - Add multiple actions to chain them

6. **Enable and Save**
   - Toggle "Enable this workflow"
   - Click "Create Workflow"

### Creating a Scheduled Task

1. **Click "Create Task"** in the Scheduled Tasks tab

2. **Configure Task Details**
   - Name: Clear, descriptive name
   - Description: What this task does
   - Frequency: How often to run
   - Time: When to run (24-hour format)

3. **Select Action**
   - Choose what happens when task runs
   - Configure action settings

4. **Target Users (Optional)**
   - Select specific employees if needed
   - Leave empty for all users

5. **Enable and Save**

### Creating a Business Rule

1. **Click "Create Rule"** in the Business Rules tab

2. **Define Rule Logic**
   - Name: Rule name
   - Category: HR function this applies to
   - Condition: Field, operator, value
   - Action: What happens when condition is met

3. **Enable and Save**

### Creating a Notification Template

1. **Click "Create Template"** in the Templates tab

2. **Configure Template**
   - Name: Template identifier
   - Channel: In-app, Email, or Both
   - Trigger: Associate with workflow trigger (optional)
   - Subject: Email subject (if email channel selected)
   - Body: Message content with variables

3. **Save Template**

## Best Practices

### Workflow Design
✅ **Start Simple**: Begin with straightforward workflows and add complexity gradually
✅ **Test Thoroughly**: Use the manual execution feature to test workflows before enabling
✅ **Name Clearly**: Use descriptive names that explain what the workflow does
✅ **Document Purpose**: Always add a clear description
✅ **Review Regularly**: Periodically review and update workflows as processes change

### Scheduled Tasks
✅ **Avoid Overlaps**: Don't schedule too many tasks at the same time
✅ **Consider Time Zones**: Schedule based on your primary business hours
✅ **Monitor Execution**: Check last run and next run times regularly
✅ **Start Conservative**: Begin with less frequent schedules and adjust as needed

### Business Rules
✅ **Keep Rules Simple**: One clear condition per rule
✅ **Categorize Properly**: Use appropriate categories for easy management
✅ **Test Edge Cases**: Consider boundary conditions (e.g., exactly equal values)
✅ **Document Exceptions**: Note any special cases in the description

### Notification Templates
✅ **Use Variables**: Make templates reusable with dynamic content
✅ **Keep Messages Clear**: Short, actionable messages work best
✅ **Test Formatting**: Preview how emails will look before sending
✅ **Maintain Consistency**: Use similar tone and structure across templates

## Common Use Cases

### 1. Leave Request Auto-Approval
**Scenario**: Automatically approve leave requests under 3 days for employees with good attendance

```
Trigger: Leave Request Submitted
Conditions:
  - days <= 3
  - attendanceScore >= 85
Actions:
  - Auto Approve
  - Send Notification (using "Leave Approved" template)
```

### 2. Late Arrival Escalation
**Scenario**: Notify manager when employee is late 3+ times in a month

```
Trigger: Employee Late Arrival
Conditions:
  - lateCount >= 3
  - period = "current month"
Actions:
  - Send Notification to Manager
  - Create Disciplinary Task
```

### 3. Contract Renewal Reminder
**Scenario**: Send reminder 30 days before contract expiry

```
Scheduled Task:
Frequency: Daily
Time: 08:00
Action: Check contracts expiring in 30 days
  → Send Email notification to HR and employee
```

### 4. Probation Review Automation
**Scenario**: Automatically create performance review task when probation ends

```
Trigger: Probation Period Ending
Conditions:
  - daysRemaining <= 7
Actions:
  - Assign Task (Performance Review) to Manager
  - Send Notification to Employee
  - Send Notification to HR
```

### 5. High-Value Expense Approval
**Scenario**: Route expenses over $1000 to CFO for approval

```
Business Rule:
Category: Expense
Condition: amount > 1000
Action: Require Approval From (CFO)
```

## Statistics Dashboard

The automation module provides real-time statistics:

- **Active Workflows**: Currently enabled workflows / Total workflows
- **Scheduled Tasks**: Active tasks / Total tasks
- **Business Rules**: Active rules / Total rules
- **Notification Templates**: Total templates created

## Troubleshooting

### Workflow Not Triggering
**Check:**
1. Is the workflow enabled?
2. Are all conditions being met?
3. Is the trigger event actually occurring?
4. Check execution logs (if available)

### Scheduled Task Not Running
**Check:**
1. Is the task enabled?
2. Verify the next run time
3. Check if time zone is correct
4. Review task configuration

### Notifications Not Sending
**Check:**
1. Is the notification template configured correctly?
2. Are variables populated with actual data?
3. Check recipient user settings
4. Verify channel selection (in-app vs email)

### Business Rule Not Applying
**Check:**
1. Is the rule enabled?
2. Verify the condition logic matches your data
3. Check if category is correct
4. Test with known data that should trigger the rule

## Performance Tips

1. **Limit Workflow Complexity**: Too many conditions and actions can slow execution
2. **Batch Notifications**: Use templates and scheduled tasks instead of individual notifications
3. **Review Inactive Items**: Disable or delete workflows/tasks that are no longer needed
4. **Monitor Execution**: Regularly check that automated processes are running as expected

## Future Enhancements

Planned improvements include:
- Workflow execution logs and analytics
- Visual workflow builder
- Webhook triggers for external integrations
- Advanced scheduling (specific days of week/month)
- Approval chain workflows
- Variable conditions (OR logic)
- Workflow templates library
- Integration with AI Assistant for smart recommendations

## Security & Compliance

- All automation actions are logged for audit purposes
- Company-based data isolation ensures multi-tenant security
- Only Super Admin and Admin roles can modify automation
- Workflow execution respects existing role-based permissions
- Sensitive data in notifications uses secure channels

## Support

For questions or issues with the automation system:
1. Check this guide for common scenarios
2. Review the troubleshooting section
3. Test workflows manually using the execute button
4. Contact your system administrator for advanced configuration

---

**Last Updated**: March 15, 2026  
**Version**: 1.0.0  
**Module**: Automation & Workflows
