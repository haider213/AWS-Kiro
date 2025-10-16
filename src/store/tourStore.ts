import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { TourStep, TourProgress, ConfigurationShare } from '../types/tour'

interface TourStore {
  // Tour state
  tourProgress: TourProgress;
  availableSteps: TourStep[];
  
  // UI state
  showTooltips: boolean;
  activeTooltip: string | null;
  showHelpPanel: boolean;
  helpSearchQuery: string;
  
  // Configuration sharing
  savedConfigurations: ConfigurationShare[];
  
  // Actions
  setAvailableSteps: (steps: TourStep[]) => void;
  startTour: () => void;
  stopTour: () => void;
  goToStep: (stepId: string) => void;
  completeStep: (stepId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Tooltip actions
  toggleTooltips: () => void;
  showTooltip: (tooltipId: string) => void;
  hideTooltip: () => void;
  
  // Help actions
  toggleHelpPanel: () => void;
  setHelpSearchQuery: (query: string) => void;
  
  // Configuration sharing
  saveConfiguration: (config: Omit<ConfigurationShare, 'id' | 'createdAt'>) => void;
  loadConfiguration: (configId: string) => void;
  deleteConfiguration: (configId: string) => void;
  generateShareUrl: (configId: string) => string;
}

const initialTourProgress: TourProgress = {
  currentStepId: null,
  completedSteps: [],
  isActive: false,
};

export const useTourStore = create<TourStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tourProgress: initialTourProgress,
        availableSteps: [],
        showTooltips: true,
        activeTooltip: null,
        showHelpPanel: false,
        helpSearchQuery: '',
        savedConfigurations: [],

        // Tour actions
        setAvailableSteps: (steps) => {
          set({ availableSteps: steps });
        },

        startTour: () => {
          const steps = get().availableSteps;
          const firstStep = steps.find(step => step.order === 1);
          
          set({
            tourProgress: {
              currentStepId: firstStep?.id || null,
              completedSteps: [],
              isActive: true,
              startedAt: new Date(),
            }
          });
        },

        stopTour: () => {
          set({
            tourProgress: {
              ...get().tourProgress,
              isActive: false,
              completedAt: new Date(),
            }
          });
        },

        goToStep: (stepId: string) => {
          const steps = get().availableSteps;
          const step = steps.find(s => s.id === stepId);
          
          if (step) {
            set({
              tourProgress: {
                ...get().tourProgress,
                currentStepId: stepId,
              }
            });
          }
        },

        completeStep: (stepId: string) => {
          const progress = get().tourProgress;
          const completedSteps = [...progress.completedSteps];
          
          if (!completedSteps.includes(stepId)) {
            completedSteps.push(stepId);
          }
          
          set({
            tourProgress: {
              ...progress,
              completedSteps,
            }
          });
        },

        nextStep: () => {
          const { tourProgress, availableSteps } = get();
          const currentStep = availableSteps.find(s => s.id === tourProgress.currentStepId);
          
          if (currentStep) {
            const nextStep = availableSteps.find(s => s.order === currentStep.order + 1);
            if (nextStep) {
              set({
                tourProgress: {
                  ...tourProgress,
                  currentStepId: nextStep.id,
                }
              });
            }
          }
        },

        previousStep: () => {
          const { tourProgress, availableSteps } = get();
          const currentStep = availableSteps.find(s => s.id === tourProgress.currentStepId);
          
          if (currentStep) {
            const prevStep = availableSteps.find(s => s.order === currentStep.order - 1);
            if (prevStep) {
              set({
                tourProgress: {
                  ...tourProgress,
                  currentStepId: prevStep.id,
                }
              });
            }
          }
        },

        // Tooltip actions
        toggleTooltips: () => {
          set({ showTooltips: !get().showTooltips });
        },

        showTooltip: (tooltipId: string) => {
          set({ activeTooltip: tooltipId });
        },

        hideTooltip: () => {
          set({ activeTooltip: null });
        },

        // Help actions
        toggleHelpPanel: () => {
          set({ showHelpPanel: !get().showHelpPanel });
        },

        setHelpSearchQuery: (query: string) => {
          set({ helpSearchQuery: query });
        },

        // Configuration sharing
        saveConfiguration: (config) => {
          const newConfig: ConfigurationShare = {
            ...config,
            id: `config_${Date.now()}`,
            createdAt: new Date(),
          };
          
          set({
            savedConfigurations: [...get().savedConfigurations, newConfig]
          });
        },

        loadConfiguration: (configId: string) => {
          // This will be implemented to load configuration into the main RAG store
          const config = get().savedConfigurations.find(c => c.id === configId);
          if (config) {
            // Implementation will be added when integrating with main store
            console.log('Loading configuration:', config);
          }
        },

        deleteConfiguration: (configId: string) => {
          set({
            savedConfigurations: get().savedConfigurations.filter(c => c.id !== configId)
          });
        },

        generateShareUrl: (configId: string) => {
          const config = get().savedConfigurations.find(c => c.id === configId);
          if (config) {
            const encodedConfig = btoa(JSON.stringify(config));
            return `${window.location.origin}?config=${encodedConfig}`;
          }
          return '';
        },
      }),
      {
        name: 'tour-store',
        partialize: (state) => ({
          tourProgress: state.tourProgress,
          showTooltips: state.showTooltips,
          savedConfigurations: state.savedConfigurations,
        }),
      }
    ),
    {
      name: 'tour-store',
    }
  )
)