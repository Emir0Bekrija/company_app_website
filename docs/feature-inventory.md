# Feature inventory

What the site may claim, taken from an audit of the app's routes, features and controllers. Check here before adding copy.

| Module | Who uses it | What it does | Status | In the demo |
|---|---|---|---|---|
| Timesheets | Workers, HR | Month calendar, day panel, 7 block types, autofill, schedule checks, submit, per-day review | Complete | Yes, flagship |
| Timesheet export | HR | Monthly .xlsx, one sheet per person, own template with cell mapping | Complete | Yes, simulated download |
| Overtime | Workers, HR | Calculated by the server, per-day approval queue | Complete | Yes |
| TOIL | Workers, HR | Paid or time off per day, derived balance, ledger, requests | Complete | Yes |
| Vacation and leave | Workers, HR | Balances, leave blocks, approval, reassignment queue | Complete | Yes |
| Absences and documents | Workers, HR | Own type catalogue, range requests; sick leave booked at once; encrypted documents and reminders on reported absences only | Complete | Yes, simulated upload |
| Tasks | Everyone | Assign to people or teams, comments, links, forwarding, live updates | Complete, list only | Yes |
| Invoicing | Finance | Lifecycle, review routing, partial payments, overdue sweep, PDF and Word | Complete | Yes |
| Clients and expenses | Finance | Client records, expenses with encrypted attachments. Expenses are plain records with no statuses or approval, and categories can't be created in the app | Complete | Yes, simulated upload |
| Invoice templates | Finance | Built-in designer, own layout, own Word file | Complete | Yes, built-in is live; layout and Word are shown, not editable |
| People | HR, admins | Invites, departments and history, teams, per-person drill-down | Complete | Yes |
| Work schedules | HR | Company defaults, date-versioned per-user overrides | Complete | Yes, defaults read-only |
| Calendar | Everyone | Combined month grid, private ICS feed | Month view only | Yes |
| Notifications | Everyone | 44 event types, live bell and toasts | Complete, in-app only | Yes |
| Roles | Admins | Role matrix for 5 modules, custom roles; system roles can't be changed | Partial | Yes |
| Active month | Admins | Which months accept timesheet entries; the current month always reopens | Complete, see launch checklist | Yes |
| Security | Everyone | TOTP 2FA, company requirement, sign out everywhere (no session list) | Complete | Yes, sample QR and codes |
| Themes and languages | Everyone | 6 presets plus Custom; English and Bosnian | Complete | Yes |

## Never claim

Inventory, kanban, calendar week view, emailing invoices to clients, online payments, push or email notifications, mobile app or PWA, SSO, public API, webhooks, Slack or Google integrations, CSV export, task file uploads, analytics or BI.

The calendar feed is a one-way private link. Saying that Outlook, Google Calendar or Apple Calendar can subscribe to it is accurate; calling it an integration isn't.

## Security wording

- **Safe:** 15-minute access tokens with rotating refresh tokens, TOTP 2FA with a company-wide requirement, AES-256-GCM encryption of documents and attachments, permission matrix, account lockout, document access logging.
- **Avoid:** "GDPR compliant", "full audit trail", "all data encrypted", "end-to-end", "EU data residency", any certification, "legally compliant timesheet".
