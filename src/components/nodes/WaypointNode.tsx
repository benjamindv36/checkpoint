/**
 * WaypointNode Component
 *
 * Custom ReactFlow node for Waypoint items (25 points, blue, medium).
 * Displays:
 * - Item text with truncation
 * - Type indicator (Waypoint label)
 * - Progress circle (filled when completed)
 * - Points value (25) inside progress circle
 * - Selection styling (shadow-lg, border-2)
 *
 * Task Group 2: Custom Node Components for Item Types
 */

import React from 'react';
import { NodeProps } from 'reactflow';

interface WaypointNodeData {
  label: string;
  itemType: 'waypoint';
  completed: boolean;
  points: number;
}

export default function WaypointNode({ data, selected }: NodeProps<WaypointNodeData>) {
  return (
    <div
      className={`
        relative bg-white dark:bg-zinc-900 rounded-lg
        border-2 border-blue-500
        ${selected ? 'shadow-lg ring-2 ring-blue-300' : 'shadow'}
        min-w-[220px] max-w-[220px]
        p-3
      `}
    >
      {/* Type Indicator */}
      <div className="text-xs font-medium text-blue-500 dark:text-blue-400 mb-2 uppercase tracking-wide">
        Waypoint
      </div>

      {/* Main Content Area with Progress Circle */}
      <div className="relative flex items-center gap-3">
        {/* Progress Circle with Points */}
        <div className="relative flex-shrink-0">
          <svg width="40" height="40" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="#e4e4e7"
              strokeWidth="3"
              fill="none"
              className="dark:stroke-zinc-700"
            />
            {/* Progress circle (filled when completed) */}
            {data.completed && (
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeDasharray="100.5"
                strokeDashoffset="0"
                className="transition-all duration-300 bg-blue-500"
              />
            )}
          </svg>
          {/* Points value in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-500 dark:text-blue-400">
              {data.points}
            </span>
          </div>
        </div>

        {/* Item Text */}
        <div className="flex-1 min-w-0">
          <p className="font-normal text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {data.label}
          </p>
        </div>
      </div>
    </div>
  );
}
