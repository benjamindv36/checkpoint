"use client";

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getActiveItems } from '@/lib/data/items';
import { seedMockItemsIfEmpty } from '@/lib/data/mockSeed';
import { getItems } from '@/lib/storage/localStorage';
import { enrichItemsWithAutoLinks } from '@/lib/autolink/detection';
import type { ItemRow } from '@/types/database';
import DirectionNode from '@/components/nodes/DirectionNode';
import WaypointNode from '@/components/nodes/WaypointNode';
import StepNode from '@/components/nodes/StepNode';

/**
 * Canvas Component - ReactFlow Implementation
 *
 * Task Group 1: Core ReactFlow Setup
 * - Renders ReactFlow canvas with items from localStorage
 * - Transforms ItemRow to ReactFlow Node format
 * - Creates edges from parent_id relationships
 * - Supports pan, zoom, and basic controls
 * - Maintains dark mode support
 *
 * Task Group 2: Custom Node Components
 * - Registers custom node types (direction, waypoint, step)
 * - Maps item types to custom node components
 * - Applies selection styling to nodes
 *
 * Task Group 3: Connection Visualization (Edge Rendering)
 * - Implements parent-child edge generation with solid gray styling
 * - Loads manual connections from localStorage with dashed blue styling
 * - Integrates auto-linking system for visual connections
 * - Configures edge interaction styling with hover feedback
 */

// Register custom node types
const nodeTypes: NodeTypes = {
  direction: DirectionNode,
  waypoint: WaypointNode,
  step: StepNode,
};

// Manual connection type definition from localStorage
interface ManualConnection {
  sourceId: string;
  targetId: string;
}

