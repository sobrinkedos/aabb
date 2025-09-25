# Kitchen Module

<cite>
**Referenced Files in This Document**   
- [KitchenOrders.tsx](file://src/pages/Kitchen/KitchenOrders.tsx)
- [AppContext.tsx](file://src/contexts/AppContext.tsx)
- [command-manager.ts](file://src/services/command-manager.ts)
</cite>

## Table of Contents
1. [Order Display and Priority Indicators](#order-display-and-priority-indicators)
2. [Estimated Preparation Time Calculation](#estimated-preparation-time-calculation)
3. [Order Status Updates with Interactive Buttons](#order-status-updates-with-interactive-buttons)
4. [State Management with React Hooks](#state-management-with-react-hooks)
5. [Integration with AppContext for Order Updates](#integration-with-appcontext-for-order-updates)
6. [Order Type Differentiation: Balcao vs Comanda](#order-type-differentiation-balcao-vs-comanda)
7. [Relationship with Bar Module through Shared Data](#relationship-with-bar-module-through-shared-data)
8. [Handling Concurrent Status Updates and Loading States](#handling-concurrent-status-updates-and-loading-states)

## Order Display and Priority Indicators

The Kitchen Orders component displays all pending kitchen orders with visual priority indicators based on wait time. Orders are grouped by table number, allowing staff to identify tables with multiple orders that require special attention. Each order card is color-coded according to its priority level: red for high priority (waiting over 20 minutes), yellow for medium priority (waiting over 10 minutes), and green for low priority.

The component includes a filtering system that allows kitchen staff to focus on specific tables by clicking on the "Mesas com Múltiplos Pedidos" summary. This filtering capability helps manage workflow in high-pressure environments by reducing visual clutter and focusing attention on critical areas.

Each order displays key information including table number, order timestamp, items ordered with quantities, preparation times per item, any special notes, and the calculated estimated preparation time. The interface also shows the last four characters of the order ID as a unique identifier for quick reference.

**Section sources**
- [KitchenOrders.tsx](file://src/pages/Kitchen/KitchenOrders.tsx#L14-L321)

## Estimated Preparation Time Calculation

The estimated preparation time for each order is calculated dynamically based on the preparation_time property of each menu item in the order. The `getEstimatedTime` function iterates through all items in an order, retrieves the preparation time from either the menu item configuration or direct item data, and sums these values to produce a total estimated preparation time displayed in minutes.

This calculation occurs client-side within the KitchenOrders component, ensuring immediate feedback when orders are displayed. The system attempts to retrieve preparation time from multiple possible property names (`preparation_time` or `preparationTime`) to accommodate potential inconsistencies in data structure.

For menu items that are marked as "direct" inventory items (items taken directly from stock rather than prepared), the preparation time may be minimal or zero, reflecting their immediate availability. This distinction ensures that only items requiring actual kitchen preparation contribute significantly to the estimated time.

**Section sources**
- [KitchenOrders.tsx](file://src/pages/Kitchen/KitchenOrders.tsx#L59-L70)

## Order Status Updates with Interactive Buttons

The Kitchen Module provides interactive buttons that allow kitchen staff to update the status of orders through a three-stage workflow: "Iniciar Preparo" (Start Preparation), "Marcar como Pronto" (Mark as Ready), and "Pronto para Entrega" (Ready for Delivery). These buttons appear conditionally based on the current status of each order, guiding staff through the proper sequence of operations.

When a button is clicked, the system initiates a status update process that includes visual feedback to confirm the action. During the update process, buttons display a loading spinner animation and are disabled to prevent duplicate submissions. This loading state lasts for approximately one second after the successful update, providing clear visual confirmation of the status change.

The "Pronto para Entrega" state is displayed as a non-interactive element with a pulsing animation and checkmark icon, indicating that the order has been completed and is awaiting delivery to the customer. This design prevents accidental reprocessing of completed orders while maintaining visibility in the order queue.

**Section sources**
- [KitchenOrders.tsx](file://src/pages/Kitchen/KitchenOrders.tsx#L170-L274)

## State Management with React Hooks

The Kitchen Orders component utilizes React's useState hook to manage two critical pieces of local state: `updatingOrders` and `tableFilter`. The `updatingOrders` state is implemented as a Set<string> that tracks which orders are currently undergoing status updates. This approach enables efficient lookups to determine whether to display loading states on specific order cards.

The `tableFilter` state manages the current table filtering selection, with an initial value of 'all' to display all orders. When users click on a specific table in the "Mesas com Múltiplos Pedidos" summary, this filter updates to show only orders for that table, helping kitchen staff focus on specific areas during peak times.

These state variables work together with the component's props (orders and menuItems) to create a responsive interface that adapts to both real-time data changes and user interactions. The filteredOrders variable applies the table filter to the complete orders list, ensuring that only relevant orders are rendered in the UI.

**Section sources**
- [KitchenOrders.tsx](file://src/pages/Kitchen/KitchenOrders.tsx#L16-L20)

## Integration with AppContext for Order Updates

The Kitchen Module integrates with the global AppContext to facilitate order updates across the application. By importing the `useApp` hook from AppContext, the component gains access to the `updateOrderStatus` function, which serves as the primary interface for modifying order states in the backend system.

When a kitchen staff member updates an order status, the `handleStatusUpdate` function calls `updateOrderStatus` with the order ID and new status. This function handles both comanda (tab) orders and balcao (counter) orders through a unified interface, abstracting away the different data models and storage mechanisms used for each order type.

The AppContext implementation includes sophisticated logic for handling different order types, with special processing for comanda orders that involves the CommandManager service. For balcao orders, the system updates the corresponding record in the balcao_orders table. After successful updates, the context automatically refreshes both kitchen and bar order lists to ensure consistency across modules.

**Section sources**
- [KitchenOrders.tsx](file://src/pages/Kitchen/KitchenOrders.tsx#L15)
- [AppContext.tsx](file://src/contexts/AppContext.tsx#L139-L1163)

## Order Type Differentiation: Balcao vs Comanda

The Kitchen Module clearly distinguishes between two types of orders: balcao (counter) orders and comanda (tab) orders. This differentiation is visually represented through distinct badges on each order card. Balcao orders display a green "✓ PAGO" badge with a pulsing animation, indicating that payment has already been received. Comanda orders show a yellow "AGUARDA PAGTO" badge, signaling that payment will be processed later.

This visual distinction is implemented through the `isBalcaoOrder` and `isComandaOrder` helper functions, which examine the order ID prefix to determine the order type. The component uses these functions to conditionally render the appropriate payment status badge, providing immediate visual feedback about the financial status of each order.

The differentiation extends beyond visual presentation to include different processing workflows. Balcao orders represent immediate transactions where customers have already paid, while comanda orders are associated with tables or customers who will settle their bill at a later time. This distinction affects how orders are managed in the kitchen and how they integrate with other parts of the restaurant management system.

**Section sources**
- [KitchenOrders.tsx](file://src/pages/Kitchen/KitchenOrders.tsx#L130-L144)

## Relationship with Bar Module through Shared Data

The Kitchen Module maintains a close relationship with the Bar Module through shared data and synchronized order processing. Both modules consume order data from the same underlying data sources but filter and present it according to their specific operational needs. The Bar Module displays all drink and food orders, while the Kitchen Module focuses specifically on food items that require preparation.

Both modules rely on the same AppContext provider for accessing and updating order information, ensuring data consistency across the application. When an order status is updated in the Kitchen Module, these changes are immediately reflected in the Bar Module through real-time subscriptions to database changes.

The shared data model allows for coordinated workflow between kitchen and bar staff. For example, when a drink order is marked as ready in the Bar Module, this status change is visible to kitchen staff if they need to coordinate plating of food and drinks. Similarly, complex orders that involve both food and beverage preparation can be tracked holistically across both modules.

Real-time synchronization is achieved through Supabase's PostgreSQL Change Data Capture (CDC) functionality, which pushes updates to all connected clients whenever order data changes in the database. This ensures that both kitchen and bar staff are working with the most current information, reducing errors and improving service coordination.

**Section sources**
- [AppContext.tsx](file://src/contexts/AppContext.tsx#L139-L1163)

## Handling Concurrent Status Updates and Loading States

The Kitchen Module implements robust mechanisms to handle concurrent status updates and provide clear visual feedback through loading states. The `updatingOrders` Set tracks which orders are currently being processed, preventing multiple simultaneous updates to the same order. When a status update is initiated, the order ID is added to this set, disabling the action buttons and displaying a loading spinner.

To prevent race conditions and ensure data integrity, the system implements a one-second cooldown period after each successful update. During this time, the loading state persists even though the update has completed, giving staff clear confirmation that their action was registered. This delay helps prevent accidental double-clicks in fast-paced kitchen environments.

Error handling is implemented through try-catch blocks around the update operation, with console logging to aid in debugging. If an update fails, the error is logged but the loading state is still cleared after the timeout period, allowing staff to retry the operation.

The system also handles the complexity of updating multiple related records when processing comanda orders. Through the CommandManager service, it ensures that updates to individual comanda items are properly synchronized with the overall order status, maintaining data consistency even when multiple staff members are working on different aspects of the same order.

**Section sources**
- [KitchenOrders.tsx](file://src/pages/Kitchen/KitchenOrders.tsx#L146-L168)
- [command-manager.ts](file://src/services/command-manager.ts#L20-L619)