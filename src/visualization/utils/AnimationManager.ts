import * as d3 from 'd3';

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  stagger?: number;
}

export interface TransitionState {
  id: string;
  element: d3.Selection<any, any, any, any>;
  fromState: any;
  toState: any;
  progress: number;
  isActive: boolean;
}

export class AnimationManager {
  private static instance: AnimationManager;
  private activeTransitions: Map<string, TransitionState> = new Map();
  private animationQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;

  private constructor() {}

  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  /**
   * Animate element entrance with staggered timing
   */
  public animateEntrance(
    elements: d3.Selection<any, any, any, any>,
    config: AnimationConfig = { duration: 500, easing: 'easeQuadOut' }
  ): Promise<void> {
    return new Promise((resolve) => {
      elements
        .style('opacity', 0)
        .style('transform', 'scale(0.8) translateY(20px)')
        .transition()
        .duration(config.duration)
        .ease(this.getEasingFunction(config.easing))
        .delay((_, i) => (config.stagger || 50) * i)
        .style('opacity', 1)
        .style('transform', 'scale(1) translateY(0px)')
        .on('end', (_, i) => {
          if (i === elements.size() - 1) {
            resolve();
          }
        });
    });
  }

  /**
   * Animate element exit
   */
  public animateExit(
    elements: d3.Selection<any, any, any, any>,
    config: AnimationConfig = { duration: 300, easing: 'easeQuadIn' }
  ): Promise<void> {
    return new Promise((resolve) => {
      elements
        .transition()
        .duration(config.duration)
        .ease(this.getEasingFunction(config.easing))
        .style('opacity', 0)
        .style('transform', 'scale(0.8) translateY(-20px)')
        .remove()
        .on('end', resolve);
    });
  }

  /**
   * Animate smooth transitions between states
   */
  public animateTransition(
    transitionId: string,
    element: d3.Selection<any, any, any, any>,
    fromState: any,
    toState: any,
    config: AnimationConfig = { duration: 500, easing: 'easeQuadInOut' }
  ): Promise<void> {
    return new Promise((resolve) => {
      // Cancel existing transition with same ID
      this.cancelTransition(transitionId);

      const transition: TransitionState = {
        id: transitionId,
        element,
        fromState,
        toState,
        progress: 0,
        isActive: true
      };

      this.activeTransitions.set(transitionId, transition);

      // Create D3 transition
      element
        .transition()
        .duration(config.duration)
        .ease(this.getEasingFunction(config.easing))
        .delay(config.delay || 0)
        .tween('custom', () => {
          return (t: number) => {
            transition.progress = t;
            this.interpolateState(element, fromState, toState, t);
          };
        })
        .on('end', () => {
          transition.isActive = false;
          this.activeTransitions.delete(transitionId);
          resolve();
        });
    });
  }

  /**
   * Animate highlight effect
   */
  public animateHighlight(
    element: d3.Selection<any, any, any, any>,
    config: AnimationConfig = { duration: 300, easing: 'easeQuadOut' }
  ): Promise<void> {
    return new Promise((resolve) => {
      const originalFill = element.style('fill');
      const originalStroke = element.style('stroke');
      const originalStrokeWidth = element.style('stroke-width');

      element
        .transition()
        .duration(config.duration / 2)
        .ease(this.getEasingFunction(config.easing))
        .style('fill', '#FEF3C7')
        .style('stroke', '#F59E0B')
        .style('stroke-width', '3px')
        .transition()
        .duration(config.duration / 2)
        .style('fill', originalFill)
        .style('stroke', originalStroke)
        .style('stroke-width', originalStrokeWidth)
        .on('end', resolve);
    });
  }

  /**
   * Animate pulsing effect
   */
  public animatePulse(
    element: d3.Selection<any, any, any, any>,
    pulseCount: number = 3,
    config: AnimationConfig = { duration: 600, easing: 'easeQuadInOut' }
  ): Promise<void> {
    return new Promise((resolve) => {
      let currentPulse = 0;

      const pulse = () => {
        if (currentPulse >= pulseCount) {
          resolve();
          return;
        }

        element
          .transition()
          .duration(config.duration / 2)
          .ease(this.getEasingFunction(config.easing))
          .style('transform', 'scale(1.2)')
          .style('opacity', 0.7)
          .transition()
          .duration(config.duration / 2)
          .style('transform', 'scale(1)')
          .style('opacity', 1)
          .on('end', () => {
            currentPulse++;
            pulse();
          });
      };

      pulse();
    });
  }