export default function Canvas() {
  // Transform items to ReactFlow nodes
  const transformItemsToNodes = useCallback((items: ItemRow[]): Node[] => {
    return items.map((item, index) => ({
      id: item.id,
      type: item.type, // Maps to custom node types (direction, waypoint, step)
      position: { x: index * 250, y: 0 }, // Temporary grid layout
      data: {
        label: item.text,
        itemType: item.type,
        completed: item.completed,
        points: item.points,
      },
    }));
  }, []);

  /**
   * Task Group 3.2: Create parent-child edges with solid gray styling
   *
   * Generates edges for hierarchical relationships using parent_id field.
   * Uses smooth bezier curves (smoothstep) for visual distinction.
   * Applies solid gray styling (zinc-300).
   */
  const createParentChildEdges = useCallback((items: ItemRow[]): Edge[] => {
    const edges: Edge[] = [];

    items.forEach(item => {
      if (item.parent_id) {
        edges.push({
          id: `edge-parent-${item.parent_id}-${item.id}`,
          source: item.parent_id,
          target: item.id,
          type: 'smoothstep',
          style: {
            stroke: '#d4d4d8', // zinc-300 (solid gray)
            strokeWidth: 2,
          },
        });
      }
    });

    return edges;
  }, []);

  /**
   * Task Group 3.3: Load manual connections from localStorage
   *
   * Reads 'waypoint:manual_connections' key as array of {sourceId, targetId}.
   * Creates edges with dashed blue styling (blue-400, stroke-dasharray-4).
   * Uses straight lines (default type) to differentiate from parent-child.
   */
  const loadManualConnectionEdges = useCallback((): Edge[] => {
    try {
      const connectionsJson = localStorage.getItem('waypoint:manual_connections');
      if (!connectionsJson) return [];

      const connections: ManualConnection[] = JSON.parse(connectionsJson);

      return connections.map(conn => ({
        id: `edge-manual-${conn.sourceId}-${conn.targetId}`,
        source: conn.sourceId,
        target: conn.targetId,
        type: 'default', // Straight lines to differentiate from parent-child
        style: {
          stroke: '#60a5fa', // blue-400 (dashed blue)
          strokeWidth: 2,
          strokeDasharray: '4',
        },
      }));
    } catch (error) {
      console.error('Error loading manual connections:', error);
      return [];
    }
  }, []);

  /**
   * Task Group 3.4: Integrate auto-linking system for visual connections
   *
   * Uses enrichItemsWithAutoLinks() from detection.ts to find linked instances.
   * Creates dashed edges between items with matching text.
   * Treats auto-linked edges as manual connection style.
   */
  const createAutoLinkEdges = useCallback((items: ItemRow[]): Edge[] => {
    const enrichedItems = enrichItemsWithAutoLinks(items);
    const edges: Edge[] = [];

    enrichedItems.forEach(item => {
      if (item.linkedInstances && item.linkedInstances.length > 0) {
        // Only create edges from canonical instance to avoid duplicates
        if (item.isCanonical) {
          item.linkedInstances.forEach(linkedInstance => {
            edges.push({
              id: `edge-autolink-${item.id}-${linkedInstance.id}`,
              source: item.id,
              target: linkedInstance.id,
              type: 'default', // Straight lines like manual connections
              style: {
                stroke: '#60a5fa', // blue-400 (dashed blue)
                strokeWidth: 2,
                strokeDasharray: '4',
              },
            });
          });
        }
      }
    });

    return edges;
  }, []);

  /**
   * Load initial data from localStorage and combine all edge types
   */
  const loadCanvasData = useCallback(() => {
    const items = getActiveItems(); // Only active (non-deleted) items
    const nodes = transformItemsToNodes(items);

    // Combine all edge types
    const parentChildEdges = createParentChildEdges(items);
    const manualEdges = loadManualConnectionEdges();
    const autoLinkEdges = createAutoLinkEdges(items);

    const edges = [...parentChildEdges, ...manualEdges, ...autoLinkEdges];

    return { nodes, edges };
  }, [transformItemsToNodes, createParentChildEdges, loadManualConnectionEdges, createAutoLinkEdges]);

  // Initialize nodes and edges
  const initialData = useMemo(() => loadCanvasData(), [loadCanvasData]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Seed demo data into localStorage if no items exist, then refresh canvas state.
  React.useEffect(() => {
    try {
      const seeded = seedMockItemsIfEmpty();
      if (seeded) {
        // re-load items and update nodes/edges
        const refreshed = loadCanvasData();
        setNodes(refreshed.nodes);
        setEdges(refreshed.edges);
      } else {
        // if there are items but nodes are empty (first load), ensure nodes are current
        const existing = getItems();
        if (existing.length > 0 && initialData.nodes.length === 0) {
          const refreshed = loadCanvasData();
          setNodes(refreshed.nodes);
          setEdges(refreshed.edges);
        }
      }
    } catch (err) {
      // Non-fatal - keep console log for debugging
      // eslint-disable-next-line no-console
      console.error('Error seeding or refreshing canvas data:', err);
    }
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Task Group 3.5: Configure edge interaction styling
   *
   * Increases stroke width and opacity on hover for interactive feedback.
   * Edges are selectable but not editable.
   */
  const defaultEdgeOptions = {
    animated: false,
    style: { stroke: '#a1a1aa', strokeWidth: 2 },
  };

  return (
    <section className="h-[calc(100vh-4rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        nodesDraggable={true}
        nodesConnectable={false} // Disable drag-to-connect
        elementsSelectable={true}
        className="bg-white dark:bg-black"
      >
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-sm"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="bg-zinc-50 dark:bg-zinc-900"
          color="#a1a1aa"
        />
      </ReactFlow>

      {/* CSS for edge hover styling (Task Group 3.5) */}
      <style jsx global>{`
        .react-flow__edge-path {
          transition: stroke-width 0.2s ease, opacity 0.2s ease;
        }

        .react-flow__edge:hover .react-flow__edge-path {
          stroke-width: 3 !important;
          opacity: 1 !important;
        }

        .react-flow__edge.selected .react-flow__edge-path {
          stroke-width: 3 !important;
        }
      `}</style>
    </section>
  );
}
