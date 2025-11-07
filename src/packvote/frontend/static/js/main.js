// Main entry point - imports and initializes all modules

import { initBudgetCards, initPreferences, initStepper, setupPhoneValidation, initSurveyForm, initParticipantFormHandlers } from './formHandlers.js';
import { initDatePicker } from './datePicker.js';
import { initLocationAutocomplete } from './locationAutocomplete.js';
import { projectManager } from './projectManager.js';
import { initDropdownMenus, initDeleteProjectHandler, initDeleteParticipantHandler } from './dropdownMenus.js';

  // Initialize main form handlers
initBudgetCards();
initPreferences();
initStepper();
initSurveyForm();

// Initialize project modal stepper
initStepper('modal-');

// Setup phone validation for main form
setupPhoneValidation(
  document.getElementById('phone'),
  document.getElementById('phone-warning')
);

// Store date picker instances for reset functionality
let datePickerInstances = {};

// Load all submission counts on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize date pickers
  datePickerInstances.travel_date = initDatePicker('travel_date');
  datePickerInstances.form_travel_date = initDatePicker('form-travel_date');
  datePickerInstances.modal_travel_date = initDatePicker('modal-travel_date');
  
  // Pass date picker instances to project manager
  projectManager.setDatePickerInstances(datePickerInstances);
  
  // Initialize participant form handlers
  initParticipantFormHandlers();
  
  // Setup phone validation for modal form
  setupPhoneValidation(
    document.getElementById('form-phone'),
    document.getElementById('form-phone-warning')
  );
  
  // Initialize location autocomplete for both inputs
  initLocationAutocomplete('current_location');
  initLocationAutocomplete('form-current_location');
  
  // Initialize project management
  projectManager.initProjectModals();
  projectManager.initProjectSelection();
  projectManager.initEscKeyHandler();
  
  // Initialize dropdown menus
  initDropdownMenus();
  initDeleteProjectHandler();
  initDeleteParticipantHandler();
  
  // Check if there are no projects - show modal automatically
  const emptyStateContainer = document.getElementById('empty-state-container');
  const projectsList = document.getElementById('projects-list');
  const hasProjects = projectsList && projectsList.querySelector('.project-item');
  
  if (!hasProjects && emptyStateContainer) {
    // Show modal automatically on first load with no projects
    setTimeout(() => {
      projectManager.showModal();
    }, 300); // Small delay for better UX
  }
  
  // Load participants for active project
  const activeProject = document.querySelector('.project-item.active');
  if (activeProject) {
    const projectSafeName = activeProject.dataset.project;
    projectManager.loadParticipants(projectSafeName);
  }
  
  // Load submission counts for existing projects
  document.querySelectorAll('.project-item').forEach(item => {
    const projectSafeName = item.dataset.project;
    projectManager.loadSubmissionCount(projectSafeName);
  });
});
