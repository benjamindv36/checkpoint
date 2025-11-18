# Specification: ReactFlow Canvas View

## Goal
Create an interactive node-based canvas using ReactFlow where items appear as draggable nodes with visual connections representing relationships, enabling spatial visualization of waypoints and manual connection management through Ctrl+Click interactions.

## User Stories
- As a visual thinker, I want to see my waypoints laid out spatially on a canvas so that I can understand relationships at a glance
- As a user organizing my journey, I want to manually position nodes and create connections with Ctrl+Click so that I can arrange my waypoint map meaningfully

## Specific Requirements

**Custom ReactFlow Node Components**
- Create three distinct node component types: DirectionNode, WaypointNode, and StepNode
- Display item text prominently on each node with appropriate truncation for long text
- Render a visual type indicator (icon or label) to distinguish node types at a glance
- Show progress circle behind or around text representing completion status (filled when completed, empty when not)
- Display points value inside or near the progress circle (100/25/5 based on type)
- Apply type-specific styling: purple/bold for Direction, blue for Waypoint, default for Step
- Ensure nodes are visually distinct and easily scannable at different zoom levels

**Edge Rendering for Relationships**
- Render edges for parent-child relationships using hierarchical connection logic from parent_id field
- Render edges for manual connections (from future manual connection system or auto-linking)
- Use different edge styles to visually distinguish parent-child vs manual connections (e.g., solid vs dashed lines)
- Apply appropriate edge colors and thickness for visual clarity
- Handle edge routing to avoid overlap when possible using ReactFlow's built-in routing

**Manual Node Positioning System**
- Enable drag-and-drop repositioning of nodes on the canvas with smooth interaction
- Store node positions (x, y coordinates) in localStorage using key 'waypoint:node_positions' as a map of itemId to {x, y}
- Load positions on canvas mount and apply to ReactFlow nodes
- Persist position updates to localStorage on drag end event
- Handle new items by assigning default positions (e.g., grid layout or near parent node)

**Auto-Layout Button**
- Add a button in the canvas toolbar to trigger automatic layout arrangement
- Implement left-to-right hierarchical layout algorithm using ReactFlow's layout utilities or a custom solution
- Position Direction nodes on the left, Waypoints in the middle, Steps on the right based on hierarchy depth
- Apply consistent spacing between nodes (e.g., 200px horizontal, 100px vertical)
- Save the computed layout positions to localStorage after auto-layout completes

**Node Selection and Ctrl+Click Connection**
- Implement single-click node selection with visual feedback (border highlight or shadow)
- Track currently selected node ID in component state
- Handle Ctrl+Click on another node to create a connection between selected and clicked nodes
- Store manual connections in localStorage using key 'waypoint:manual_connections' as array of {sourceId, targetId}
- Add new connection to ReactFlow edges array immediately after Ctrl+Click
- Deselect node after connection creation or when clicking on canvas background

**Canvas Controls and Navigation**
- Enable ReactFlow's built-in pan and zoom controls for canvas navigation
- Add zoom in/out buttons in toolbar for accessibility
- Add fit-view button to center and scale canvas to show all nodes
- Ensure smooth pan gestures (mouse drag, trackpad) without interference with node dragging
- Set reasonable zoom limits (e.g., 0.25x to 2x) to prevent extreme scaling

**Data Synchronization**
- Use React state or custom hook to manage items data fetched from localStorage
- Subscribe to localStorage changes using 'storage' event listener for cross-tab sync
- Implement polling or event-based refresh to detect when items are added/updated/deleted in outline view
- Re-fetch items and rebuild node/edge arrays when underlying data changes
- Optimize re-rendering to avoid full canvas rebuild on minor updates (use React.memo or key-based optimization)

**Performance Optimization**
- Lazy load node components to reduce initial bundle size
- Use ReactFlow's viewport optimization to only render visible nodes during pan/zoom
- Debounce position updates to localStorage during drag to reduce write frequency
- Target smooth 60fps interaction during drag, pan, and zoom operations

## Visual Design

No visual assets provided. Follow these design guidelines:

**General Canvas Layout**
- Full-width canvas area filling the page below the header
- Light background (white/gray) with subtle grid pattern for spatial reference
- Toolbar positioned at top-right or bottom-left corner with semi-transparent background

**Node Styling**
- Direction nodes: Large rectangular shape, purple border (stroke-purple-600), bold text, white background
- Waypoint nodes: Medium rectangular shape, blue border (stroke-blue-500), normal weight text, white background
- Step nodes: Small rectangular shape, gray border (stroke-zinc-400), normal weight text, white background
- Progress circle: Positioned behind text as background element, filled percentage based on completion
- Selected node: Add shadow-lg and border-2 for selection highlight

**Edge Styling**
- Parent-child edges: Solid gray lines (stroke-zinc-300) with smooth bezier curves
- Manual connection edges: Dashed blue lines (stroke-blue-400 stroke-dasharray-4) with straight lines or step curves
- Hover edges: Increase stroke width and opacity for interactive feedback

## Existing Code to Leverage

**localStorage CRUD operations from src/lib/data/items.ts**
- Use getActiveItems() to fetch all non-deleted items for canvas rendering
- Use getItemsByParentId() to query child relationships for edge connections
- Use updateItem() if implementing inline editing on canvas in future
- Use createItem() / deleteItem() if adding canvas-based item creation later (currently out of scope)

**Item type definitions from src/types/database.ts**
- ItemRow type provides all necessary fields: id, text, type, parent_id, completed, points
- Item type includes optional children array and linkedInstances for auto-linking metadata
- DEFAULT_POINTS constant (direction: 100, waypoint: 25, step: 5) for displaying points values
- Type colors mentioned in requirements: purple for Direction, blue for Waypoint, default/gray for Step

**Auto-linking system from src/lib/autolink/detection.ts**
- Use enrichItemsWithAutoLinks() to populate linkedInstances metadata on items
- linkedInstances array contains {id, parent_text} for each duplicate item instance
- Render edges between linked instances as manual connections (dashed edges)
- This provides automatic visual connection between items with matching text

**Canvas placeholder from src/components/CanvasPlaceholder.tsx**
- Replace placeholder component with full ReactFlow implementation
- Maintain similar layout structure (full-width section with padding)
- Keep dark mode support using Tailwind dark: classes

**ReactFlow library already installed**
- Package.json shows reactflow ^11.11.4 is available as dependency
- Use ReactFlow, Node, Edge, Controls, Background, MiniMap components from 'reactflow' package
- Import 'reactflow/dist/style.css' for default ReactFlow styling
- Leverage useNodesState and useEdgesState hooks for reactive node/edge management

## Out of Scope
- Drag-to-connect behavior between nodes (ReactFlow's default connecting mode should be disabled)
- Node creation directly on canvas (users must create items via outline view or quick-add system)
- Inline text editing on nodes (editing happens in outline view only)
- Context menu or right-click actions on nodes
- Node grouping or clustering functionality
- Undo/redo for position changes
- Canvas export as image or PDF
- Multi-selection of nodes
- Node deletion from canvas UI
- Edge editing or removal UI (connections managed via outline view)
