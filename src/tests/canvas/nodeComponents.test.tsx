/**
 * Node Components Tests
 *
 * Tests for Task Group 2: Custom Node Components for Item Types
 * Covers:
 * - DirectionNode renders with correct styling and data
 * - WaypointNode renders with correct styling and data
 * - StepNode renders with correct styling and data
 * - Progress circle fills based on completion status
 * - Points display within progress circle
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DirectionNode from '@/components/nodes/DirectionNode';
import WaypointNode from '@/components/nodes/WaypointNode';
import StepNode from '@/components/nodes/StepNode';

describe('Custom Node Components - Task Group 2', () => {
  describe('DirectionNode', () => {
    it('should render with correct text and styling', () => {
      const nodeData = {
        label: 'Complete Project',
        itemType: 'direction' as const,
        completed: false,
        points: 100,
      };

      const { container } = render(
        <DirectionNode data={nodeData} selected={false} />
      );

      // Check that text is displayed
      expect(screen.getByText('Complete Project')).toBeInTheDocument();

      // Check that points are displayed
      expect(screen.getByText('100')).toBeInTheDocument();

      // Check for purple border styling (via class)
      const nodeElement = container.querySelector('[class*="border-purple"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should show completed state with filled progress circle', () => {
      const nodeData = {
        label: 'Completed Direction',
        itemType: 'direction' as const,
        completed: true,
        points: 100,
      };

      const { container } = render(
        <DirectionNode data={nodeData} selected={false} />
      );

      // Check for completed styling (progress circle should be filled)
      const progressCircle = container.querySelector('[class*="bg-purple"]');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should apply selection styling when selected', () => {
      const nodeData = {
        label: 'Selected Direction',
        itemType: 'direction' as const,
        completed: false,
        points: 100,
      };

      const { container } = render(
        <DirectionNode data={nodeData} selected={true} />
      );

      // Check for selection styling (shadow-lg and border-2)
      const nodeElement = container.querySelector('[class*="shadow-lg"]');
      expect(nodeElement).toBeInTheDocument();
    });
  });

  describe('WaypointNode', () => {
    it('should render with correct text and styling', () => {
      const nodeData = {
        label: 'Milestone Reached',
        itemType: 'waypoint' as const,
        completed: false,
        points: 25,
      };

      const { container } = render(
        <WaypointNode data={nodeData} selected={false} />
      );

      // Check that text is displayed
      expect(screen.getByText('Milestone Reached')).toBeInTheDocument();

      // Check that points are displayed
      expect(screen.getByText('25')).toBeInTheDocument();

      // Check for blue border styling
      const nodeElement = container.querySelector('[class*="border-blue"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should show completed state with filled progress circle', () => {
      const nodeData = {
        label: 'Completed Waypoint',
        itemType: 'waypoint' as const,
        completed: true,
        points: 25,
      };

      const { container } = render(
        <WaypointNode data={nodeData} selected={false} />
      );

      // Check for completed styling
      const progressCircle = container.querySelector('[class*="bg-blue"]');
      expect(progressCircle).toBeInTheDocument();
    });
  });

  describe('StepNode', () => {
    it('should render with correct text and styling', () => {
      const nodeData = {
        label: 'Action Item',
        itemType: 'step' as const,
        completed: false,
        points: 5,
      };

      const { container } = render(
        <StepNode data={nodeData} selected={false} />
      );

      // Check that text is displayed
      expect(screen.getByText('Action Item')).toBeInTheDocument();

      // Check that points are displayed
      expect(screen.getByText('5')).toBeInTheDocument();

      // Check for gray border styling
      const nodeElement = container.querySelector('[class*="border-zinc"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should show completed state with filled progress circle', () => {
      const nodeData = {
        label: 'Completed Step',
        itemType: 'step' as const,
        completed: true,
        points: 5,
      };

      const { container } = render(
        <StepNode data={nodeData} selected={false} />
      );

      // Check for completed styling
      const progressCircle = container.querySelector('[class*="bg-zinc"]');
      expect(progressCircle).toBeInTheDocument();
    });
  });

  describe('Text Truncation', () => {
    it('should truncate long text in DirectionNode', () => {
      const nodeData = {
        label: 'This is a very long direction text that should be truncated to prevent overflow and maintain a clean visual appearance',
        itemType: 'direction' as const,
        completed: false,
        points: 100,
      };

      const { container } = render(
        <DirectionNode data={nodeData} selected={false} />
      );

      // Check for truncate class
      const textElement = container.querySelector('[class*="truncate"]');
      expect(textElement).toBeInTheDocument();
    });
  });
});
