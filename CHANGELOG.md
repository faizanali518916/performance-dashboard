# Changelog

All notable changes to the Performance Tracking Dashboard are documented here.

## Version 2

### Major changes

#### Department-based management

- Replaced direct employee-to-manager relationships with department-based ownership.
- Added departments with unique names and a many-to-many manager assignment model.
- Assigned each user to a department instead of an individual manager.
- Updated permissions so every manager assigned to a department can manage its users; administrators retain access to all users.
- Added department management controls for administrators:
  - Create and rename departments.
  - Assign or remove managers from departments.
  - Assign users to departments when creating or updating accounts.
- Limited managers to creating employees only within departments they manage.

#### Standard operating procedures

- Added department-owned SOPs with a name and detailed description.
- Established a one-to-many relationship between departments and SOPs.
- Added a dedicated SOP library tab.
- Allowed managers to create and edit SOPs only for their assigned departments.
- Allowed administrators to manage SOPs across all departments.
- Provided employees with read-only access to SOPs for their department.

#### Role progression

- Added an optional subsequent-role link to each role.
- Added administrator controls for configuring role progression.
- Added next-role KPI targets to the bottom of the Overview tab for users whose role has a subsequent role.

### Improvements

- Added Goals with descriptions, deadlines, statuses, and manager remarks.
- Added a Notes journal category alongside Achievements and Challenges.
- Consolidated Journal entries into a filterable chronological list and aligned its visual language with Goals.
- Kept impact values numeric in storage while presenting them as High, Medium, or Low in the interface.
- Refined the monthly performance workflow by separating KPI updates from journal entry creation.
- Restricted journal and goal editing to authorized managers; employees retain read-only access.
- Added dashboard invitation emails when managers or administrators create user accounts.
- Added secure password-reset functionality.
- Added management directories for roles, KPIs, departments, and employees with complete relationship details and permission-aware inline editing.
- Standardized management card sizing and moved department assignment details out of the action cards and into the department directory.

## Version 1 — Initial release

- Introduced the Performance Tracking Dashboard with role-based access, KPI tracking, performance history, and employee management.
