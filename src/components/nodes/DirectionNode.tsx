/**
 * DirectionNode Component
 *
 * Custom ReactFlow node for Direction items (100 points, purple, large).
 * Displays:
 * - Item text with truncation
 * - Type indicator (Direction label)
 * - Progress circle (filled when completed)
 * - Points value (100) inside progress circle
 * - Selection styling (shadow-lg, border-2)
 *
 * Task Group 2: Custom Node Components for Item Types
 */

import React from 'react';
import { NodeProps } from 'reactflow';

interface DirectionNodeData {
  label: string;
  itemType: 'direction';
  completed: boolean;
  points: number;
}

export default function DirectionNode({ data, selected }: NodeProps<DirectionNodeData>) {
  return (
    <div
      className={`
        relative bg-white dark:bg-zinc-900 rounded-lg
        border-2 border-purple-600
        ${selected ? 'shadow-lg ring-2 ring-purple-400' : 'shadow'}
        min-w-[280px] max-w-[280px]
        p-4
      `}
    >
      {/* Type Indicator */}
      <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">
        Direction
      </div>

      {/* Main Content Area with Progress Circle */}
      <div className="relative flex items-center gap-3">
        {/* Progress Circle with Points */}
        <div className="relative flex-shrink-0">
          <svg width="48" height="48" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#e4e4e7"
              strokeWidth="4"
              fill="none"
              className="dark:stroke-zinc-700"
            />
            {/* Progress circle (filled when completed) */}
            {data.completed && (
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#9333ea"
                strokeWidth="4"
                fill="none"
                strokeDasharray="125.6"
                strokeDashoffset="0"
                className="transition-all duration-300 bg-purple-600"
              />
            )}
          </svg>
          {/* Points value in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {data.points}
            </span>
          </div>
        </div>

        {/* Item Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate">
            {data.label}
          </p>
        </div>
      </div>
    </div>
  );
}
