/**
 * Canvas Setup Tests
 *
 * Tests for Task Group 1: Core ReactFlow Setup
 * Covers:
 * - Canvas data loading from localStorage
 * - Node transformation from ItemRow to ReactFlow format
 * - Edge creation from parent_id relationships
 * - Empty state handling
 * - Filtering of soft-deleted items
 */

import { createItem, deleteItem } from '@/lib/data/items';
import { getItems, setItems } from '@/lib/storage/localStorage';
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

// Helper functions that mirror Canvas component logic
function transformItemsToNodes(items: ItemRow[]) {
  return items.map((item, index) => ({
    id: item.id,
    type: item.type,
    position: { x: index * 250, y: 0 },
    data: {
      label: item.text,
      itemType: item.type,
      completed: item.completed,
      points: item.points,
    },
  }));
}

function createEdgesFromRelationships(items: ItemRow[]) {
  const edges: Array<{ id: string; source: string; target: string }> = [];

  items.forEach(item => {
    if (item.parent_id) {
      edges.push({
        id: `edge-${item.parent_id}-${item.id}`,
        source: item.parent_id,
        target: item.id,
      });
    }
  });

  return edges;
}

describe('Canvas Setup - Task Group 1', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Data Loading from localStorage', () => {
    it('should handle empty localStorage with no items', () => {
      const items: ItemRow[] = [];
      setItems(items);

      const nodes = transformItemsToNodes(items);
      const edges = createEdgesFromRelationships(items);

      expect(nodes).toEqual([]);
      expect(edges).toEqual([]);
    });

    it('should load active items from localStorage', () => {
      const direction = createItem({
        text: 'Complete Project',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      const waypoint = createItem({
        text: 'Milestone 1',
        type: 'waypoint',
        parent_id: direction.id,
        position: 0,
      });

      const items = getItems().filter(item => item.deleted_at === null);
      const nodes = transformItemsToNodes(items);

      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).toBe(direction.id);
      expect(nodes[1].id).toBe(waypoint.id);
    });

    it('should filter out soft-deleted items', () => {
      const activeItem = createItem({
        text: 'Active Item',
        type: 'waypoint',
        parent_id: null,
        position: 0,
      });

      const itemToDelete = createItem({
        text: 'Item to Delete',
        type: 'step',
        parent_id: null,
        position: 1,
      });

      deleteItem(itemToDelete.id);

      const items = getItems().filter(item => item.deleted_at === null);
      const nodes = transformItemsToNodes(items);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe(activeItem.id);
    });
  });

  describe('Node Transformation', () => {
    it('should transform ItemRow to ReactFlow Node format correctly', () => {
      const item = createItem({
        text: 'Test Waypoint',
        type: 'waypoint',
        parent_id: null,
        position: 0,
      });

      const items = [item];
      const nodes = transformItemsToNodes(items);

      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toMatchObject({
        id: item.id,
        type: 'waypoint',
        position: { x: 0, y: 0 },
        data: {
          label: 'Test Waypoint',
          itemType: 'waypoint',
          completed: false,
          points: 25,
        },
      });
    });

    it('should handle all three item types: direction, waypoint, step', () => {
      const direction = createItem({
        text: 'Direction',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      const waypoint = createItem({
        text: 'Waypoint',
        type: 'waypoint',
        parent_id: null,
        position: 1,
      });

      const step = createItem({
        text: 'Step',
        type: 'step',
        parent_id: null,
        position: 2,
      });

      const items = [direction, waypoint, step];
      const nodes = transformItemsToNodes(items);

      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('direction');
      expect(nodes[0].data.points).toBe(100);
      expect(nodes[1].type).toBe('waypoint');
      expect(nodes[1].data.points).toBe(25);
      expect(nodes[2].type).toBe('step');
      expect(nodes[2].data.points).toBe(5);
    });

    it('should include completion status in node data', () => {
      const item = createItem({
        text: 'Completed Step',
        type: 'step',
        parent_id: null,
        position: 0,
      });

      // Mark as completed
      const items = getItems();
      items[0].completed = true;
      items[0].completed_at = new Date().toISOString();
      setItems(items);

      const updatedItems = getItems();
      const nodes = transformItemsToNodes(updatedItems);

      expect(nodes[0].data.completed).toBe(true);
    });
  });

  describe('Edge Creation from Relationships', () => {
    it('should create edges from parent_id relationships', () => {
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

      const items = [parent, child];
      const edges = createEdgesFromRelationships(items);

      expect(edges).toHaveLength(1);
      expect(edges[0]).toMatchObject({
        id: `edge-${parent.id}-${child.id}`,
        source: parent.id,
        target: child.id,
      });
    });

    it('should create multiple edges for multiple children', () => {
      const parent = createItem({
        text: 'Parent',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      const child1 = createItem({
        text: 'Child 1',
        type: 'waypoint',
        parent_id: parent.id,
        position: 0,
      });

      const child2 = createItem({
        text: 'Child 2',
        type: 'waypoint',
        parent_id: parent.id,
        position: 1,
      });

      const items = [parent, child1, child2];
      const edges = createEdgesFromRelationships(items);

      expect(edges).toHaveLength(2);
      expect(edges[0].source).toBe(parent.id);
      expect(edges[0].target).toBe(child1.id);
      expect(edges[1].source).toBe(parent.id);
      expect(edges[1].target).toBe(child2.id);
    });

    it('should handle items with no parent (root items)', () => {
      const rootItem1 = createItem({
        text: 'Root 1',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      const rootItem2 = createItem({
        text: 'Root 2',
        type: 'direction',
        parent_id: null,
        position: 1,
      });

      const items = [rootItem1, rootItem2];
      const edges = createEdgesFromRelationships(items);

      expect(edges).toHaveLength(0);
    });

    it('should handle hierarchical relationships (3 levels)', () => {
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

      const items = [direction, waypoint, step];
      const edges = createEdgesFromRelationships(items);

      expect(edges).toHaveLength(2);
      // Edge from direction to waypoint
      expect(edges.find(e => e.source === direction.id && e.target === waypoint.id)).toBeTruthy();
      // Edge from waypoint to step
      expect(edges.find(e => e.source === waypoint.id && e.target === step.id)).toBeTruthy();
    });
  });
});
