# Cash Management Module

<cite>
**Referenced Files in This Document**   
- [OpenCashModal.tsx](file://src/pages/CashManagement/components/OpenCashModal.tsx)
- [CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx)
- [cash-manager.ts](file://src/services/cash-manager.ts)
- [DashboardOverview.tsx](file://src/pages/CashManagement/components/DashboardOverview.tsx)
- [TransactionHistory.tsx](file://src/pages/CashManagement/components/TransactionHistory.tsx)
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts)
- [cash-management.ts](file://src/types/cash-management.ts)
- [20250908000001_cash_management_system.sql](file://supabase/migrations/20250908000001_cash_management_system.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
The Cash Management Module provides a comprehensive solution for managing cash sessions, processing transactions, and performing financial reconciliation within the AABB System. This document details the complete lifecycle of cash operations from opening to closing sessions, including intermediate actions such as withdrawals and transfers. The module integrates with various components to ensure accurate financial tracking, audit compliance, and real-time reporting.

## Project Structure

```mermaid
graph TB
subgraph "Cash Management Module"
CM[CashManagement/index.tsx]
CO[components/OpenCashModal.tsx]
CC[components/CloseCashModal.tsx]
PM[components/PaymentModal.tsx]
DO[components/DashboardOverview.tsx]
TH[components/TransactionHistory.tsx]
CW[components/CashWithdrawalModal.tsx]
TT[components/TreasuryTransferModal.tsx]
end
subgraph "Services & Hooks"
SM[services/cash-manager.ts]
HC[hooks/useCashManagement.ts]
HCF[hooks/useCashManagementFallback.ts]
end
subgraph "Types & Database"
TCM[types/cash-management.ts]
MIG[migrations/20250908000001_cash_management_system.sql]
end
CM --> CO
CM --> CC
CM --> PM
CM --> DO
CM --> TH
HC --> SM
HC --> TCM
SM --> MIG
```

**Diagram sources**
- [index.tsx](file://src/pages/CashManagement/index.tsx)
- [OpenCashModal.tsx](file://src/pages/CashManagement/components/OpenCashModal.tsx)
- [CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx)
- [cash-manager.ts](file://src/services/cash-manager.ts)
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts)
- [cash-management.ts](file://src/types/cash-management.ts)
- [20250908000001_cash_management_system.sql](file://supabase/migrations/20250908000001_cash_management_system.sql)

**Section sources**
- [index.tsx](file://src/pages/CashManagement/index.tsx#L1-L22)
- [CASH_MANAGEMENT_README.md](file://CASH_MANAGEMENT_README.md#L0-L188)

## Core Components

The Cash Management Module consists of several key components that handle different aspects of cash operations:

- **OpenCashModal**: Manages the cash session opening process, including initial cash amount entry and supervisor validation for high values.
- **CloseCashModal**: Handles cash session closure with final count input, payment method reconciliation, discrepancy calculation, and closure reporting.
- **PaymentModal**: Processes payments for bar orders (comandas) with support for multiple payment methods including cash, debit, credit, PIX, and transfer.
- **CashWithdrawalModal**: Facilitates cash withdrawals during active sessions with proper authorization and audit logging.
- **TreasuryTransferModal**: Manages transfers between cashiers and main treasury with appropriate security controls.

These components are integrated through the `useCashManagement` hook which provides the business logic layer connecting the UI components with the backend services.

**Section sources**
- [OpenCashModal.tsx](file://src/pages/CashManagement/components/OpenCashModal.tsx)
- [CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx)
- [PaymentModal.tsx](file://src/pages/CashManagement/components/PaymentModal.tsx)
- [CashWithdrawalModal.tsx](file://src/pages/CashManagement/components/CashWithdrawalModal.tsx)
- [TreasuryTransferModal.tsx](file://src/pages/CashManagement/components/TreasuryTransferModal.tsx)

## Architecture Overview

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "UI Components"
participant Hook as "useCashManagement"
participant Service as "cash-manager Service"
participant DB as "Supabase Database"
User->>UI : Open Cash Session
UI->>Hook : openCashSession(initialAmount, observations)
Hook->>Service : createCashSession(employeeId, initialAmount)
Service->>DB : INSERT INTO cash_sessions
DB-->>Service : Session ID
Service-->>Hook : Success Response
Hook-->>UI : Update State
UI-->>User : Session Opened Confirmation
User->>UI : Process Payment
UI->>Hook : processPayment(comandaId, amounts, method, reference)
Hook->>Service : recordTransaction(paymentData)
Service->>DB : INSERT INTO cash_transactions
Service->>DB : UPDATE payment_reconciliation
DB-->>Service : Transaction ID
Service-->>Hook : Success Response
Hook-->>UI : Update State
UI-->>User : Payment Confirmed
User->>UI : Close Cash Session
UI->>Hook : closeCashSession(finalAmounts, observations)
Hook->>Service : reconcileAndClose(sessionId, finalCounts)
Service->>DB : SELECT SUM from cash_transactions
DB-->>Service : Transaction Totals
Service->>Service : Calculate Discrepancies
Service->>DB : INSERT INTO payment_reconciliation
Service->>DB : INSERT INTO cash_audit_log
DB-->>Service : Closure Record
Service-->>Hook : Closure Report
Hook-->>UI : Display Report
UI-->>User : Session Closed with Report
```

**Diagram sources**
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts#L1-L50)
- [cash-manager.ts](file://src/services/cash-manager.ts#L1-L100)
- [OpenCashModal.tsx](file://src/pages/CashManagement/components/OpenCashModal.tsx#L1-L30)
- [CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx#L1-L30)
- [PaymentModal.tsx](file://src/pages/CashManagement/components/PaymentModal.tsx#L1-L30)

## Detailed Component Analysis

### Cash Session Lifecycle Management

#### Opening a Cash Session
The cash session lifecycle begins with the `OpenCashModal` component, which collects the initial cash amount and optional observations. The system validates the entered amount, requiring supervisor approval for values exceeding predefined thresholds. Upon submission, the `useCashManagement` hook invokes the `openCashSession` method, which creates a new record in the `cash_sessions` table with the employee ID, opening timestamp, initial amount, and status set to 'active'.

```mermaid
flowchart TD
Start([Start]) --> Input["Enter Initial Amount"]
Input --> Validate["Validate Amount"]
Validate --> |High Value| Supervisor["Require Supervisor Approval"]
Validate --> |Normal Value| Continue["Proceed"]
Supervisor --> Approve{"Approved?"}
Approve --> |No| Reject["Reject Request"]
Approve --> |Yes| Continue
Continue --> Create["Create Cash Session Record"]
Create --> Log["Log Event in Audit Trail"]
Log --> Notify["Notify User of Success"]
Notify --> End([Session Active])
```

**Diagram sources**
- [OpenCashModal.tsx](file://src/pages/CashManagement/components/OpenCashModal.tsx#L15-L80)
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts#L25-L60)

#### Closing a Cash Session
The `CloseCashModal` component manages the cash session closure process. It requires the user to input the final cash amounts for each payment method. The system automatically calculates expected totals based on transaction records and computes discrepancies. The closure process includes reconciliation across all payment methods (cash, debit, credit, PIX, transfer), generation of a closure report, and finalization of the session with status update to 'closed'.

```mermaid
flowchart TD
Start([Start]) --> Count["Count Final Amounts"]
Count --> Enter["Enter Amounts by Payment Method"]
Enter --> Retrieve["Retrieve Expected Totals"]
Retrieve --> Calculate["Calculate Discrepancies"]
Calculate --> Review["Review Discrepancies"]
Review --> |Significant| Investigate["Investigate Reasons"]
Review --> |Acceptable| Confirm["Confirm Closure"]
Investigate --> Resolve["Resolve Issues"]
Resolve --> Confirm
Confirm --> Reconcile["Update Reconciliation Records"]
Reconcile --> Finalize["Finalize Session Status"]
Finalize --> Generate["Generate Closure Report"]
Generate --> Archive["Archive Session Data"]
Archive --> End([Session Closed])
```

**Diagram sources**
- [CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx#L20-L90)
- [cash-manager.ts](file://src/services/cash-manager.ts#L80-L150)

### Transaction Processing

#### Payment Methods Support
The Cash Management Module supports five payment methods:
- Cash
- Debit Card
- Credit Card  
- PIX (Instant Payment)
- Bank Transfer

Each transaction is recorded with detailed information including comanda ID, amounts, payment method, transaction timestamp, employee ID, and optional reference numbers for electronic payments.

```mermaid
classDiagram
class CashTransaction {
+string id
+string session_id
+string comanda_id
+PaymentMethod method
+number amount
+string reference_number
+string employee_id
+datetime created_at
+TransactionStatus status
+string notes
}
class PaymentMethod {
<<enumeration>>
CASH
DEBIT_CARD
CREDIT_CARD
PIX
TRANSFER
}
class TransactionStatus {
<<enumeration>>
PENDING
COMPLETED
FAILED
REVERSED
}
CashTransaction --> PaymentMethod : "uses"
CashTransaction --> TransactionStatus : "has"
```

**Diagram sources**
- [cash-management.ts](file://src/types/cash-management.ts#L10-L50)
- [PaymentModal.tsx](file://src/pages/CashManagement/components/PaymentModal.tsx#L15-L40)

### Financial Reconciliation

#### Data Model for Cash Movements
The system maintains a comprehensive data model for tracking all cash movements throughout the session lifecycle. The primary entities include:

```mermaid
erDiagram
CASH_SESSIONS {
uuid id PK
uuid employee_id FK
timestamp opened_at
timestamp closed_at
decimal initial_amount
decimal final_amount
jsonb final_counts
text opening_notes
text closing_notes
enum status
timestamp created_at
timestamp updated_at
}
CASH_TRANSACTIONS {
uuid id PK
uuid session_id FK
uuid comanda_id FK
string method
decimal amount
string reference_number
uuid employee_id FK
timestamp created_at
enum status
text notes
}
PAYMENT_RECONCILIATION {
uuid id PK
uuid session_id FK
string method
decimal expected_amount
decimal actual_amount
decimal discrepancy
text explanation
uuid verified_by FK
timestamp verified_at
}
CASH_AUDIT_LOG {
uuid id PK
uuid session_id FK
string action
jsonb old_values
jsonb new_values
uuid employee_id FK
timestamp created_at
text ip_address
text user_agent
}
CASH_SESSIONS ||--o{ CASH_TRANSACTIONS : contains
CASH_SESSIONS ||--o{ PAYMENT_RECONCILIATION : reconciled_in
CASH_SESSIONS ||--o{ CASH_AUDIT_LOG : logged_in
```

**Diagram sources**
- [20250908000001_cash_management_system.sql](file://supabase/migrations/20250908000001_cash_management_system.sql#L1-L200)
- [cash-management.ts](file://src/types/cash-management.ts#L5-L100)

### Reporting Features

#### Dashboard Overview Component
The `DashboardOverview` component provides real-time insights into cash operations with key metrics displayed in an intuitive interface. It leverages the `useCashManagement` hook to retrieve current session data and performance metrics.

```mermaid
flowchart TD
Dashboard["DashboardOverview Component"] --> Hook["useCashManagement Hook"]
Hook --> API["Supabase Realtime API"]
API --> Cache["Realtime Data Cache"]
Cache --> Metrics["Calculate Metrics"]
Dashboard --> KPIs["Display KPIs"]
KPIs --> Sales["Today's Sales Total"]
KPIs --> Pending["Pending Comandas"]
KPIs --> Performance["Employee Performance"]
KPIs --> Payments["Payment Method Distribution"]
Dashboard --> Charts["Render Charts"]
Charts --> Daily["Daily Sales Trend"]
Charts --> Method["Payment Method Pie Chart"]
Charts --> Employee["Top Employees Bar Chart"]
Dashboard --> Alerts["Show Alerts"]
Alerts --> Discrepancies["Reconciliation Warnings"]
Alerts --> HighValue["Large Transactions"]
Alerts --> Session["Session Duration"]
```

**Diagram sources**
- [DashboardOverview.tsx](file://src/pages/CashManagement/components/DashboardOverview.tsx#L10-L75)
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts#L5-L20)

#### Transaction History Component
The `TransactionHistory` component provides a detailed view of all transactions within the current or selected period. Users can filter by date range, payment method, employee, or transaction status.

```mermaid
flowchart TD
History["TransactionHistory Component"] --> Filters["Apply Filters"]
Filters --> Date["Date Range"]
Filters --> Method["Payment Method"]
Filters --> Employee["Employee"]
Filters --> Status["Transaction Status"]
History --> Fetch["Fetch Transactions"]
Fetch --> Pagination["Handle Pagination"]
Pagination --> Display["Display Transaction List"]
Display --> Row["Transaction Row"]
Row --> ID["Transaction ID"]
Row --> Time["Timestamp"]
Row --> Comanda["Comanda ID"]
Row --> MethodCol["Payment Method"]
Row --> Amount["Amount"]
Row --> EmployeeCol["Employee"]
Row --> StatusCol["Status"]
Display --> Actions["Action Buttons"]
Actions --> View["View Details"]
Actions --> Receipt["Print Receipt"]
Actions --> Reverse["Reverse Transaction"]
```

**Diagram sources**
- [TransactionHistory.tsx](file://src/pages/CashManagement/components/TransactionHistory.tsx#L15-L60)
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts#L30-L45)

## Dependency Analysis

```mermaid
graph LR
OC[OpenCashModal] --> HC[useCashManagement]
CC[CloseCashModal] --> HC
PM[PaymentModal] --> HC
CW[CashWithdrawalModal] --> HC
TT[TreasuryTransferModal] --> HC
DO[DashboardOverview] --> HC
TH[TransactionHistory] --> HC
HC --> SM[cash-manager Service]
HC --> TCM[Types]
SM --> DB[Supabase Database]
SM --> AL[AuditLogger]
AL --> DB
DB --> RT[Realtime Updates]
RT --> DO
RT --> TH
Auth[AuthContext] --> HC
UP[ui-permission-utils] --> DO
UP --> TH
```

**Diagram sources**
- [OpenCashModal.tsx](file://src/pages/CashManagement/components/OpenCashModal.tsx)
- [CloseCashModal.tsx](file://src/pages/CashManagement/components/CloseCashModal.tsx)
- [PaymentModal.tsx](file://src/pages/CashManagement/components/PaymentModal.tsx)
- [CashWithdrawalModal.tsx](file://src/pages/CashManagement/components/CashWithdrawalModal.tsx)
- [TreasuryTransferModal.tsx](file://src/pages/CashManagement/components/TreasuryTransferModal.tsx)
- [DashboardOverview.tsx](file://src/pages/CashManagement/components/DashboardOverview.tsx)
- [TransactionHistory.tsx](file://src/pages/CashManagement/components/TransactionHistory.tsx)
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts)
- [cash-manager.ts](file://src/services/cash-manager.ts)
- [ui-permission-utils.ts](file://src/utils/ui-permission-utils.ts)

**Section sources**
- [useCashManagement.ts](file://src/hooks/useCashManagement.ts#L1-L100)
- [cash-manager.ts](file://src/services/cash-manager.ts#L1-L200)

## Performance Considerations
The Cash Management Module is designed with performance optimization in mind. Key considerations include:

- **Realtime Updates**: Leveraging Supabase Realtime functionality to push updates to all connected clients without polling.
- **Efficient Queries**: Optimized database queries with appropriate indexing on frequently accessed fields like session_id, employee_id, and created_at.
- **Client-Side Caching**: The useCashManagement hook implements caching to minimize redundant API calls.
- **Lazy Loading**: Transaction history and reports load data incrementally using pagination.
- **Debounced Searches**: Search functionality in transaction history uses debouncing to reduce server load.

The system also includes fallback mechanisms during development or connectivity issues, ensuring usability even when the primary service is unavailable.

## Troubleshooting Guide

### Common Issues and Solutions

**Duplicate Transactions**
- **Symptoms**: Same transaction appears twice in history, reconciliation discrepancies
- **Causes**: Double-clicking submit button, network latency causing retry
- **Solutions**: 
  - Implement button disabling during submission
  - Use transaction IDs with unique constraints
  - Add client-side duplicate detection

**Failed Session Closures**
- **Symptoms**: Closure process fails, discrepancies cannot be resolved
- **Causes**: Large discrepancies exceeding tolerance, missing transactions, permission issues
- **Solutions**:
  - Verify all comandas are closed before closure
  - Check for pending transactions
  - Ensure supervisor privileges for large discrepancies
  - Review audit logs for anomalies

**Constraint Violations**
- **Symptoms**: Database errors during operations
- **Causes**: Invalid data types, missing required fields, foreign key violations
- **Solutions**:
  - Validate inputs before submission
  - Ensure all required fields are populated
  - Verify referenced entities exist

**Reconciliation Mismatches**
- **Symptoms**: Expected vs actual amounts don't match
- **Causes**: Unrecorded cash movements, incorrect counting, timing issues
- **Solutions**:
  - Conduct thorough cash counts
  - Review all transaction types (including withdrawals)
  - Verify timezone consistency in timestamps

**Section sources**
- [CORRECAO-CASH-CONSTRAINT.md](file://CORRECAO-CASH-CONSTRAINT.md)
- [DEBUG_TRANSACOES.md](file://DEBUG_TRANSACOES.md)
- [cash-manager.test.ts](file://src/services/__tests__/cash-manager.test.ts)

## Conclusion
The Cash Management Module provides a robust solution for handling cash operations in the AABB System. With comprehensive features for session management, transaction processing, and financial reconciliation, it ensures accurate financial tracking and audit compliance. The modular architecture with clear separation of concerns between UI components, business logic hooks, and backend services enables maintainability and scalability. Real-time capabilities and detailed reporting provide valuable insights for operational decision-making. Proper implementation of the database migrations and configuration will ensure the system functions as intended, providing a reliable foundation for cash management operations.