# Role-Based Access Control

<cite>
**Referenced Files in This Document**   
- [ProtectedRoute.tsx](file://src/components/Auth/ProtectedRoute.tsx)
- [PermissionGuard.tsx](file://src/components/Auth/PermissionGuard.tsx)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)
- [permissions.ts](file://src/types/permissions.ts)
- [multitenant.ts](file://src/types/multitenant.ts)
- [useAuthWithHierarchy.ts](file://src/hooks/useAuthWithHierarchy.ts)
- [usePrivilegeCheck.ts](file://src/hooks/usePrivilegeCheck.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Hierarchical Permission Model](#hierarchical-permission-model)
3. [Core Components Overview](#core-components-overview)
4. [ProtectedRoute Implementation](#protectedroute-implementation)
5. [PermissionGuard Components](#permissionguard-components)
6. [Middleware Authorization System](#middleware-authorization-system)
7. [Role Definitions and Inheritance](#role-definitions-and-inheritance)
8. [Custom Role Management](#custom-role-management)
9. [Permission Checking in UI and Services](#permission-checking-in-ui-and-services)
10. [Common Issues and Debugging](#common-issues-and-debugging)
11. [Best Practices for Securing Resources](#best-practices-for-securing-resources)

## Introduction
The AABB-system implements a comprehensive role-based access control (RBAC) system that governs access to application resources based on user roles and privileges. This documentation details the hierarchical permission model, protection components, middleware implementation, and best practices for managing access control within the system. The RBAC framework supports multiple administrative levels including ADMINISTRADOR PRINCIPAL (SUPER_ADMIN), manager, and staff members, with granular permissions across various system modules.

## Hierarchical Permission Model
The system implements a multi-level hierarchical permission model that defines access rights based on user roles and administrative levels. The hierarchy establishes clear boundaries between different privilege tiers, ensuring that higher-level administrators can manage lower-level users while preventing privilege escalation by unauthorized personnel.

```mermaid
graph TD
SA[ADMINISTRADOR PRINCIPAL<br>SUPER_ADMIN] --> |Can manage| A[Administrador<br>ADMIN]
A --> |Can manage| M[Gerente<br>MANAGER]
M --> |Can manage| U[Usuário Comum<br>USER]
style SA fill:#ff6b6b,stroke:#333
style A fill:#ffa500,stroke:#333
style M fill:#4ecdc4,stroke:#333
style U fill:#45b7d1,stroke:#333
subgraph "Privilege Levels"
SA
A
M
U
end
click SA "file://src/types/multitenant.ts#L3-L8" "View Role Definitions"
click A "file://src/types/multitenant.ts#L3-L8" "View Role Definitions"
click M "file://src/types/multitenant.ts#L3-L8" "View Role Definitions"
click U "file://src/types/multitenant.ts#L3-L8" "View Role Definitions"
```

**Diagram sources**
- [multitenant.ts](file://src/types/multitenant.ts#L3-L8)

**Section sources**
- [multitenant.ts](file://src/types/multitenant.ts#L3-L8)
- [admin-hierarchy.ts](file://src/types/admin-hierarchy.ts)

## Core Components Overview
The RBAC system consists of several core components that work together to enforce access restrictions throughout the application. These components include ProtectedRoute for route-level protection, PermissionGuard for component-level protection, and middleware functions for server-side authorization.

```mermaid
classDiagram
class ProtectedRoute {
+children : ReactNode
+requireModule : string
+requireAction : string
+fallback : ReactNode
+loadingComponent : ReactNode
+checkPermissions() : Promise~void~
}
class PermissionGuard {
+children : ReactNode
+module : string
+action : string
+fallback : ReactNode
+hideWhenDenied : boolean
}
class AuthMiddleware {
+loadUserPermissions() : Promise~UserPermissions~
+hasModuleAccess(permissions, module, action) : boolean
+isAdmin(permissions) : boolean
+canManageEmployees(permissions) : boolean
+requireAuth() : Promise~AuthResult~
+requireModulePermission(module, action) : Promise~AuthResult~
}
class AuthorizationMiddleware {
+authenticate(req, res, next) : void
+authorize(options) : MiddlewareFunction
+requireSuperAdmin() : MiddlewareFunction
+requireAdmin() : MiddlewareFunction
+canManageUser(req, res, next) : void
}
ProtectedRoute --> AuthMiddleware : "Uses"
PermissionGuard --> AuthMiddleware : "Uses"
AuthorizationMiddleware --> Supabase : "Integrates"
AuthMiddleware --> Supabase : "Integrates"
```

**Diagram sources**
- [ProtectedRoute.tsx](file://src/components/Auth/ProtectedRoute.tsx)
- [PermissionGuard.tsx](file://src/components/Auth/PermissionGuard.tsx)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)

**Section sources**
- [ProtectedRoute.tsx](file://src/components/Auth/ProtectedRoute.tsx)
- [PermissionGuard.tsx](file://src/components/Auth/PermissionGuard.tsx)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)

## ProtectedRoute Implementation
The ProtectedRoute component serves as the primary mechanism for protecting routes based on user authentication and authorization requirements. It intercepts navigation requests and validates whether the current user has sufficient permissions to access the requested resource.

```mermaid
sequenceDiagram
participant User as "User"
participant Route as "ProtectedRoute"
participant Middleware as "authMiddleware"
participant Supabase as "Supabase Auth"
User->>Route : Navigate to protected route
Route->>Middleware : requireAuth() or requireModulePermission()
Middleware->>Supabase : getUser() - Verify session
Supabase-->>Middleware : Return user data
Middleware->>Supabase : Query usuarios_empresa table
Supabase-->>Middleware : Return user permissions
alt User authenticated
Middleware-->>Route : Success with permissions
Route->>Route : Check module/action permissions
alt Has required permissions
Route-->>User : Render protected content
else Missing permissions
Route-->>User : Show UnauthorizedComponent
end
else User not authenticated
Middleware-->>Route : Authentication failed
Route-->>User : Show UnauthenticatedComponent
end
```

**Diagram sources**
- [ProtectedRoute.tsx](file://src/components/Auth/ProtectedRoute.tsx#L91-L175)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)

**Section sources**
- [ProtectedRoute.tsx](file://src/components/Auth/ProtectedRoute.tsx#L91-L175)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)

## PermissionGuard Components
The system implements multiple PermissionGuard components for fine-grained access control at the component level. These guards allow conditional rendering of UI elements based on user permissions, providing a flexible way to show or hide functionality according to the user's role and privileges.

```mermaid
flowchart TD
Start([PermissionGuard]) --> CheckUser["Check if user exists"]
CheckUser --> |No user| ReturnNull["Return null or fallback"]
CheckUser --> |User exists| CheckAdmin["Check requireAdmin flag"]
CheckAdmin --> |Requires admin| ValidateAdmin["Validate isAdmin(user)"]
ValidateAdmin --> |Not admin| ReturnNull
ValidateAdmin --> |Is admin| CheckPermission["Check specific permission"]
CheckAdmin --> |No admin requirement| CheckPermission
CheckPermission --> |Has permission| RenderChildren["Render children"]
CheckPermission --> |Missing permission| CheckRoles["Check role requirements"]
CheckRoles --> |Has required role| RenderChildren
CheckRoles --> |Missing role| ReturnNull
style Start fill:#f9f,stroke:#333
style RenderChildren fill:#bbf,stroke:#333
style ReturnNull fill:#fbb,stroke:#333
```

**Diagram sources**
- [PermissionGuard.tsx](file://src/components/Auth/PermissionGuard.tsx#L24-L55)
- [permissions/PermissionGuard.tsx](file://src/components/permissions/PermissionGuard.tsx#L120-L153)

**Section sources**
- [PermissionGuard.tsx](file://src/components/Auth/PermissionGuard.tsx#L24-L55)
- [permissions/PermissionGuard.tsx](file://src/components/permissions/PermissionGuard.tsx#L120-L153)
- [utils/auth.ts](file://src/utils/auth.ts#L6-L16)

## Middleware Authorization System
The middleware layer implements server-side authorization that intercepts HTTP requests and validates user permissions before allowing access to protected resources. This two-tiered approach combines client-side protection with robust server-side validation to ensure security even if client-side checks are bypassed.

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant Express as "Express Server"
participant AuthMiddleware as "authenticate()"
participant AuthorizationMiddleware as "authorize()"
participant Supabase as "Supabase Database"
Client->>Express : HTTP Request with Bearer Token
Express->>AuthMiddleware : Execute authenticate middleware
AuthMiddleware->>Supabase : Verify JWT token
Supabase-->>AuthMiddleware : Return user data
AuthMiddleware->>Supabase : Query usuarios_empresa for papel and privilegios
Supabase-->>AuthMiddleware : Return user role and privileges
AuthMiddleware->>Express : Attach user to request object
Express->>AuthorizationMiddleware : Execute authorize middleware
AuthorizationMiddleware->>AuthorizationMiddleware : Check requiredRole
AuthorizationMiddleware->>AuthorizationMiddleware : Check requiredPrivilege
alt Sufficient privileges
AuthorizationMiddleware-->>Express : Proceed to route handler
Express-->>Client : Return requested resource
else Insufficient privileges
AuthorizationMiddleware-->>Client : Return 403 Forbidden
end
```

**Diagram sources**
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)

**Section sources**
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)

## Role Definitions and Inheritance
The system defines a clear hierarchy of roles with specific permissions and inheritance rules. Each role has defined capabilities and limitations, with higher-level roles inheriting the permissions of lower-level roles while adding additional administrative capabilities.

```mermaid
erDiagram
ROLE ||--o{ PERMISSION : has
ROLE {
string id PK
string name
string description
number hierarchy
boolean isDefault
}
PERMISSION ||--o{ MODULE : applies_to
PERMISSION {
uuid id PK
string action
boolean value
}
MODULE {
string id PK
string name
string category
}
USER ||--o{ ROLE : assigned
USER {
uuid id PK
string email
string status
}
USER ||--o{ CUSTOM_PERMISSION : overrides
CUSTOM_PERMISSION {
uuid id PK
string module
string action
boolean value
}
class ROLE {
SUPER_ADMIN
ADMIN
MANAGER
USER
}
class MODULE {
dashboard
monitor_bar
atendimento_bar
monitor_cozinha
gestao_caixa
clientes
funcionarios
relatorios
configuracoes
}
```

**Diagram sources**
- [permissions.ts](file://src/types/permissions.ts)
- [multitenant.ts](file://src/types/multitenant.ts)
- [admin-hierarchy.ts](file://src/types/admin-hierarchy.ts)

**Section sources**
- [permissions.ts](file://src/types/permissions.ts)
- [multitenant.ts](file://src/types/multitenant.ts#L72-L81)
- [admin-hierarchy.ts](file://src/types/admin-hierarchy.ts)

## Custom Role Management
The system allows for custom role configuration through the RoleEditor component and associated services. Administrators can define custom permission sets for specific roles, modify existing permissions, and assign these configurations to users within their management hierarchy.

```mermaid
flowchart LR
A[Role Editor Interface] --> B[Load Default Permissions]
B --> C[Modify Module Permissions]
C --> D[Set Action Rights<br>(visualizar, criar, editar, excluir, administrar)]
D --> E[Save Custom Permissions]
E --> F[Store in permissoes_usuario Table]
F --> G[Apply During Session Loading]
G --> H[Enforce via authMiddleware]
subgraph "Database Storage"
I[usuarios_empresa] < --> J[permissoes_usuario]
J --> K[ModuloSistema]
J --> L[PermissaoModulo]
end
A --> I
H --> I
```

**Diagram sources**
- [RoleEditor.tsx](file://src/components/Admin/RoleEditor.tsx)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts#L215-L250)
- [types/permissions.ts](file://src/types/permissions.ts)

**Section sources**
- [RoleEditor.tsx](file://src/components/Admin/RoleEditor.tsx)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts#L215-L250)
- [types/permissions.ts](file://src/types/permissions.ts)

## Permission Checking in UI and Services
Permission checks are implemented consistently across both UI components and service layers, ensuring uniform access control throughout the application. The system provides hooks and utility functions that simplify permission verification in various contexts.

```mermaid
flowchart TB
subgraph "UI Layer"
A[React Components] --> B[usePrivilegeCheck Hook]
B --> C[PermissionGuard Components]
C --> D[Conditional Rendering]
end
subgraph "Service Layer"
E[API Endpoints] --> F[authorizationMiddleware]
F --> G[Role-Based Validation]
G --> H[Database Operations]
end
subgraph "Shared Logic"
I[useAuthWithHierarchy] --> J[Hierarchical Checks]
J --> K[PapelUsuario Hierarchy]
K --> L[RESTRICOES_CRIACAO_USUARIO]
end
A --> I
E --> I
I --> M[Supabase RLS Policies]
style UI Layer fill:#f0f8ff,stroke:#333
style Service Layer fill:#fff8f0,stroke:#333
style Shared Logic fill:#f0fff0,stroke:#333
```

**Diagram sources**
- [usePrivilegeCheck.ts](file://src/hooks/usePrivilegeCheck.ts)
- [useAuthWithHierarchy.ts](file://src/hooks/useAuthWithHierarchy.ts)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)

**Section sources**
- [usePrivilegeCheck.ts](file://src/hooks/usePrivilegeCheck.ts)
- [useAuthWithHierarchy.ts](file://src/hooks/useAuthWithHierarchy.ts#L29-L157)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)

## Common Issues and Debugging
Several common issues may arise when working with the RBAC system, particularly around permission inheritance, role conflicts, and access denials. Understanding these patterns helps in troubleshooting and maintaining proper access control.

### Permission Inheritance Challenges
When implementing hierarchical permissions, ensure that:
- Higher-level roles properly inherit permissions from lower levels
- Custom permissions correctly override default role permissions
- The hierarchy prevents privilege escalation attempts

### Role Conflict Resolution
The system handles role conflicts through:
- Clear precedence rules (SUPER_ADMIN > ADMIN > MANAGER > USER)
- Validation during user creation and role assignment
- Real-time permission recalculation when roles change

### Debugging Access Denials
To diagnose access denial issues:
1. Check the user's current role and permissions
2. Verify the required module and action permissions
3. Examine middleware logs for authentication flow
4. Use the PermissionDebug component in development mode

```mermaid
flowchart TD
A[Access Denied] --> B{Check User Status}
B --> |Inactive| C[Activate User Account]
B --> |Active| D{Check Authentication}
D --> |Not Authenticated| E[Verify Session Token]
D --> |Authenticated| F{Check Role Hierarchy}
F --> |Insufficient Role| G[Elevate User Role]
F --> |Sufficient Role| H{Check Module Permissions}
H --> |Missing Permission| I[Grant Required Permission]
H --> |Has Permission| J{Check Action Level}
J --> |Insufficient Action| K[Grant Required Action]
J --> |Sufficient Action| L[Access Granted]
```

**Section sources**
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)
- [useAuthWithHierarchy.ts](file://src/hooks/useAuthWithHierarchy.ts)

## Best Practices for Securing Resources
Implementing effective role-based access control requires adherence to security best practices to protect sensitive routes and data within the application.

### Secure Sensitive Routes
- Always use ProtectedRoute for administrative endpoints
- Implement server-side validation even when client-side checks exist
- Use specific permission requirements rather than broad role checks
- Log all access attempts to sensitive resources

### Protect Data Access
- Implement Row Level Security (RLS) policies in Supabase
- Validate user permissions before returning data
- Use parameterized queries to prevent injection attacks
- Limit data exposure to only what's necessary for the user's role

### Manage Role Transitions
- Implement approval workflows for role elevation
- Maintain audit logs of all role changes
- Enforce mandatory re-authentication for privilege escalation
- Implement time-limited elevated privileges when appropriate

### Performance Considerations
- Cache permission checks when possible
- Use efficient database queries for permission lookup
- Minimize redundant permission validation
- Implement lazy loading for complex permission hierarchies

**Section sources**
- [authorizationMiddleware.ts](file://src/middleware/authorizationMiddleware.ts)
- [authMiddleware.ts](file://src/middleware/authMiddleware.ts)
- [supabase/migrations](file://supabase/migrations)
- [services/authorization-middleware.ts](file://src/services/authorization-middleware.ts)