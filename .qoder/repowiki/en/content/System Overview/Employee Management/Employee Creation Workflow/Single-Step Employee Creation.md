# Single-Step Employee Creation

<cite>
**Referenced Files in This Document**   
- [ValidatedEmployeeModal.tsx](file://src/components/EmployeeModal/ValidatedEmployeeModal.tsx)
- [useFormValidation.ts](file://src/hooks/useFormValidation.ts)
- [validation.ts](file://src/utils/validation.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Form Initialization with Initial Data](#form-initialization-with-initial-data)
3. [Real-Time Validation System](#real-time-validation-system)
4. [Tabbed Interface Structure](#tabbed-interface-structure)
5. [State Management with formState](#state-management-with-formstate)
6. [Field-Level Validation Examples](#field-level-validation-examples)
7. [Error Handling in UI](#error-handling-in-ui)
8. [Save Flow and Form Submission](#save-flow-and-form-submission)
9. [System Access and Permission Display](#system-access-and-permission-display)

## Introduction
The ValidatedEmployeeModal component implements a single-step employee creation process that combines form initialization, real-time validation, and state management into a cohesive user experience. This documentation details the implementation of the modal interface that allows administrators to create or edit employee records with immediate feedback and validation. The system uses a tabbed interface to organize information across personal, role, and system access dimensions, with dynamic permission summaries based on the selected employee role.

## Form Initialization with Initial Data
The ValidatedEmployeeModal initializes its form state using the `initialData` parameter derived from the employee prop. When editing an existing employee, the component extracts relevant fields from either the employee object or usuario_empresa nested object, mapping them to the appropriate form fields. For new employee creation, the form starts with empty values. The initialization occurs through the useFormValidation hook which accepts this initialData object and sets up the form state accordingly. This approach ensures that both creation and editing workflows use the same validation and state management infrastructure while properly pre-populating data when editing existing records.

**Section sources**
- [ValidatedEmployeeModal.tsx](file://src/components/EmployeeModal/ValidatedEmployeeModal.tsx#L50-L85)

## Real-Time Validation System
The employee creation form implements real-time validation through the useFormValidation hook, which provides change-based validation with debounce functionality. Each field is validated as the user types, with validation checks delayed by 300 milliseconds to prevent excessive processing during rapid input. The validation system distinguishes between different trigger conditions: validateOnChange performs validation during input changes, while validateOnBlur triggers validation when a field loses focus. The debounce mechanism prevents performance issues by limiting how frequently validation occurs during continuous typing, ensuring a smooth user experience while maintaining data integrity.

**Section sources**
- [useFormValidation.ts](file://src/hooks/useFormValidation.ts#L50-L150)

## Tabbed Interface Structure
The ValidatedEmployeeModal employs a three-tab interface structure that organizes employee information into logical categories: personal, role, and system. The personal tab contains basic identification information including name, email, phone, and CPF. The role tab manages job-specific details such as position, shift preference, specialties, and commission rate. The system tab controls digital access permissions and displays role-based permission summaries. Users can navigate between these tabs using clearly labeled navigation buttons with iconography, allowing focused data entry within each category while maintaining context of the overall employee profile.

**Section sources**
- [ValidatedEmployeeModal.tsx](file://src/components/EmployeeModal/ValidatedEmployeeModal.tsx#L200-L350)

## State Management with formState
The form utilizes comprehensive state management through the formState object returned by the useFormValidation hook. This state tracks not only field values but also validation status, error messages, and interaction metadata such as whether fields have been touched by the user. The state includes properties for isValid (overall form validity), isValidating (current validation status), hasErrors, and hasWarnings. Field-specific state maintains values, errors, warnings, and isValidating flags, enabling granular control over the user interface. This rich state model supports conditional rendering of validation indicators and enables sophisticated form behavior based on user interactions.

**Section sources**
- [useFormValidation.ts](file://src/hooks/useFormValidation.ts#L30-L40)

## Field-Level Validation Examples
The validation system implements specific rules for different field types. The nome_completo (full name) field requires non-empty input with the validateRequired function. Email validation checks both format correctness using a regex pattern and uniqueness against existing system emails. CPF validation performs Brazilian CPF number verification including digit calculation and format checking. Phone validation confirms proper Brazilian phone number structure with valid DDD codes. The bar_role field requires selection from predefined options and is marked as required. Commission rate validation ensures values fall between 0-100% and generates warnings for rates above 50%.

**Section sources**
- [validation.ts](file://src/utils/validation.ts#L100-L300)

## Error Handling in UI
The user interface provides comprehensive error handling through multiple visual mechanisms. Field-level errors appear below the respective input when the field has been touched, preventing premature error display during initial typing. A validation summary section at the top of the modal displays all current errors and warnings when present, with distinct styling for each type. The save button is disabled when the form is invalid or currently validating, preventing submission of incomplete data. During validation, a spinning indicator shows processing status, and after submission, any server errors are displayed prominently in the error summary area.

**Section sources**
- [ValidatedEmployeeModal.tsx](file://src/components/EmployeeModal/ValidatedEmployeeModal.tsx#L150-L190)

## Save Flow and Form Submission
The save flow begins with complete form validation triggered by the handleSave function. This process first calls validateForm to perform comprehensive validation across all fields, marking all fields as touched to ensure full validation coverage. If validation passes, getFormData extracts the current form values into a structured object suitable for backend submission. The onSave callback receives this prepared formData and handles the actual API call to persist the employee record. During saving, the interface displays a loading spinner and disables interactive elements to prevent duplicate submissions. On success, the modal closes; on failure, error messages are displayed to guide user correction.

**Section sources**
- [ValidatedEmployeeModal.tsx](file://src/components/EmployeeModal/ValidatedEmployeeModal.tsx#L120-L150)

## System Access and Permission Display
The system access toggle dynamically controls the display of role-based permission summaries. When tem_acesso_sistema is enabled, the interface reveals a detailed breakdown of permissions associated with the selected bar_role. Managers receive "complete access to all modules" including employee management and reporting capabilities. Attendants and waiters are granted "order management and customer service" permissions with basic dashboard access. Kitchen staff (cooks and bartenders) receive workflow-specific permissions focused on order monitoring and preparation. These permission summaries are conditionally rendered based on the current bar_role value, providing transparency about the access level being granted to the new employee.

**Section sources**
- [ValidatedEmployeeModal.tsx](file://src/components/EmployeeModal/ValidatedEmployeeModal.tsx#L350-L400)