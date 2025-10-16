import { useEffect, useCallback } from 'react';
import { useRAGStore } from '../store/ragStore';
import { useTourStore } from '../store/tourStore';
import { KeyboardShortcut } from '../types/tour';

export const useKeyboardNavigation = () => {
  const { setCurrentModule } = useRAGStore();
  const { 
    tourProgress, 
    startTour, 
    stopTour, 
    nextStep, 
    previousStep, 
    toggleHelpPanel,
    toggleTooltips 
  } = useTourStore();

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Module navigation
    {
      key: '1',
      description: 'Go to Chunking module',
      action: () => setCurrentModule('chunking')
    },
    {
      key: '2',
      description: 'Go to Embedding module',
      action: () => setCurrentModule('embedding')
    },
    {
      key: '3',
      description: 'Go to Retrieval module',
      action: () => setCurrentModule('retrieval')
    },
    {
      key: '4',
      description: 'Go to Generation module',
      action: () => setCurrentModule('generation')
    },
    
    // Tour navigation
    {
      key: 't',
      description: 'Start/stop guided tour',
      action: () => tourProgress.isActive ? stopTour() : startTour()
    },
    {
      key: 'ArrowRight',
      description: 'Next tour step',
      action: () => tourProgress.isActive && nextStep()
    },
    {
      key: 'ArrowLeft',
      description: 'Previous tour step',
      action: () => tourProgress.isActive && previousStep()
    },
    {
      key: 'Escape',
      description: 'Exit tour',
      action: () => tourProgress.isActive && stopTour()
    },
    
    // Help and tooltips
    {
      key: 'h',
      description: 'Toggle help panel',
      action: () => toggleHelpPanel()
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => toggleHelpPanel()
    },
    {
      key: 'i',
      description: 'Toggle tooltips',
      action: () => toggleTooltips()
    },
    
    // Module-specific shortcuts
    {
      key: 'c',
      ctrlKey: true,
      description: 'Copy current configuration',
      action: () => {
        // This would copy current parameters to clipboard
        console.log('Copy configuration shortcut');
      }
    },
    {
      key: 'r',
      ctrlKey: true,
      description: 'Reset current module',
      action: () => {
        // This would reset current module parameters
        console.log('Reset module shortcut');
      }
    }
  ];

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!s.ctrlKey === event.ctrlKey;
      const altMatch = !!s.altKey === event.altKey;
      const shiftMatch = !!s.shiftKey === event.shiftKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus management for accessibility
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Tab navigation within modules
  const handleTabNavigation = useCallback((direction: 'forward' | 'backward') => {
    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
    let nextIndex;
    
    if (direction === 'forward') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= focusableElements.length) nextIndex = 0;
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = focusableElements.length - 1;
    }
    
    (focusableElements[nextIndex] as HTMLElement)?.focus();
  }, []);

  // ARIA live region announcements
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Skip links for accessibility
  const addSkipLinks = useCallback(() => {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#help" class="skip-link">Skip to help</a>
    `;
    
    // Add CSS for skip links
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 1000;
      }
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
      }
      .skip-link:focus {
        top: 6px;
      }
    `;
    
    if (!document.querySelector('.skip-links')) {
      document.head.appendChild(style);
      document.body.insertBefore(skipLinks, document.body.firstChild);
    }
  }, []);

  // Initialize accessibility features
  useEffect(() => {
    addSkipLinks();
  }, [addSkipLinks]);

  return {
    shortcuts,
    focusElement,
    handleTabNavigation,
    announceToScreenReader
  };
};