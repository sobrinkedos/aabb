# UI Permission Editor Component

<cite>
**Referenced Files in This Document**   
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx)
- [useEmployeePermissions.ts](file://src/hooks/useEmployeePermissions.ts)
- [permissionPresets.ts](file://src/utils/permissionPresets.ts)
- [employee.types.ts](file://src/types/employee.types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Implementation with React Hooks](#core-implementation-with-react-hooks)
3. [State Management for Expanded Modules](#state-management-for-expanded-modules)
4. [Visual Feedback Mechanisms](#visual-feedback-mechanisms)
5. [Integration with useEmployeePermissions Hook](#integration-with-useemployeeparamissions-hook)
6. [Role-Based Interface Adaptation](#role-based-interface-adaptation)
7. [Customization Warnings and Reset Functionality](#customization-warnings-and-reset-functionality)
8. [Accessibility Considerations](#accessibility-considerations)
9. [Responsive Layout Behavior](#responsive-layout-behavior)
10. [Performance Optimization Techniques](#performance-optimization-techniques)

## Introduction
The PermissionsSection component is a critical UI element within the AABB-system's employee management interface, designed to provide an intuitive and comprehensive permission configuration experience. This component enables administrators to manage employee access rights across various system modules including bar operations, kitchen management, cashier functions, reporting, inventory, customer management, settings, and mobile app access. The implementation leverages modern React patterns with a focus on usability, visual feedback, and performance optimization.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L12-L278)

## Core Implementation with React Hooks
The PermissionsSection component is implemented as a functional React component using TypeScript, leveraging several React hooks to manage state and side effects. The primary hook used is `useState` for managing the expanded state of permission modules, while the custom `useEmployeePermissions` hook provides access to permission persistence logic. The component receives employee data and callback functions as props, enabling it to display current permission status and handle toggle events appropriately.

The implementation follows a controlled component pattern where all state changes are managed through React's state mechanism. When a user interacts with the permission toggles, the `onTogglePermission` callback is invoked, allowing parent components to handle the state update logic. This separation of concerns ensures that the PermissionsSection remains focused on presentation while delegating business logic to higher-level components.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L12-L278)

## State Management for Expanded Modules
The component manages the expansion state of permission modules using a `Set<string>` stored in React's `useState` hook. By default, the 'app-garcom' module is expanded to prioritize mobile access configuration. The `toggleModule` function handles the expansion/collapse behavior by creating a new Set instance, modifying it based on the current state, and updating the component state.

This approach using a Set ensures O(1) lookup performance when determining whether a module should be displayed in its expanded state. The use of immutable patterns (creating a new Set rather than modifying the existing one) aligns with React best practices and ensures proper re-rendering when the state changes. Each module's header is clickable, providing a clear visual cue for expandable content and enhancing the user experience.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L18-L34)

## Visual Feedback Mechanisms
The component employs multiple visual feedback mechanisms to enhance user understanding and interaction. Color-coded module groups provide immediate visual categorization, with each module assigned a distinct background and border color (e.g., amber for bar operations, green for cashier functions). These colors create a consistent visual language throughout the interface.

Percentage indicators display the proportion of active permissions within each module, calculated as `(activePermissions / totalPermissions) * 100`. This quantitative feedback helps administrators quickly assess the scope of permissions granted. Additionally, emoji icons represent different modules (🍺 for bar, 🍳 for kitchen, 💰 for cashier), providing intuitive visual cues that transcend language barriers.

When permissions are toggled, the UI provides immediate visual feedback through background color changes, borders, and shadow effects. Active permissions display a blue background with a border and subtle shadow, while inactive permissions show a light gray background with hover effects, creating a clear distinction between enabled and disabled states.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L150-L188)
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L216-L248)

## Integration with useEmployeePermissions Hook
The PermissionsSection component integrates with the `useEmployeePermissions` custom hook to manage permission persistence and customization tracking. This hook provides two key functions: `hasCustomPermissions` and `resetToDefaultPermissions`. The former determines whether an employee has customized permissions beyond their role preset, while the latter allows resetting to default role-based permissions.

The hook itself uses localStorage to persist custom permission configurations, ensuring that modifications survive page refreshes. It maintains a dictionary of employee IDs to their custom permission sets, loading from and saving to localStorage as needed. This client-side persistence approach reduces server load while maintaining user preferences across sessions.

The integration is seamless, with the PermissionsSection using the hook's return values to conditionally render UI elements such as the "Customized" badge and "Reset" button when appropriate, creating a cohesive user experience.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L15-L16)
- [useEmployeePermissions.ts](file://src/hooks/useEmployeePermissions.ts#L7-L59)

## Role-Based Interface Adaptation
The interface dynamically adapts based on the selected employee role, displaying only relevant permissions according to predefined role presets. When no role is selected, the component shows a placeholder state prompting the user to select a role. Once a role is chosen, the available permissions are retrieved from the `ROLE_PRESETS` object, which maps each role to its default permission set.

Different roles trigger specific UI adaptations. For example, when a "waiter" role is selected, additional information about mobile app access appears, highlighting features like table management, order processing, and device limitations. The component also displays role-specific permission summaries, showing how many permissions are active out of the total available for that role.

This role-based adaptation ensures that administrators cannot assign irrelevant or inappropriate permissions, maintaining system security while simplifying the configuration process.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L60-L72)
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L249-L267)
- [permissionPresets.ts](file://src/utils/permissionPresets.ts#L10-L83)

## Customization Warnings and Reset Functionality
The component includes explicit warnings and controls for managing customized permissions. When an employee has permissions that deviate from their role preset, a prominent "Customizado" (Customized) badge appears alongside the section title. This visual indicator alerts administrators that the employee's permissions have been modified from the default configuration.

A dedicated "Resetar" (Reset) button allows administrators to revert to the default role-based permissions. This action triggers a confirmation dialog to prevent accidental resets, ensuring data integrity. The reset functionality not only removes the custom permission entry from localStorage but also provides user feedback through an alert message instructing them to reopen the modal to see the changes.

Additionally, a yellow informational banner explains that permissions are initially applied automatically based on the selected role and can be customized as needed, setting clear expectations for administrators.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L106-L142)
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L133-L142)

## Accessibility Considerations
The component incorporates several accessibility features to ensure usability for all users. Interactive elements are properly labeled and have appropriate cursor styles, with clickable areas clearly indicated. The use of semantic HTML elements and ARIA attributes enhances screen reader compatibility.

Keyboard navigation is supported through standard tabbing behavior, allowing users to navigate between permission toggles without requiring a mouse. Visual feedback for focus states is provided through border and background color changes, ensuring that keyboard users can easily track their position within the interface.

Color contrast meets WCAG guidelines, with sufficient contrast between text and background colors. Iconography is supplemented with text labels, ensuring that meaning is conveyed even if images fail to load or are not visible to certain users. The hierarchical organization of content with proper heading levels (h3, h4) creates a logical document structure that assists assistive technologies.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L12-L278)

## Responsive Layout Behavior
The PermissionsSection implements responsive design principles to ensure optimal viewing across devices. On larger screens, permission items within expanded modules are displayed in a two-column grid layout using Tailwind CSS's responsive classes (`grid-cols-1 md:grid-cols-2`). This maximizes screen real estate utilization while maintaining readability.

On smaller devices, the layout collapses to a single column, preventing content from becoming too cramped. The component's overall width adapts to its container, integrating seamlessly with the modal interface in which it's typically embedded. Typography scales appropriately, with font sizes and spacing adjusted for different viewport sizes.

Interactive elements maintain adequate touch targets, with sufficient padding around clickable areas to accommodate finger tapping on mobile devices. The expandable nature of modules helps conserve vertical space on smaller screens, allowing users to focus on one permission category at a time.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L224-L225)

## Performance Optimization Techniques
The component employs several performance optimization techniques to handle large permission sets efficiently. The use of React's `useCallback` hook in the parent components (via the custom hook) prevents unnecessary re-renders by memoizing callback functions. The component itself avoids inline function definitions in JSX, which could trigger excessive re-renders.

Permission grouping is performed once during rendering using the `groupPermissionsByModule` function, rather than repeatedly during iteration. The component leverages React's reconciliation algorithm by providing stable keys (permission IDs) for list items, allowing efficient DOM updates when permissions change.

The implementation minimizes expensive operations within render methods, with calculations like active permission counts and percentage completion performed inline but efficiently. The use of pure functional components and avoidance of unnecessary state updates contributes to smooth performance even with complex permission configurations.

**Section sources**
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L74-L87)
- [PermissionsSection.tsx](file://src/components/EmployeeModal/PermissionsSection.tsx#L188-L192)