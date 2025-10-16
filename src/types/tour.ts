// Tour and educational feature types

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  module: 'chunking' | 'embedding' | 'retrieval' | 'generation' | 'overview';
  order: number;
  isOptional?: boolean;
  prerequisites?: string[]; // IDs of steps that must be completed first
  actions?: TourAction[];
}

export interface TourAction {
  type: 'click' | 'input' | 'wait' | 'navigate';
  target?: string;
  value?: string;
  delay?: number;
}

export interface TourProgress {
  currentStepId: string | null;
  completedSteps: string[];
  isActive: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Tooltip {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  trigger: 'hover' | 'click' | 'focus';
  category: 'concept' | 'parameter' | 'action' | 'result';
}

export interface HelpArticle {
  id: string;
  title: string;
  category: 'concepts' | 'parameters' | 'troubleshooting' | 'examples';
  content: string;
  relatedArticles?: string[];
  searchKeywords: string[];
}

export interface ConfigurationShare {
  id: string;
  name: string;
  description: string;
  parameters: {
    chunking: any;
    search: any;
    generation: any;
  };
  sampleText: string;
  createdAt: Date;
  shareUrl?: string;
}

export type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}