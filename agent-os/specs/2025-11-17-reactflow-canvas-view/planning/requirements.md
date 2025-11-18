# Spec Requirements: ReactFlow Canvas View

## Initial Description
ReactFlow Canvas View — Integrate ReactFlow library to create a node-based visual canvas where items appear as connected nodes. Include view toggle between outline and canvas, and basic node positioning.

**Roadmap Reference**: v2: Visual Canvas & Enhanced Features, Item #9

## Requirements Discussion

### First Round Questions

**Q1:** For the node design, what information should each node display?
**Answer:** Display item text, type indicator, completion status (progress circle behind text), and points value (within progress circle). Create custom ReactFlow node components for each type (Direction/Waypoint/Step).

**Q2:** Should connections show all relationships (parent-child AND manual connections)?
**Answer:** Yes, show all connections (both parent-child relationships AND manual connections). Use different edge styles to distinguish connection types.

**Q3:** For the view toggle between outline and canvas, should this be a button in the header, or tabs?
**Answer:** Not needed - navigation between `/outline` and `/canvas` is already handled through existing app routing/header.

**Q4:** Should the canvas have auto-layout or manual positioning?
**Answer:** Initial implementation: Manual positioning only (drag-and-drop). Include auto-layout button that arranges nodes left-to-right when triggered. Node positions should be saved to localStorage.

**Q5:** What level of interactivity should nodes have?
**Answer:** Fully interactive canvas. Click once on a node to select it. Ctrl+Click on another node to create connection between selected node and clicked node. Drag nodes to reposition them (positions persist). Pan and zoom controls. NO drag-to-connect behavior.

**Q6:** How should data synchronization work when items are modified in the outline view?
**Answer:** Auto-refresh when underlying data changes. Implementation approach: fast, efficient, elegant solution (developer's discretion). Should feel smooth and responsive.

**Q7:** Is there anything that should explicitly be excluded from this feature?
**Answer:** No drag-to-connect (use Ctrl+Click instead). No node creation directly on canvas (only via outline/quick-add system).

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

N/A - No visual files to analyze.

## Requirements Summary

### Functional Requirements
- Create custom ReactFlow node components for each item type (Direction/Waypoint/Step)
- Display item text, type indicator, completion status, and points value in each node
- Render all connections with different edge styles for parent-child vs manual connections
- Support manual drag-and-drop positioning of nodes with persistence to localStorage
- Provide auto-layout button that arranges nodes left-to-right on demand
- Enable single-click node selection
- Enable Ctrl+Click to create connections between selected and clicked nodes
- Support pan and zoom controls for canvas navigation
- Auto-refresh canvas when underlying data changes
- Persist node positions across sessions

### Reusability Opportunities
- Application already has `/canvas` route with placeholder implementation
- Existing data layer with localStorage CRUD operations can be leveraged
- Item types already defined with color coding (purple for Direction, blue for Waypoint, default for Step)
- Type indicators and progress visualizations may share patterns with outline view

### Scope Boundaries
**In Scope:**
- ReactFlow library integration
- Custom node components for all three item types
- Manual node positioning with drag-and-drop
- Auto-layout button (left-to-right arrangement)
- Position persistence to localStorage
- Click-to-select nodes
- Ctrl+Click to create connections
- Pan and zoom controls
- Auto-refresh on data changes
- Visual distinction between connection types

**Out of Scope:**
- Drag-to-connect behavior (replaced by Ctrl+Click)
- Node creation directly on canvas (use outline/quick-add system instead)
- View toggle UI (already handled by app routing)

### Technical Considerations
- ReactFlow library will be the primary dependency for canvas functionality
- Integration with existing localStorage data layer for CRUD operations
- Position data must be stored separately in localStorage (node coordinates)
- Data synchronization mechanism should be efficient and elegant (developer's discretion)
- Existing type color coding should be maintained (purple/blue/default)
- Canvas should feel smooth and responsive during interactions
