/**
 * Edge Rendering Tests
 *
 * Tests for Task Group 3: Connection Visualization
 * Covers:
 * - Parent-child edge rendering with solid gray styling
 * - Manual connection edges with dashed blue styling
 * - Auto-linking edge generation
 * - Edge routing and styling
 * - Correct source and target node connections
 */

import { createItem } from '@/lib/data/items';
import { getItems, setItems } from '@/lib/storage/localStorage';
import { enrichItemsWithAutoLinks } from '@/lib/autolink/detection';
import type { ItemRow } from '@/types/database';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Replace global localStorage with mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Edge type definition matching ReactFlow
interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  style?: {
    stroke: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
}

// Helper function to create parent-child edges (solid gray, smooth bezier)
function createParentChildEdges(items: ItemRow[]): Edge[] {
  const edges: Edge[] = [];

  items.forEach(item => {
    if (item.parent_id) {
      edges.push({
        id: `edge-parent-${item.parent_id}-${item.id}`,
        source: item.parent_id,
        target: item.id,
        type: 'smoothstep',
        style: {
          stroke: '#d4d4d8', // zinc-300
          strokeWidth: 2,
        },
      });
    }
  });

  return edges;
}

// Helper function to load manual connections from localStorage
function loadManualConnectionEdges(): Edge[] {
  const connectionsJson = localStorage.getItem('waypoint:manual_connections');
  if (!connectionsJson) return [];

  const connections: Array<{ sourceId: string; targetId: string }> = JSON.parse(connectionsJson);

  return connections.map(conn => ({
    id: `edge-manual-${conn.sourceId}-${conn.targetId}`,
    source: conn.sourceId,
    target: conn.targetId,
    type: 'default',
    style: {
      stroke: '#60a5fa', // blue-400
      strokeWidth: 2,
      strokeDasharray: '4',
    },
  }));
}

// Helper function to create auto-linking edges
function createAutoLinkEdges(items: ItemRow[]): Edge[] {
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
            type: 'default',
            style: {
              stroke: '#60a5fa', // blue-400
              strokeWidth: 2,
              strokeDasharray: '4',
            },
          });
        });
      }
    }
  });

  return edges;
}

// Helper function to combine all edge types
function createAllEdges(items: ItemRow[]): Edge[] {
  const parentChildEdges = createParentChildEdges(items);
  const manualEdges = loadManualConnectionEdges();
  const autoLinkEdges = createAutoLinkEdges(items);

  return [...parentChildEdges, ...manualEdges, ...autoLinkEdges];
}

