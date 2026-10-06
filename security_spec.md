# Security Specification for NOC Shift Schedule & Delegation Log

## Data Invariants
1. `roster_staff`: Each staff member must have a valid string ID (max 128 chars), a name (max 150 chars), active boolean, and numeric display order.
2. `roster_schedules`: Each schedule assignment must link a staffId and a shiftId on a valid date string (YYYY-MM-DD format, max 20 chars).
3. `roster_leaves`: Must have valid staffId, startDate, endDate, and leave type.
4. `roster_holidays`: Must have a date, holiday name, type, and region string.
5. `roster_delegations`: Delegation log entries must have title, content, authorName, valid priority enum (normal/important/urgent), and status enum (pending/in_progress/done).
6. `roster_settings`: Settings must contain timezone and region strings and bounded numerical values.

## Hardened Schema Verification
- Strict ID format checks prevent document path injection.
- String lengths are bounded to prevent Denial of Wallet resource attacks.
- Types and required fields are validated on create and update.
