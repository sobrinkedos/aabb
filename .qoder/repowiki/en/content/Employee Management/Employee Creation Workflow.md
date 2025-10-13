# Employee Creation Workflow

<cite>
**Referenced Files in This Document**   
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts)
- [useEmployeeCreation.ts](file://src/hooks/useEmployeeCreation.ts)
- [credentialsGenerator.ts](file://src/utils/credentialsGenerator.ts)
- [secure-password-generator.ts](file://src/utils/secure-password-generator.ts)
- [auditLogger.ts](file://src/utils/auditLogger.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Components](#core-components)
3. [7-Step Employee Creation Process](#7-step-employee-creation-process)
4. [Temporary Password Generation and senha_provisoria Flag](#temporary-password-generation-and-senha_provisoria-flag)
5. [Stela Silva Case Study](#stela-silva-case-study)
6. [Error Handling and Rollback Strategy](#error-handling-and-rollback-strategy)
7. [Integration with useEmployeeCreation Hook](#integration-with-useemployeecreation-hook)
8. [Security Considerations](#security-considerations)
9. [Conclusion](#conclusion)

## Introduction
The employee creation workflow is a comprehensive system designed to onboard new employees into the organization's digital ecosystem. This document details the 7-step process for creating an employee, including email verification, credential generation, Supabase Auth creation, profile registration, bar employee registration, company linkage, and permission configuration. The workflow ensures secure and efficient onboarding while maintaining data integrity and access control.

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L517-L712)

## Core Components
The employee creation workflow relies on several core components that work together to ensure a seamless onboarding experience. These include the `EmployeeCreationService`, which orchestrates the entire process, the `useEmployeeCreation` hook for frontend integration, and various utility functions for credential generation and audit logging.

```mermaid
classDiagram
class EmployeeCreationService {
+createCompleteEmployee(data, empresa_id) EmployeeCreationResult
+generateCredentials(nomeCompleto, email) EmployeeCredentials
+checkEmailExists(email) boolean
+updateEmployeePassword(userId, newPassword, isTemporary) ServiceResult
+deactivateEmployee(employeeId) ServiceResult
+reactivateEmployee(employeeId) ServiceResult
+updateEmployeePermissions(usuarioEmpresaId, newPermissions) ServiceResult
+listEmployees(empresaId, includeInactive) EmployeeListResult
}
class UseEmployeeCreation {
+createEmployee(employeeData) EmployeeCreationResult
+createEmployeeWithDefaultPermissions(basicData) EmployeeCreationResult
+updatePassword(userId, newPassword, isTemporary) ServiceResult
+deactivateEmployee(employeeId) ServiceResult
+reactivateEmployee(employeeId) ServiceResult
+updatePermissions(usuarioEmpresaId, newPermissions) ServiceResult
+listEmployees(includeInactive) EmployeeListResult
}
class SecurePasswordGenerator {
+generatePasswordForRole(role) GeneratedPassword
+calculatePasswordStrength(password) PasswordStrength
}
class AuditLogger {
+log(action, resourceType, resourceId, details, success, errorMessage) void
+logEmployeeCreated(employeeId, employeeData) void
+logEmployeeUpdated(employeeId, changes) void
+logEmployeeDeactivated(employeeId, reason) void
+logLoginAttempt(email, success, errorMessage) void
}
EmployeeCreationService --> UseEmployeeCreation : "used by"
EmployeeCreationService --> SecurePasswordGenerator : "uses"
EmployeeCreationService --> AuditLogger : "uses"
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L517-L712)
- [useEmployeeCreation.ts](file://src/hooks/useEmployeeCreation.ts#L0-L272)
- [secure-password-generator.ts](file://src/utils/secure-password-generator.ts#L185-L197)
- [auditLogger.ts](file://src/utils/auditLogger.ts#L0-L132)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L517-L712)
- [useEmployeeCreation.ts](file://src/hooks/useEmployeeCreation.ts#L0-L272)
- [secure-password-generator.ts](file://src/utils/secure-password-generator.ts#L185-L197)
- [auditLogger.ts](file://src/utils/auditLogger.ts#L0-L132)

## 7-Step Employee Creation Process
The employee creation process consists of seven distinct steps, each critical to ensuring a successful onboarding. This section details each step, its purpose, and how it integrates with the overall workflow.

### Step 1: Email Verification
The first step in the employee creation process is verifying the uniqueness of the provided email address. This prevents duplicate accounts and maintains data integrity across the system.

```mermaid
sequenceDiagram
participant Frontend as "Frontend Application"
participant Hook as "useEmployeeCreation"
participant Service as "EmployeeCreationService"
participant DB as "Database"
Frontend->>Hook : createEmployee(employeeData)
Hook->>Service : createCompleteEmployee(employeeData, empresa_id)
Service->>DB : checkEmailExists(email)
DB-->>Service : exists (boolean)
alt Email already exists
Service-->>Hook : Error - Email in use
Hook-->>Frontend : Error - Email in use
else Email available
Service->>Service : Continue process
end
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1598-L1632)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1598-L1632)

### Step 2: Credential Generation
Once the email is verified, the system generates secure credentials for the new employee. This includes creating a temporary password with special characters based on the employee's role and responsibilities.

```mermaid
flowchart TD
Start([Start]) --> GenerateCredentials["Generate Credentials"]
GenerateCredentials --> RoleCheck{"Role = 'gerente'?}
RoleCheck --> |Yes| ManagerPassword["Use manager preset (12 chars, symbols)"]
RoleCheck --> |No| EmployeePassword["Use employee preset (10 chars, no symbols)"]
ManagerPassword --> Shuffle["Shuffle password characters"]
EmployeePassword --> Shuffle
Shuffle --> Validate["Validate password strength"]
Validate --> End([End])
```

**Diagram sources**
- [secure-password-generator.ts](file://src/utils/secure-password-generator.ts#L185-L197)

**Section sources**
- [secure-password-generator.ts](file://src/utils/secure-password-generator.ts#L185-L197)

### Step 3: Supabase Auth Creation
The third step involves creating a user account in Supabase Auth, which serves as the primary authentication mechanism for the system. This step uses a fallback strategy to handle potential database trigger issues.

```mermaid
sequenceDiagram
participant Service as "EmployeeCreationService"
participant Supabase as "Supabase Auth"
Service->>Supabase : tryCreateAuthUser(employeeData, senha, false)
alt Success
Supabase-->>Service : userId
Service->>Service : Confirm email automatically
else Failure due to database error
Service->>Supabase : tryCreateAuthUser(employeeData, senha, true)
alt Success
Supabase-->>Service : userId
Service->>Service : Confirm email automatically
else Failure
Service->>Service : Log warning, continue without auth
end
end
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L800-L950)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L800-L950)

### Step 4: Profile Registration
After successful authentication setup, the system creates a user profile that contains additional information about the employee, such as their name, role, and avatar.

```mermaid
sequenceDiagram
participant Service as "EmployeeCreationService"
participant DB as "Database"
Service->>DB : createUserProfileSafely(userId, employeeData)
alt Profile table exists
DB-->>Service : Success
else Profile table doesn't exist
Service->>Service : Log warning, continue
end
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L951-L1000)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L951-L1000)

### Step 5: Bar Employee Registration
The fifth step registers the employee in the bar-specific employee system, capturing role-specific information such as shift preferences, specialties, and commission rates.

```mermaid
sequenceDiagram
participant Service as "EmployeeCreationService"
participant DB as "Database"
Service->>DB : createBarEmployeeSafely(employeeData, empresa_id, employeeId)
DB-->>Service : employeeId
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1101-L1150)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1101-L1150)

### Step 6: Company Linkage
This step establishes the relationship between the employee and their company by creating a record in the usuarios_empresa table, which links the user to a specific company.

```mermaid
sequenceDiagram
participant Service as "EmployeeCreationService"
participant DB as "Database"
Service->>DB : createUsuarioEmpresaSafely(employeeData, empresa_id, authUserId)
DB-->>Service : usuarioEmpresaId
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1151-L1200)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1151-L1200)

### Step 7: Permission Configuration
The final step configures the employee's permissions within the system, determining what actions they can perform and what data they can access.

```mermaid
sequenceDiagram
participant Service as "EmployeeCreationService"
participant DB as "Database"
Service->>DB : createUserPermissionsSafely(usuarioEmpresaId, permissoesModulos)
DB-->>Service : Success/Failure
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1201-L1250)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1201-L1250)

## Temporary Password Generation and senha_provisoria Flag
The system automatically generates temporary passwords with special characters based on the employee's role. The senha_provisoria flag mechanism ensures that employees are required to change their password upon first login.

### Password Generation Logic
The password generation system uses different presets based on the employee's role:

```mermaid
classDiagram
class PASSWORD_PRESETS {
+employee : PasswordConfig
+manager : PasswordConfig
+admin : PasswordConfig
+temporary : PasswordConfig
}
class PasswordConfig {
+length : number
+includeUppercase : boolean
+includeLowercase : boolean
+includeNumbers : boolean
+includeSymbols : boolean
+excludeSimilar : boolean
+excludeAmbiguous : boolean
+minUppercase? : number
+minLowercase? : number
+minNumbers? : number
+minSymbols? : number
}
PASSWORD_PRESETS --> PasswordConfig : "contains"
```

**Diagram sources**
- [secure-password-generator.ts](file://src/utils/secure-password-generator.ts#L20-L70)

**Section sources**
- [secure-password-generator.ts](file://src/utils/secure-password-generator.ts#L20-L70)

### senha_provisoria Flag Mechanism
The senha_provisoria flag is set to true when a new employee is created, indicating that they must change their password upon first login.

```mermaid
sequenceDiagram
participant Service as "EmployeeCreationService"
participant DB as "Database"
Service->>DB : Insert into usuarios_empresa
Note over Service,DB : senha_provisoria = true
DB-->>Service : Success
Service->>Service : Monitor first login
Service->>Service : Require password change if senha_provisoria = true
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1151-L1200)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1151-L1200)

## Stela Silva Case Study
The Stela Silva case study demonstrates the complete employee creation workflow in action, showcasing how the system handles a real-world onboarding scenario.

### Scenario Overview
Stela Silva is being hired as a manager at a new location. Her onboarding requires full system access with elevated permissions.

```mermaid
sequenceDiagram
participant Admin as "Administrator"
participant System as "Employee Creation System"
Admin->>System : Initiate employee creation
System->>System : Verify stela.silva@company.com is unique
System->>System : Generate manager-level password
System->>System : Create Supabase Auth account
System->>System : Register bar employee details
System->>System : Link to company
System->>System : Configure manager permissions
System->>Admin : Provide credentials and success confirmation
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L517-L712)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L517-L712)

## Error Handling and Rollback Strategy
The employee creation system implements comprehensive error handling and rollback strategies to maintain data consistency in case of failures.

### Error Classification
The system categorizes errors into five types:
- VALIDATION_ERROR: Input data validation failures
- AUTH_ERROR: Authentication-related issues
- DATABASE_ERROR: Database operation failures
- PERMISSION_ERROR: Authorization problems
- NETWORK_ERROR: Connectivity issues

```mermaid
stateDiagram-v2
[*] --> Idle
Idle --> Processing : "createCompleteEmployee called"
Processing --> ValidationError : "Invalid input data"
Processing --> AuthError : "Supabase Auth failure"
Processing --> DatabaseError : "Database constraint violation"
Processing --> NetworkError : "Connection timeout"
Processing --> Success : "All steps completed"
ValidationError --> Rollback : "Cleanup partial data"
AuthError --> Rollback : "Remove created Auth user"
DatabaseError --> Rollback : "Revert database changes"
NetworkError --> Retry : "Attempt retry"
Retry --> Success
Retry --> Rollback
Rollback --> ErrorState : "Return error result"
Success --> Complete : "Return success result"
ErrorState --> [*]
Complete --> [*]
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L150-L200)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L150-L200)

### Rollback Implementation
When a critical failure occurs, the system executes a cleanup process to remove partially created data:

```mermaid
flowchart TD
Start([Failure detected]) --> CheckAuth["Check if Auth user was created"]
CheckAuth --> |Yes| RemoveAuth["Remove user from Supabase Auth"]
CheckAuth --> |No| SkipAuth
RemoveAuth --> RemoveBar["Remove from bar_employees"]
SkipAuth --> RemoveBar
RemoveBar --> RemoveUsuarios["Remove from usuarios_empresa"]
RemoveUsuarios --> RemovePermissions["Remove from permissoes_usuario"]
RemovePermissions --> LogError["Log error and return"]
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L650-L660)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L650-L660)

## Integration with useEmployeeCreation Hook
The useEmployeeCreation hook provides a clean interface for integrating the employee creation functionality into React components.

### Hook Usage Example
```typescript
const { createEmployeeWithDefaultPermissions } = useEmployeeCreation();

const handleCreateEmployee = async () => {
  const basicData = {
    nome_completo: "John Doe",
    email: "john.doe@company.com",
    bar_role: "atendente",
    tem_acesso_sistema: true,
  };

  const result = await createEmployeeWithDefaultPermissions(basicData);
  
  if (result.success) {
    // Handle success
  } else {
    // Handle error
  }
};
```

```mermaid
classDiagram
class useEmployeeCreation {
+loading : boolean
+error : string | null
+createEmployee(employeeData) Promise~EmployeeCreationResult~
+createEmployeeWithDefaultPermissions(basicData) Promise~EmployeeCreationResult~
+updatePassword(userId, newPassword, isTemporary) Promise~ServiceResult~
+deactivateEmployee(employeeId) Promise~ServiceResult~
+reactivateEmployee(employeeId) Promise~ServiceResult~
+updatePermissions(usuarioEmpresaId, newPermissions) Promise~ServiceResult~
+listEmployees(includeInactive) Promise~EmployeeListResult~
}
useEmployeeCreation --> EmployeeCreationService : "uses instance"
```

**Diagram sources**
- [useEmployeeCreation.ts](file://src/hooks/useEmployeeCreation.ts#L0-L272)

**Section sources**
- [useEmployeeCreation.ts](file://src/hooks/useEmployeeCreation.ts#L0-L272)

## Security Considerations
The employee creation workflow incorporates several security measures to protect sensitive data and prevent unauthorized access.

### Unique Email Enforcement
The system ensures email uniqueness through database constraints and application-level checks:

```mermaid
flowchart TD
Start([Start]) --> QueryDB["Query usuarios_empresa table"]
QueryDB --> CheckExists{"Email exists?"}
CheckExists --> |Yes| ReturnError["Return error - email in use"]
CheckExists --> |No| Continue["Continue creation process"]
```

**Diagram sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1598-L1632)

**Section sources**
- [employee-creation-service.ts](file://src/services/employee-creation-service.ts#L1598-L1632)

### Audit Logging
All employee creation activities are logged for security and compliance purposes:

```mermaid
sequenceDiagram
participant Service as "EmployeeCreationService"
participant Logger as "AuditLogger"
participant DB as "Database"
participant LocalStorage as "LocalStorage"
Service->>Logger : logEmployeeCreated(employeeId, employeeData)
Logger->>DB : saveToDB(logEntry)
alt Success
DB-->>Logger : Success
else Failure
Logger->>LocalStorage : saveToLocalStorage(logEntry)
end
```

**Diagram sources**
- [auditLogger.ts](file://src/utils/auditLogger.ts#L0-L132)

**Section sources**
- [auditLogger.ts](file://src/utils/auditLogger.ts#L0-L132)

## Conclusion
The employee creation workflow is a robust and secure system that automates the onboarding process while maintaining data integrity and access control. By following the 7-step process, the system ensures that new employees are properly configured with appropriate credentials and permissions. The integration of error handling, rollback strategies, and audit logging provides a reliable foundation for managing employee accounts within the organization.