fab-rental-management is a Multi-Tenant Property, Tenancy & Workforce Management System

1. Project Overview

This project is a web-based Software-as-a-Service (SaaS) platform designed to help rental businesses manage accommodation properties, tenants, staff, billing, and communication in a single system.

The platform supports multiple independent rental businesses (tenants) such as hostels, apartments, student residences, or farms with workers. Each business operates within its own isolated workspace while sharing the same platform infrastructure.

The system manages the entire lifecycle of tenancy, from room discovery and rental requests to move-in, billing cycles, room transfers, payments, complaints, and move-out.

The system is designed for real-world operations, prioritizing security, automation, historical record keeping, and scalability.

---

2. Main Goals of the System

The system is built to solve the following problems for rental businesses:

* Managing rooms and vacancies
* Handling tenant applications and approvals
* Managing tenancy lifecycle (move-in to move-out)
* Automating rent billing cycles
* Recording payments (including mobile payments such as M-Pesa)
* Managing staff and worker payments
* Enabling communication between residents and management
* Generating invoices and financial records
* Providing analytics and reports
* Allowing branding customization per rental business

---

3. Multi-Tenant Architecture

The platform follows a multi-tenant architecture.

This means:

* Many rental businesses use the same system
* Each business is called a tenant
* Each tenant’s data is completely isolated from others
* Managers from one hostel cannot see data from another hostel

The database enforces this isolation using Row Level Security (RLS).

---

4. User Roles in the System

4.1 Super Admin (Platform Owner)

The Super Admin controls the entire platform.

Responsibilities:

* Approves or suspends rental businesses
* Monitors system activity
* Manages global system settings
* Oversees platform performance and security

The Super Admin exists outside all tenants.

---

4.2 Tenant (Rental Business)

A tenant represents a rental organization such as:

* Hostel
* Apartment complex
* Student residence
* Farm with worker housing

Each tenant has its own:

* Rooms
* Managers
* Residents
* Workers
* Billing records
* Complaints
* Branding settings

---

4.3 Owner (Tenant Owner)

An owner represents the business owner of a rental property.

Capabilities:

* View occupancy reports
* View financial summaries
* Review billing and payments
* View worker costs

Owners typically do not perform daily operations.

---

4.4 Manager / Caretaker

Managers run the day-to-day operations of a tenant.

Responsibilities include:

* Managing rooms and vacancies
* Approving tenant move-ins
* Handling rental requests
* Assigning rooms
* Managing billing cycles
* Recording payments
* Managing worker salaries
* Handling complaints from residents

Managers are the primary operational users.

---

4.5 Client (Resident / Tenant)

A client is a resident living in the property.

Clients can:

* View their tenancy information
* See billing cycles and invoices
* Check payment history
* Submit complaints
* Communicate with management

Each user can have only one active tenancy at a time.

After moving out, the user becomes a visitor again but retains access to historical records.

---

4.6 Staff / Workers

Tenants may also manage workers such as:

* Shamba boys
* Security staff
* Maintenance workers
* Cleaners

Managers can:

* Register workers
* Track salaries
* Record payments
* Manage attendance (optional)

Workers can view their own payment history.

---

4.7 Visitor

A visitor is either:

* A user not logged in
* A user with no active tenancy

Visitors can:

* Browse available hostels
* View rooms and prices
* Submit rental requests

---

5. Tenancy Lifecycle

The system tracks the complete lifecycle of a tenancy.

Visitor
↓
Rental Request
↓
Offer (optional reservation)
↓
Move-In Approval
↓
Active Tenancy
↓
Billing Cycles (repeated)
↓
Room Transfers (optional)
↓
Move-Out
↓
Completed Tenancy
↓
Visitor with historical records

Tenancies are never deleted for audit and financial tracking.

---

6. Rooms and Accommodation Management

Managers can create and manage accommodation units such as:

* Buildings
* Floors
* Rooms
* Beds or occupancy slots

The system tracks:

* Availability
* Occupancy
* Pricing
* Room history

Residents may request room transfers within the same tenant.

---

7. Rental Requests

Visitors can apply for accommodation.

Managers can:

* Accept requests
* Reject requests
* Make reservation offers

A request does not create a tenancy.

Only move-in approval creates a tenancy record.

---

8. Billing and Payments

The platform automates rent management.

Supported billing types:

* Monthly billing
* Semester billing

When a tenancy becomes active:

* Billing cycles are automatically generated.

Payments may come from:

* M-Pesa mobile payments
* Manual entries by managers

Billing records include:

* Invoice amount
* Payment status
* Payment history

Billing records remain available even after tenancy ends.

---

9. Automated Processes

The system includes several automated processes:

* Automatic billing cycle generation
* Payment reconciliation when M-Pesa payments arrive
* Payment reminders via SMS or email
* Invoice generation and delivery
* Dashboard statistics generation

Automation is handled by the Python backend and database triggers.

---

10. Messaging and Complaints

Residents can communicate with management through the system.

Features include:

* Complaint submission
* Status tracking
* Manager responses

Complaint statuses include:

* Open
* In Progress
* Resolved

Messages remain permanently stored for records.

---

11. Branding and Customization

Each tenant can customize its appearance.

Customization options include:

* Logo
* Primary and secondary colors
* Font styles
* Tenant name

Branding is applied dynamically when users access the tenant dashboard.

---

12. Notifications

The system supports notifications through:

* Email
* SMS
* In-system dashboard notifications

Notifications are used for:

* Payment reminders
* Invoice delivery
* Complaint updates
* System announcements

---

13. Technology Stack

Frontend
React + Vite Progressive Web App (PWA)

Backend
Python with FastAPI

Database & Authentication
Supabase (PostgreSQL)

Real-time features
Supabase Realtime

File storage
Supabase Storage

Payments
M-Pesa integration

SMS
SMS gateway service integration

---

14. Security

The system uses multiple layers of security:

* Supabase authentication
* Row Level Security (RLS) for tenant data isolation
* Role-based permissions
* Immutable financial records
* Backend validation for sensitive operations

No tenant can access another tenant’s data.

---

15. Expected Outcome

The completed platform will function as a complete tenancy lifecycle management system that enables rental businesses to manage operations efficiently while maintaining data security, automation, and scalability.

The system is designed to grow into a large multi-tenant rental platform serving many independent property businesses simultaneously.