  /**
   * Animate morphing between shapes
   */
  public animateMorph(
    element: d3.Selection<SVGPathElement, any, any, any>,
    fromPath: string,
    toPath: string,
    config: AnimationConfig = { duration: 800, easing: 'easeQuadInOut' }
  ): Promise<void> {
    return new Promise((resolve) => {
      element
        .attr('d', fromPath)
        .transition()
        .duration(config.duration)
        .ease(this.getEasingFunction(config.easing))
        .attrTween('d', () => {
          // Simple interpolation between paths - in practice you'd use d3-interpolate-path
          return (t: number) => {
            return t < 0.5 ? fromPath : toPath;
          };
        })
        .on('end', resolve);
    });
  }

  /**
   * Queue animations for sequential execution
   */
  public queueAnimation(animationFunction: () => Promise<void>): void {
    this.animationQueue.push(animationFunction);
    this.processQueue();
  }

  /**
   * Cancel specific transition
   */
  public cancelTransition(transitionId: string): void {
    const transition = this.activeTransitions.get(transitionId);
    if (transition && transition.isActive) {
      transition.element.interrupt();
      transition.isActive = false;
      this.activeTransitions.delete(transitionId);
    }
  }

  /**
   * Cancel all active transitions
   */
  public cancelAllTransitions(): void {
    this.activeTransitions.forEach((transition) => {
      if (transition.isActive) {
        transition.element.interrupt();
      }
    });
    this.activeTransitions.clear();
  }

  /**
   * Get current transition progress
   */
  public getTransitionProgress(transitionId: string): number {
    const transition = this.activeTransitions.get(transitionId);
    return transition ? transition.progress : 0;
  }

  /**
   * Check if any transitions are active
   */
  public hasActiveTransitions(): boolean {
    return Array.from(this.activeTransitions.values()).some(t => t.isActive);
  }

  /**
   * Create coordinated animation sequence
   */
  public createSequence(): AnimationSequence {
    return new AnimationSequence(this);
  }

  // Private helper methods

  private getEasingFunction(easing: string): (t: number) => number {
    const easingMap: Record<string, (t: number) => number> = {
      'easeLinear': d3.easeLinear,
      'easeQuadIn': d3.easeQuadIn,
      'easeQuadOut': d3.easeQuadOut,
      'easeQuadInOut': d3.easeQuadInOut,
      'easeCubicIn': d3.easeCubicIn,
      'easeCubicOut': d3.easeCubicOut,
      'easeCubicInOut': d3.easeCubicInOut,
      'easeElasticOut': d3.easeElasticOut,
      'easeBounceOut': d3.easeBounceOut
    };

    return easingMap[easing] || d3.easeQuadInOut;
  }

  private interpolateState(
    element: d3.Selection<any, any, any, any>,
    fromState: any,
    toState: any,
    t: number
  ): void {
    // Interpolate numeric properties
    Object.keys(toState).forEach(key => {
      if (typeof fromState[key] === 'number' && typeof toState[key] === 'number') {
        const interpolatedValue = fromState[key] + (toState[key] - fromState[key]) * t;
        
        // Apply the interpolated value based on the property type
        if (key === 'x' || key === 'y') {
          element.attr(key, interpolatedValue);
        } else if (key === 'opacity') {
          element.style('opacity', interpolatedValue);
        } else if (key === 'scale') {
          element.style('transform', `scale(${interpolatedValue})`);
        }
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.animationQueue.length > 0) {
      const animation = this.animationQueue.shift();
      if (animation) {
        await animation();
      }
    }

    this.isProcessingQueue = false;
  }
}

/**
 * Animation sequence builder for coordinated animations
 */
export class AnimationSequence {
  private steps: Array<() => Promise<void>> = [];

  constructor(_animationManager: AnimationManager) {
    // Store reference if needed for future use
  }

  /**
   * Add animation step to sequence
   */
  public then(animationFunction: () => Promise<void>): AnimationSequence {
    this.steps.push(animationFunction);
    return this;
  }

  /**
   * Add parallel animations
   */
  public parallel(...animationFunctions: Array<() => Promise<void>>): AnimationSequence {
    this.steps.push(async () => {
      await Promise.all(animationFunctions.map(fn => fn()));
    });
    return this;
  }

  /**
   * Add delay to sequence
   */
  public delay(ms: number): AnimationSequence {
    this.steps.push(() => new Promise(resolve => setTimeout(resolve, ms)));
    return this;
  }

  /**
   * Execute the animation sequence
   */
  public async execute(): Promise<void> {
    for (const step of this.steps) {
      await step();
    }
  }
}

export default AnimationManager;