# Cash Management Module

<cite>
**Referenced Files in This Document**   
- [CASH_MANAGEMENT_README.md](file://CASH_MANAGEMENT_README.md)
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts)
- [cash-management.ts](file://src/types/cash-management.ts)
- [DashboardOverview.tsx](file://src/pages/CashManagement/components/DashboardOverview.tsx)
- [OpenCashModal.tsx](file://src/pages/CashManagement/components/OpenCashModal.tsx)
- [CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx)
- [CashWithdrawalModal.tsx](file://src/pages/CashManagement/components/CashWithdrawalModal.tsx)
- [TreasuryTransferModal.tsx](file://src/pages/CashManagement/components/TreasuryTransferModal.tsx)
- [PaymentModal.tsx](file://src/pages/CashManagement/components/PaymentModal.tsx)
- [CashReport.tsx](file://src/pages/CashManagement/components/CashReport.tsx)
- [TransactionHistory.tsx](file://src/pages/CashManagement/components/TransactionHistory.tsx)
- [useBarAttendance.ts](file://src/hooks/useBarAttendance.ts)
- [AppContext.tsx](file://src/contexts/AppContext.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Implementation Status](#core-implementation-status)
3. [Architecture Overview](#architecture-overview)
4. [Cash Session Management](#cash-session-management)
5. [Transaction Processing](#transaction-processing)
6. [Specialized Modals and User Interface](#specialized-modals-and-user-interface)
7. [Financial Data Access and Integration](#financial-data-access-and-integration)
8. [Cash Reports and Transaction History](#cash-reports-and-transaction-history)
9. [Integration with Bar Module](#integration-with-bar-module)
10. [Data Integrity and Validation](#data-integrity-and-validation)
11. [Compliance and Audit Considerations](#compliance-and-audit-considerations)
12. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Introduction

The Cash Management Module is a comprehensive financial system designed to handle all aspects of cash handling operations within the AABB System. This module provides a complete solution for managing daily cash sessions, processing transactions, generating reports, and ensuring financial accountability. The system is built with robust data integrity measures, transaction atomicity, and compliance considerations to maintain accurate financial records.

The module integrates seamlessly with other components of the system, particularly the Bar module, enabling smooth payment processing and order settlement. It features specialized modals for different transaction types, providing an intuitive user interface for cashiers and supervisors. The implementation follows best practices for financial software, including validation checks, audit logging, and reconciliation processes to prevent common issues like duplicate cash closures.

This documentation provides a detailed explanation of the module's implementation, architecture, and functionality, making it accessible to both technical and non-technical users while maintaining depth on critical financial concepts.

**Section sources**
- [CASH_MANAGEMENT_README.md](file://CASH_MANAGEMENT_README.md)

## Core Implementation Status

The Cash Management Module has been fully implemented with all core components operational. The system includes a well-defined architecture with TypeScript interfaces, database migrations, and comprehensive business logic. The implementation status shows that all essential features are completed, including session management, transaction processing, reporting, and integration with the main application.

The module operates through a combination of frontend components and backend services, with data persistence handled by Supabase. During development, the system runs in a fallback mode that allows testing of interfaces without requiring a fully configured database. Once the database migrations are applied, the system transitions to full operation with real data processing.

Key implementation components include:
- Database schema with four primary tables: cash_sessions, cash_transactions, payment_reconciliation, and cash_audit_log
- Complete TypeScript type definitions for all financial entities
- A central hook (useCashManagement) containing all business logic
- Multiple specialized modal components for different transaction types
- Dashboard and reporting components for financial oversight

The system is designed to be extensible, with clear separation between UI components and business logic, allowing for future enhancements such as advanced reporting, additional payment methods, or integration with external accounting systems.

```mermaid
graph TD
A[Cash Management Module] --> B[Database Schema]
A --> C[TypeScript Types]
A --> D[Business Logic Hook]
A --> E[UI Components]
A --> F[Reporting System]
B --> G[cash_sessions]
B --> H[cash_transactions]
B --> I[payment_reconciliation]
B --> J[cash_audit_log]
D --> K[Session Management]
D --> L[Transaction Processing]
D --> M[Reconciliation]
D --> N[Reporting]
E --> O[OpenCashModal]
E --> P[CloseCashModal]
E --> Q[PaymentModal]
E --> R[CashWithdrawalModal]
E --> S[TreasuryTransferModal]
F --> T[CashReport]
F --> U[TransactionHistory]
**Diagram sources **
- [CASH_MANAGEMENT_README.md](file://CASH_MANAGEMENT_README.md)
```

**Section sources**
- [CASH_MANAGEMENT_README.md](file://CASH_MANAGEMENT_README.md)

## Architecture Overview

The Cash Management Module follows a clean architectural pattern with clear separation of concerns between data access, business logic, and presentation layers. At the core of the system is the useCashManagement hook, which serves as the single source of truth for all cash-related operations. This hook manages state, handles API calls to Supabase, and exposes functions for various financial operations.

The data model consists of four interconnected tables that form the foundation of the cash management system. The cash_sessions table tracks individual cashier sessions, storing information about opening and closing times, amounts, and statuses. The cash_transactions table records all financial movements, including sales, refunds, adjustments, withdrawals, and transfers. The payment_reconciliation table stores detailed information about payment method reconciliation during cash closure, while the cash_audit_log table maintains a complete history of all significant actions for compliance and troubleshooting.

On the frontend, the module uses React components organized in a logical hierarchy. The DashboardOverview component serves as the main entry point, displaying key metrics and providing access to all functionality. Specialized modal components handle specific operations, ensuring focused user experiences for complex financial tasks. The system leverages React Context for state management, with AppContext providing access to shared application data.

```mermaid
classDiagram
class CashSession {
+string id
+string employee_id
+string session_date
+string opened_at
+string? closed_at
+number opening_amount
+number? closing_amount
+number expected_amount
+number? cash_discrepancy
+CashSessionStatus status
+string? supervisor_approval_id
+string? opening_notes
+string? closing_notes
+string created_at
+string updated_at
}
class CashTransaction {
+string id
+string cash_session_id
+string? comanda_id
+TransactionType transaction_type
+PaymentMethod payment_method
+number amount
+string processed_at
+string processed_by
+string? reference_number
+string? receipt_number
+string? customer_name
+string? notes
+string created_at
}
class PaymentReconciliation {
+string id
+string cash_session_id
+string payment_method
+number expected_amount
+number actual_amount
+number discrepancy
+number transaction_count
+string reconciled_at
+string reconciled_by
+string? notes
+string created_at
}
class CashAuditLog {
+string id
+string? cash_session_id
+string action_type
+string performed_by
+any? old_values
+any? new_values
+string? reason
+string? ip_address
+string? user_agent
+string performed_at
}
CashSession "1" -- "*" CashTransaction : contains
CashSession "1" -- "*" PaymentReconciliation : has
CashSession "1" -- "*" CashAuditLog : generates
CashTransaction --> CashSession : belongs to
PaymentReconciliation --> CashSession : references
CashAuditLog --> CashSession : related to
**Diagram sources **
- [src/types/cash-management.ts](file : //src/types/cash-management.ts#L10-L100)
```

**Section sources**
- [CASH_MANAGEMENT_README.md](file://CASH_MANAGEMENT_README.md)
- [src/types/cash-management.ts](file://src/types/cash-management.ts#L10-L100)

## Cash Session Management

The cash session management system provides a complete workflow for opening and closing cash registers, ensuring proper financial controls and accountability. Each session represents a cashier's shift and tracks all financial activities during that period. The system prevents multiple concurrent sessions per employee and maintains a clear audit trail of all session operations.

### Opening Cash Sessions

Opening a cash session initializes a new financial period for a cashier. The OpenCashModal component guides users through this process, requiring them to specify the opening cash amount and optional notes. The system enhances usability by automatically suggesting the previous day's closing balance as the default opening amount, reducing manual entry errors.

When a session is opened, the system creates a record in the cash_sessions table with the employee ID, opening amount, timestamp, and status set to "open." The session date is automatically set to the current date, creating a natural grouping of daily financial activities. Supervisors can approve high-value openings through the supervisor_approval_id field, implementing an important internal control.

```mermaid
sequenceDiagram
participant User
participant OpenCashModal
participant useCashManagement
participant Supabase
User->>OpenCashModal : Click "Open Cash"
OpenCashModal->>useCashManagement : getLastClosedSessionBalance()
useCashManagement->>Supabase : Query last closed session
Supabase-->>useCashManagement : Return previous balance
useCashManagement-->>OpenCashModal : Set suggested amount
User->>OpenCashModal : Enter opening amount
OpenCashModal->>useCashManagement : openCashSession(data)
useCashManagement->>Supabase : Insert cash_session record
Supabase-->>useCashManagement : Success confirmation
useCashManagement-->>OpenCashModal : Close modal
OpenCashModal-->>User : Session opened successfully
**Diagram sources **
- [src/pages/CashManagement/components/OpenCashModal.tsx](file : //src/pages/CashManagement/components/OpenCashModal.tsx#L11-L179)
- [src/hooks/useCashManagement.ts](file : //src/hooks/useCashManagement.ts#L393-L427)
```

### Closing Cash with Reconciliation

Closing a cash session is a critical financial control process that requires careful reconciliation of all payments. The CloseCashModal component facilitates this complex operation through a structured interface that guides cashiers through the reconciliation process. The modal displays the expected amount based on recorded transactions and prompts the user to enter the actual counted amount for each payment method.

The reconciliation process captures discrepancies between expected and actual amounts, which are stored in the cash_discrepancy field of the cash_sessions table. The system also records detailed reconciliation data in the payment_reconciliation table, preserving a complete audit trail. Before closing, the modal performs a final validation check for any pending orders that might affect the cash balance.

```mermaid
flowchart TD
A[Start Cash Closure] --> B{Any Pending Orders?}
B --> |Yes| C[Show Warning Dialog]
C --> D[Confirm Closure Anyway?]
D --> |No| E[Return to Dashboard]
D --> |Yes| F[Proceed with Closure]
B --> |No| F
F --> G[Enter Actual Amounts]
G --> H[Calculate Discrepancies]
H --> I[Save Reconciliation Data]
I --> J[Update Session Status]
J --> K[Generate Report]
K --> L[Session Closed Successfully]
**Diagram sources **
- [src/pages/CashManagement/components/CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx#L13-L372)
- [src/hooks/useCashManagement.ts](file://src/hooks/useCashManagement.ts#L429-L473)
```

**Section sources**
- [src/pages/CashManagement/components/OpenCashModal.tsx](file://src/pages/CashManagement/components/OpenCashModal.tsx#L11-L179)
- [src/pages/CashManagement/components/CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx#L13-L372)
- [src/hooks/useCashManagement.ts](file://src/hooks/useCashManagement.ts#L393-L473)

## Transaction Processing

The transaction processing system handles all financial movements within the cash management module, from sales and refunds to adjustments and transfers. Each transaction is recorded with detailed metadata to ensure traceability and support reconciliation processes. The system maintains data integrity through atomic operations and comprehensive error handling.

### Recording Withdrawals

Cash withdrawals are managed through the CashWithdrawalModal component, which captures essential details about each withdrawal. The system treats withdrawals as negative adjustments to the cash balance, recording them as adjustment-type transactions with negative amounts. This approach maintains consistency in the transaction ledger while clearly indicating the nature of the movement.

The withdrawal process requires authorization from a supervisor, documented in the authorized_by field. The system validates that the requested amount does not exceed the available cash balance, preventing overdrafts. Each withdrawal is accompanied by a purpose code (change, expense, transfer, or other) and a descriptive reason, providing context for the financial movement.

```mermaid
sequenceDiagram
participant User
participant CashWithdrawalModal
participant useCashManagement
participant Supabase
User->>CashWithdrawalModal : Request withdrawal
CashWithdrawalModal->>User : Enter amount and details
User->>CashWithdrawalModal : Submit request
CashWithdrawalModal->>useCashManagement : validateForm()
useCashManagement->>CashWithdrawalModal : Return validation result
CashWithdrawalModal->>useCashManagement : processCashWithdrawal(data)
useCashManagement->>Supabase : Insert adjustment transaction
Supabase-->>useCashManagement : Transaction ID
useCashManagement->>Supabase : Update session expected_amount
Supabase-->>useCashManagement : Confirmation
useCashManagement-->>CashWithdrawalModal : Return success
CashWithdrawalModal-->>User : Show receipt
**Diagram sources **
- [src/pages/CashManagement/components/CashWithdrawalModal.tsx](file : //src/pages/CashManagement/components/CashWithdrawalModal.tsx#L13-L311)
- [src/hooks/useCashManagement.ts](file : //src/hooks/useCashManagement.ts#L622-L660)
```

### Transferring Funds to Treasury

Transfers to the treasury follow a similar pattern to withdrawals but are specifically designated for moving funds to a central repository. The TreasuryTransferModal component captures transfer details, including the amount, date, authorized personnel, and optional receipt number. These transfers are critical for managing cash flow and ensuring security by reducing on-site cash holdings.

The system treats treasury transfers as negative adjustments, consistent with the withdrawal mechanism. This unified approach simplifies the transaction model while allowing differentiation through transaction notes that include the "[TRANSFERÊNCIA TESOURARIA]" prefix. The transfer process generates a receipt for documentation purposes, supporting audit requirements.

```mermaid
flowchart TD
A[Initiate Transfer] --> B[Enter Transfer Details]
B --> C[Validate Amount ≤ Balance]
C --> D[Record Authorized Personnel]
D --> E[Create Adjustment Transaction]
E --> F[Update Session Balance]
F --> G[Generate Receipt]
G --> H[Funds Transferred]
**Diagram sources **
- [src/pages/CashManagement/components/TreasuryTransferModal.tsx](file://src/pages/CashManagement/components/TreasuryTransferModal.tsx#L15-L186)
- [src/hooks/useCashManagement.ts](file://src/hooks/useCashManagement.ts#L662-L701)
```

**Section sources**
- [src/pages/CashManagement/components/CashWithdrawalModal.tsx](file://src/pages/CashManagement/components/CashWithdrawalModal.tsx#L13-L311)
- [src/pages/CashManagement/components/TreasuryTransferModal.tsx](file://src