describe('Edge Rendering - Task Group 3', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Parent-Child Edge Rendering', () => {
    it('should render parent-child edges with solid gray styling', () => {
      const parent = createItem({
        text: 'Parent Direction',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      const child = createItem({
        text: 'Child Waypoint',
        type: 'waypoint',
        parent_id: parent.id,
        position: 0,
      });

      const items = getItems().filter(item => item.deleted_at === null);
      const edges = createParentChildEdges(items);

      expect(edges).toHaveLength(1);
      expect(edges[0]).toMatchObject({
        source: parent.id,
        target: child.id,
        type: 'smoothstep',
        style: {
          stroke: '#d4d4d8', // zinc-300 (solid gray)
          strokeWidth: 2,
        },
      });
    });

    it('should connect correct source and target nodes', () => {
      const direction = createItem({
        text: 'Direction',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      const waypoint = createItem({
        text: 'Waypoint',
        type: 'waypoint',
        parent_id: direction.id,
        position: 0,
      });

      const step = createItem({
        text: 'Step',
        type: 'step',
        parent_id: waypoint.id,
        position: 0,
      });

      const items = getItems().filter(item => item.deleted_at === null);
      const edges = createParentChildEdges(items);

      expect(edges).toHaveLength(2);

      // Edge from direction to waypoint
      const dirToWay = edges.find(e => e.source === direction.id && e.target === waypoint.id);
      expect(dirToWay).toBeTruthy();
      expect(dirToWay?.type).toBe('smoothstep');

      // Edge from waypoint to step
      const wayToStep = edges.find(e => e.source === waypoint.id && e.target === step.id);
      expect(wayToStep).toBeTruthy();
      expect(wayToStep?.type).toBe('smoothstep');
    });
  });

  describe('Manual Connection Edge Rendering', () => {
    it('should load manual connections from localStorage with dashed blue styling', () => {
      const item1 = createItem({
        text: 'Item 1',
        type: 'waypoint',
        parent_id: null,
        position: 0,
      });

      const item2 = createItem({
        text: 'Item 2',
        type: 'waypoint',
        parent_id: null,
        position: 1,
      });

      // Store manual connection in localStorage
      const manualConnections = [
        { sourceId: item1.id, targetId: item2.id },
      ];
      localStorage.setItem('waypoint:manual_connections', JSON.stringify(manualConnections));

      const edges = loadManualConnectionEdges();

      expect(edges).toHaveLength(1);
      expect(edges[0]).toMatchObject({
        source: item1.id,
        target: item2.id,
        type: 'default',
        style: {
          stroke: '#60a5fa', // blue-400 (dashed blue)
          strokeWidth: 2,
          strokeDasharray: '4',
        },
      });
    });

    it('should handle multiple manual connections', () => {
      const item1 = createItem({ text: 'Item 1', type: 'waypoint', parent_id: null, position: 0 });
      const item2 = createItem({ text: 'Item 2', type: 'waypoint', parent_id: null, position: 1 });
      const item3 = createItem({ text: 'Item 3', type: 'step', parent_id: null, position: 2 });

      const manualConnections = [
        { sourceId: item1.id, targetId: item2.id },
        { sourceId: item2.id, targetId: item3.id },
      ];
      localStorage.setItem('waypoint:manual_connections', JSON.stringify(manualConnections));

      const edges = loadManualConnectionEdges();

      expect(edges).toHaveLength(2);
      expect(edges[0].source).toBe(item1.id);
      expect(edges[0].target).toBe(item2.id);
      expect(edges[1].source).toBe(item2.id);
      expect(edges[1].target).toBe(item3.id);
    });

    it('should return empty array when no manual connections exist', () => {
      const edges = loadManualConnectionEdges();
      expect(edges).toEqual([]);
    });
  });

  describe('Auto-Linking Edge Rendering', () => {
    it('should render edges for linked instances with matching text', () => {
      const parent1 = createItem({
        text: 'Parent 1',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      const parent2 = createItem({
        text: 'Parent 2',
        type: 'direction',
        parent_id: null,
        position: 1,
      });

      // Create two items with identical text under different parents
      const item1 = createItem({
        text: 'Deploy to Production',
        type: 'waypoint',
        parent_id: parent1.id,
        position: 0,
      });

      const item2 = createItem({
        text: 'Deploy to Production',
        type: 'waypoint',
        parent_id: parent2.id,
        position: 0,
      });

      const items = getItems().filter(item => item.deleted_at === null);
      const edges = createAutoLinkEdges(items);

      // Should create one edge from canonical to linked instance
      expect(edges.length).toBeGreaterThan(0);

      const autoLinkEdge = edges.find(e =>
        (e.source === item1.id && e.target === item2.id) ||
        (e.source === item2.id && e.target === item1.id)
      );

      expect(autoLinkEdge).toBeTruthy();
      expect(autoLinkEdge?.style?.stroke).toBe('#60a5fa'); // blue-400
      expect(autoLinkEdge?.style?.strokeDasharray).toBe('4'); // dashed
    });

    it('should treat auto-linked edges as manual connection style', () => {
      const item1 = createItem({
        text: 'Write Tests',
        type: 'step',
        parent_id: null,
        position: 0,
      });

      const item2 = createItem({
        text: 'Write Tests',
        type: 'step',
        parent_id: null,
        position: 1,
      });

      const items = getItems().filter(item => item.deleted_at === null);
      const edges = createAutoLinkEdges(items);

      expect(edges.length).toBeGreaterThan(0);
      expect(edges[0].type).toBe('default');
      expect(edges[0].style?.stroke).toBe('#60a5fa');
      expect(edges[0].style?.strokeDasharray).toBe('4');
    });
  });

  describe('Combined Edge Rendering', () => {
    it('should combine parent-child, manual, and auto-link edges', () => {
      // Create parent-child relationship
      const parent = createItem({
        text: 'Parent',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      const child = createItem({
        text: 'Child',
        type: 'waypoint',
        parent_id: parent.id,
        position: 0,
      });

      // Create items for manual connection
      const item1 = createItem({
        text: 'Item 1',
        type: 'waypoint',
        parent_id: null,
        position: 1,
      });

      const item2 = createItem({
        text: 'Item 2',
        type: 'step',
        parent_id: null,
        position: 2,
      });

      // Store manual connection
      localStorage.setItem('waypoint:manual_connections', JSON.stringify([
        { sourceId: item1.id, targetId: item2.id },
      ]));

      // Create auto-linked items
      const autoItem1 = createItem({
        text: 'Deploy',
        type: 'step',
        parent_id: null,
        position: 3,
      });

      const autoItem2 = createItem({
        text: 'Deploy',
        type: 'step',
        parent_id: null,
        position: 4,
      });

      const items = getItems().filter(item => item.deleted_at === null);
      const allEdges = createAllEdges(items);

      // Should have edges from all three sources
      // 1 parent-child edge
      const parentChildEdges = allEdges.filter(e => e.type === 'smoothstep');
      expect(parentChildEdges).toHaveLength(1);

      // 1 manual connection edge
      const manualEdges = allEdges.filter(e =>
        e.id.startsWith('edge-manual-') && e.style?.strokeDasharray === '4'
      );
      expect(manualEdges).toHaveLength(1);

      // At least 1 auto-link edge
      const autoLinkEdges = allEdges.filter(e => e.id.startsWith('edge-autolink-'));
      expect(autoLinkEdges.length).toBeGreaterThan(0);
    });
  });
});
