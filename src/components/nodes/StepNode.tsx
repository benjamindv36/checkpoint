/**
 * StepNode Component
 *
 * Custom ReactFlow node for Step items (5 points, gray, small).
 * Displays:
 * - Item text with truncation
 * - Type indicator (Step label)
 * - Progress circle (filled when completed)
 * - Points value (5) inside progress circle
 * - Selection styling (shadow-lg, border-2)
 *
 * Task Group 2: Custom Node Components for Item Types
 */

import React from 'react';
import { NodeProps } from 'reactflow';

interface StepNodeData {
  label: string;
  itemType: 'step';
  completed: boolean;
  points: number;
}

export default function StepNode({ data, selected }: NodeProps<StepNodeData>) {
  return (
    <div
      className={`
        relative bg-white dark:bg-zinc-900 rounded-lg
        border-2 border-zinc-400 dark:border-zinc-600
        ${selected ? 'shadow-lg ring-2 ring-zinc-300' : 'shadow-sm'}
        min-w-[180px] max-w-[180px]
        p-2.5
      `}
    >
      {/* Type Indicator */}
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
        Step
      </div>

      {/* Main Content Area with Progress Circle */}
      <div className="relative flex items-center gap-2.5">
        {/* Progress Circle with Points */}
        <div className="relative flex-shrink-0">
          <svg width="32" height="32" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="#e4e4e7"
              strokeWidth="2.5"
              fill="none"
              className="dark:stroke-zinc-700"
            />
            {/* Progress circle (filled when completed) */}
            {data.completed && (
              <circle
                cx="16"
                cy="16"
                r="12"
                stroke="#71717a"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="75.4"
                strokeDashoffset="0"
                className="transition-all duration-300 bg-zinc-600"
              />
            )}
          </svg>
          {/* Points value in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
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
