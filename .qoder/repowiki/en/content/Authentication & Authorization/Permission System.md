# Permission System

<cite>
**Referenced Files in This Document**   
- [PermissionEditor.tsx](file://src/components/permissions/PermissionEditor.tsx)
- [permission-presets.ts](file://src/services/permission-presets.ts)
- [usePermissions.ts](file://src/hooks/usePermissions.ts)
- [permission-utils.ts](file://src/utils/permission-utils.ts)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)
- [PermissionGuard.tsx](file://src/components/Auth/PermissionGuard.tsx)
- [usePrivilegeCheck.ts](file://src/hooks/usePrivilegeCheck.ts)
- [permissions.ts](file://src/types/permissions.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Architecture](#core-architecture)
3. [Role-Based vs Privilege-Based Access Control](#role-based-vs-privilege-based-access-control)
4. [Permission Editor Component](#permission-editor-component)
5. [Permission Validation and Sanitization](#permission-validation-and-sanitization)
6. [Permission Presets Management](#permission-presets-management)
7. [Real-Time Permission Updates](#real-time-permission-updates)
8. [Performance Considerations and Caching](#performance-considerations-and-caching)
9. [Implementation Examples](#implementation-examples)
10. [Auditing and Security](#auditing-and-security)

## Introduction

The permission system in the AABB-system provides a comprehensive framework for managing user access controls with granular precision. It combines role-based access control (RBAC) with privilege-based mechanisms to ensure secure, flexible, and scalable authorization across the application. The system supports hierarchical roles, customizable permission presets, real-time updates, and robust validation to maintain data integrity and security.

This documentation details the architecture, implementation, and usage patterns of the permission system, focusing on how permissions are defined, stored, validated, and enforced throughout the application lifecycle.

## Core Architecture

The permission system is built around a modular architecture that separates concerns between permission definition, storage, validation, and enforcement. At its core, the system uses TypeScript interfaces and classes to define structured permission models that can be easily consumed by various components.

```mermaid
classDiagram
class BarRole {
<<enumeration>>
atendente
garcom
cozinheiro
barman
gerente
}
class SystemModule {
<<enumeration>>
dashboard
monitor_bar
atendimento_bar
monitor_cozinha
gestao_caixa
clientes
funcionarios
relatorios
configuracoes
estoque
cardapio
promocoes
financeiro
}
class PermissionAction {
<<enumeration>>
visualizar
criar
editar
excluir
administrar
}
class ModulePermission {
+visualizar : boolean
+criar : boolean
+editar : boolean
+excluir : boolean
+administrar : boolean
}
class ModulePermissions {
+[module : SystemModule] : ModulePermission
}
class RolePermissionConfig {
+role : BarRole
+displayName : string
+description : string
+accessLevel : AccessLevel
+userType : UserType
+hierarchy : number
+canManageRoles? : BarRole[]
+permissions : ModulePermissions
}
class PermissionPreset {
+id : string
+name : string
+description : string
+role : BarRole
+permissions : ModulePermissions
+isDefault : boolean
+isCustomizable : boolean
+createdAt : string
+updatedAt : string
}
class UserPermissionContext {
+userId : string
+role : BarRole
+permissions : ModulePermissions
+effectivePermissions : ModulePermissions
+canAccess(module : SystemModule, action : PermissionAction) : boolean
+canManage(targetRole : BarRole) : boolean
}
class PermissionValidationResult {
+isValid : boolean
+hasAccess : boolean
+missingPermissions : Array<{ module : SystemModule; action : PermissionAction; required : boolean; current : boolean }>
+warnings : string[]
+errors : string[]
}
ModulePermissions "1" -- "*" ModulePermission : contains
RolePermissionConfig "1" -- "1" ModulePermissions : defines
PermissionPreset "1" -- "1" ModulePermissions : contains
UserPermissionContext "1" -- "1" ModulePermissions : references
```

**Diagram sources**
- [permissions.ts](file://src/types/permissions.ts#L1-L245)

**Section sources**
- [permissions.ts](file://src/types/permissions.ts#L1-L245)

## Role-Based vs Privilege-Based Access Control

The system implements both role-based and privilege-based access control mechanisms, each serving different use cases within the application.

### Role-Based Access Control (RBAC)

Role-based access control assigns permissions based on predefined roles such as "atendente", "garcom", "cozinheiro", "barman", and "gerente". Each role has a specific set of permissions that determine what actions the user can perform within different modules of the system.

```mermaid
graph TD
A[User] --> B[Role]
B --> C[Permission Configuration]
C --> D[Module Permissions]
D --> E[System Module]
subgraph Roles
B1("atendente")
B2("garcom")
B3("cozinheiro")
B4("barman")
B5("gerente")
end
subgraph Modules
E1("dashboard")
E2("monitor_bar")
E3("atendimento_bar")
E4("monitor_cozinha")
E5("gestao_caixa")
E6("clientes")
E7("funcionarios")
E8("relatorios")
E9("configuracoes")
E10("estoque")
E11("cardapio")
E12("promocoes")
E13("financeiro")
end
B1 --> |READ_ONLY| E1
B1 --> |OPERATIONAL| E5
B1 --> |READ_WRITE| E6
B2 --> |OPERATIONAL| E3
B2 --> |READ_WRITE| E6
B2 --> |READ_ONLY| E11
B3 --> |OPERATIONAL| E4
B3 --> |READ_WRITE| E10
B3 --> |READ_WRITE| E11
B4 --> |OPERATIONAL| E2
B4 --> |READ_WRITE| E3
B4 --> |READ_WRITE| E10
B4 --> |READ_WRITE| E11
B5 --> |FULL| E1
B5 --> |FULL| E2
B5 --> |FULL| E3
B5 --> |FULL| E4
B5 --> |FULL| E5
B5 --> |FULL| E6
B5 --> |FULL| E7
B5 --> |FULL| E8
B5 --> |READ_WRITE| E9
B5 --> |FULL| E10
B5 --> |FULL| E11
B5 --> |FULL| E12
B5 --> |READ_WRITE| E13
```

**Diagram sources**
- [permission-presets.ts](file://src/services/permission-presets.ts#L1-L564)

**Section sources**
- [permission-presets.ts](file://src/services/permission-presets.ts#L1-L564)

### Privilege-Based Access Control

Privilege-based access control operates at a higher level than RBAC, focusing on administrative capabilities and system-wide privileges. These privileges are typically associated with user roles but can be independently managed.

```mermaid
sequenceDiagram
participant User as "User"
participant Context as "HierarchicalAuthContext"
participant Check as "usePrivilegeCheck"
participant Middleware as "Authorization Middleware"
participant Resource as "Protected Resource"
User->>Context : Request authentication
Context-->>User : Provide role and privileges
User->>Check : Call podeConfigurarEmpresa()
Check->>Context : verificarPrivilegio('configuracoes_empresa')
Context-->>Check : Return privilege status
Check-->>User : Return true/false
User->>Middleware : Access endpoint
Middleware->>Context : Validate required privilege
Context-->>Middleware : Confirm privilege
Middleware->>Resource : Grant access
Resource-->>User : Return resource
```

**Diagram sources**
- [usePrivilegeCheck.ts](file://src/hooks/usePrivilegeCheck.ts#L6-L54)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts#L1-L27)

**Section sources**
- [usePrivilegeCheck.ts](file://src/hooks/usePrivilegeCheck.ts#L6-L54)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts#L1-L27)

## Permission Editor Component

The PermissionEditor component provides a visual interface for managing user permissions with real-time validation and feedback.

```mermaid
flowchart TD
A[PermissionEditor] --> B[Initial Setup]
B --> C{Show Presets?}
C --> |Yes| D[Render PresetSelector]
C --> |No| E[Skip Presets]
D --> F[Display Available Presets]
F --> G{Allow Custom Presets?}
G --> |Yes| H[Show Create Form]
G --> |No| I[Hide Create Form]
A --> J[Render Module Rows]
J --> K[For each SystemModule]
K --> L[Create ModulePermissionRow]
L --> M[Display Module Info]
M --> N[Render Action Toggles]
N --> O[For each PermissionAction]
O --> P[Create PermissionToggle]
P --> Q[Apply Color Coding]
A --> R[Render Actions Panel]
R --> S{ReadOnly?}
S --> |No| T[Show Reset Button]
S --> |No| U[Show Sanitize Button]
S --> |No| V[Show Save Button]
T --> W[Handle resetToDefault]
U --> X[Handle sanitizeCurrentPermissions]
V --> Y[Handle onSave]
A --> Z[Display Summary]
Z --> AA[Show Accessible Modules]
Z --> AB[Show Editable Modules]
Z --> AC[Show Admin Modules]
```

**Diagram sources**
- [PermissionEditor.tsx](file://src/components/permissions/PermissionEditor.tsx#L374-L578)

**Section sources**
- [PermissionEditor.tsx](file://src/components/permissions/PermissionEditor.tsx#L374-L578)

## Permission Validation and Sanitization

The system includes comprehensive validation and sanitization mechanisms to ensure permission configurations are consistent and secure.

```mermaid
flowchart TD
A[validatePermissionConfiguration] --> B[Check Required Modules]
B --> C{Missing Required Modules?}
C --> |Yes| D[Add to missingPermissions]
C --> |No| E[Continue]
E --> F[Check Permission Dependencies]
F --> G{Can Administer?}
G --> |Yes| H[Must Have All Other Permissions]
G --> |No| I[Continue]
H --> J{Missing Dependencies?}
J --> |Yes| K[Add Warning]
I --> L{Can Delete?}
L --> |Yes| M[Must Be Able to Edit]
M --> N{Cannot Edit?}
N --> |Yes| O[Add Warning]
L --> |No| P{Can Edit?}
P --> |Yes| Q[Must Be Able to View]
Q --> R{Cannot View?}
R --> |Yes| S[Add Error]
P --> |No| T{Can Create?}
T --> |Yes| U[Must Be Able to View]
U --> V{Cannot View?}
V --> |Yes| W[Add Error]
A --> X[sanitizePermissions]
X --> Y[Enforce Admin Rules]
Y --> Z[If Administrar = True]
Z --> AA[Set All Other Permissions = True]
X --> AB[Enforce Delete Rules]
AB --> AC[If Excluir = True]
AC --> AD[Set Visualizar = True]
AC --> AE[Set Editar = True]
X --> AF[Enforce Edit Rules]
AF --> AG[If Editar = True]
AG --> AH[Set Visualizar = True]
X --> AI[Enforce Create Rules]
AI --> AJ[If Criar = True]
AJ --> AK[Set Visualizar = True]
```

**Diagram sources**
- [permission-utils.ts](file://src/utils/permission-utils.ts#L27-L146)
- [permission-utils.ts](file://src/utils/permission-utils.ts#L378-L456)

**Section sources**
- [permission-utils.ts](file://src/utils/permission-utils.ts#L27-L146)
- [permission-utils.ts](file://src/utils/permission-utils.ts#L378-L456)

## Permission Presets Management

The permission preset system allows administrators to create, manage, and apply standardized permission configurations.

```mermaid
classDiagram
class PermissionPresetManager {
-customPresets : Map<string, PermissionPreset>
+getDefaultPermissions(role : BarRole) : ModulePermissions
+getRoleConfig(role : BarRole) : RolePermissionConfig
+getAllRoleConfigs() : RoleConfigMap
+getPresetById(presetId : string) : PermissionPreset | null
+getAllPresets() : PermissionPreset[]
+canManageRole(managerRole : BarRole, targetRole : BarRole) : boolean
+validatePermission(userRole : BarRole, module : SystemModule, action : keyof ModulePermission) : PermissionValidationResult
+createUserPermissionContext(userId : string, role : BarRole, customPermissions? : ModulePermissions) : UserPermissionContext
+createCustomPreset(name : string, description : string, baseRole : BarRole, customPermissions : Partial<ModulePermissions>) : PermissionPreset
+updateCustomPreset(presetId : string, updates : Partial<Pick<PermissionPreset, 'name' | 'description' | 'permissions'>>) : PermissionPreset | null
+deleteCustomPreset(presetId : string) : boolean
-mergePermissions(basePermissions : ModulePermissions, customPermissions : Partial<ModulePermissions>) : ModulePermissions
-createPresetFromRole(role : BarRole) : PermissionPreset
+getRequiredModulesForRole(role : BarRole) : SystemModule[]
+getRoleHierarchy(role : BarRole) : number
+getManageableRoles(role : BarRole) : BarRole[]
}
class PermissionPreset {
+id : string
+name : string
+description : string
+role : BarRole
+permissions : ModulePermissions
+isDefault : boolean
+isCustomizable : boolean
+createdAt : string
+updatedAt : string
}
PermissionPresetManager "1" -- "0..*" PermissionPreset : manages
```

**Diagram sources**
- [permission-presets.ts](file://src/services/permission-presets.ts#L1-L564)

**Section sources**
- [permission-presets.ts](file://src/services/permission-presets.ts#L1-L564)

## Real-Time Permission Updates

The system handles permission changes in real-time through a combination of React hooks and context providers.

```mermaid
sequenceDiagram
participant UI as "UI Component"
participant Hook as "usePermissions"
participant Manager as "PermissionPresetManager"
participant Context as "React Context"
participant Cache as "Supabase Cache"
UI->>Hook : Initialize with role
Hook->>Manager : Get default permissions
Manager-->>Hook : Return permissions
Hook->>Context : Set initial state
Context-->>UI : Render with permissions
UI->>Hook : Update permissions
Hook->>Hook : Validate configuration
Hook->>Hook : Sanitize permissions
Hook->>Context : Update state
Context-->>UI : Re-render
Hook->>Cache : Invalidate user cache
Cache-->>Hook : Acknowledge
Note over Hook,Cache : Changes propagate<br/>to all connected clients
```

**Diagram sources**
- [usePermissions.ts](file://src/hooks/usePermissions.ts#L1-L485)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts#L1-L27)

**Section sources**
- [usePermissions.ts](file://src/hooks/usePermissions.ts#L1-L485)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts#L1-L27)

## Performance Considerations and Caching

The permission system incorporates several performance optimizations to ensure efficient operation at scale.

```mermaid
flowchart TD
A[Request] --> B{Authenticated?}
B --> |No| C[Return 401]
B --> |Yes| D[Check Cache]
D --> E{Cached?}
E --> |Yes| F{Expired?}
F --> |No| G[Use Cached Data]
F --> |Yes| H[Fetch Fresh Data]
E --> |No| H
H --> I[Query Supabase]
I --> J[Store in Cache]
J --> K[Return Data]
G --> K
subgraph Cache
direction LR
L[TTL: 5 minutes]
M[Key: user_{id}]
N[Eviction: Every minute]
end
subgraph RateLimiting
O[Rate Limit Map]
P[Key: {userId}_{method}_{path}]
Q[Limits by Role]
R[SUPER_ADMIN: 1000/min]
S[ADMIN: 500/min]
T[MANAGER: 200/min]
U[USER: 100/min]
end
```

**Diagram sources**
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts#L1-L27)

**Section sources**
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts#L1-L27)

## Implementation Examples

### Creating Custom Permission Schemes

```mermaid
flowchart TD
A[Define Requirements] --> B[Identify Modules]
B --> C[Specify Actions]
C --> D[Create Template]
D --> E[Choose Base: read_only, operational, full, custom]
E --> F[Apply to Modules]
F --> G[Validate Configuration]
G --> H[Sanitize Permissions]
H --> I[Test Access]
I --> J[Deploy]
subgraph Example: Limited Cashier
K[Modules: dashboard, gestao_caixa, clientes]
L[Template: operational]
M[Restrictions: No delete in gestao_caixa]
N[Result: READ_WRITE except excluir=false]
end
```

**Section sources**
- [permission-utils.ts](file://src/utils/permission-utils.ts#L348-L376)

### Integrating with Business Logic

```mermaid
sequenceDiagram
participant Component as "Business Component"
participant Guard as "PermissionGuard"
participant Hook as "usePermissionCheck"
participant API as "Backend API"
participant DB as "Database"
Component->>Guard : Wrap sensitive content
Guard->>Hook : Check required permission
Hook->>Hook : Evaluate user permissions
Hook-->>Guard : Return access decision
Guard->>Component : Render or show fallback
Component->>API : Make authorized request
API->>DB : Execute query with RLS
DB-->>API : Return filtered data
API-->>Component : Return result
```

**Diagram sources**
- [PermissionGuard.tsx](file://src/components/Auth/PermissionGuard.tsx#L1-L146)

**Section sources**
- [PermissionGuard.tsx](file://src/components/Auth/PermissionGuard.tsx#L1-L146)

## Auditing and Security

The system includes comprehensive auditing capabilities to track permission changes and access attempts.

```mermaid
flowchart TD
A[Access Attempt] --> B{Authorized?}
B --> |Yes| C[Execute Action]
C --> D[Log Success]
D --> E[Store in logs_auditoria]
B --> |No| F[Deny Access]
F --> G[Log Failure]
G --> H[Include Reason and Details]
H --> I[Store in logs_auditoria]
J[Permission Change] --> K[Validate New Configuration]
K --> L{Valid?}
L --> |Yes| M[Apply Changes]
M --> N[Invalidate Cache]
N --> O[Log Change]
O --> P[Store in logs_auditoria]
L --> |No| Q[Reject Change]
Q --> R[Log Error]
R --> P
```

**Section sources**
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts#L1-L27)