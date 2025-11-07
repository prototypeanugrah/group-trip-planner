// Form handling functionality (budget, preferences, stepper, phone validation, form submission)

import { updateActiveState } from './utils.js';

/**
 * Initialize budget card handlers
 */
export function initBudgetCards(prefix = '') {
  const budgetCardId = prefix ? `form-budget-card` : 'budget-card';
  const budgetCard = document.getElementById(budgetCardId);
  if (!budgetCard) return;
  
  const budgetMap = JSON.parse(budgetCard.dataset.budgets);
  const budgetCards = document.querySelectorAll(`${prefix ? '#form-' : '#'}budget-cards .pill`);
  const budgetRangeInput = document.getElementById(`${prefix}budget_range`);
  
  budgetCards.forEach(card => {
    card.addEventListener('click', () => {
      budgetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const cat = card.dataset.budget;
      budgetRangeInput.value = JSON.stringify(budgetMap[cat]["range"]);
    });
  });
}

/**
 * Initialize preference tiles
 */
export function initPreferences(prefix = '') {
  const prefGridId = prefix ? 'form-pref-grid' : 'pref-grid';
  const prefTiles = document.querySelectorAll(`#${prefGridId} .pref`);
  
  prefTiles.forEach((tile) => {
    const cb = tile.querySelector('input[type="checkbox"]');
    if (!cb) return;
    
    // Create unique handler functions for this tile
    const clickHandler = function(e) {
      // The label will automatically toggle the checkbox when clicked
      // We need to wait a moment for the checkbox state to update, then update visual
      requestAnimationFrame(() => {
        setTimeout(() => {
          updateActiveState(tile, cb);
        }, 0);
      });
    };
    
    const changeHandler = function() {
      // This fires when checkbox state changes (most reliable)
      updateActiveState(tile, cb);
    };
    
    // Remove old listeners if they exist (stored as properties)
    if (tile._clickHandler) {
      tile.removeEventListener('click', tile._clickHandler);
    }
    if (cb._changeHandler) {
      cb.removeEventListener('change', cb._changeHandler);
    }
    
    // Add new listeners and store references
    tile.addEventListener('click', clickHandler, false);
    cb.addEventListener('change', changeHandler, false);
    
    // Store references for later removal
    tile._clickHandler = clickHandler;
    cb._changeHandler = changeHandler;
    
    // Initialize visual state
    updateActiveState(tile, cb);
  });
}

/**
 * Initialize stepper (duration) controls
 */
export function initStepper(prefix = '') {
  const id = (name) => `${prefix || ''}${name}`;
  const minus = document.getElementById(id('minus'));
  const plus = document.getElementById(id('plus'));
  const input = document.getElementById(id('travel_duration'));
  
  if (!minus || !plus || !input) return;
  
  const getValue = () => parseInt(input.value, 10) || parseInt(input.min, 10) || 1;
  const getMin = () => parseInt(input.min, 10) || 1;
  const getMax = () => parseInt(input.max, 10) || 60;
  const clamp = (val) => Math.min(getMax(), Math.max(getMin(), val));
  
  const handleMinus = () => {
    input.value = clamp(getValue() - 1);
    input.dispatchEvent(new Event('change'));
  };
  
  const handlePlus = () => {
    input.value = clamp(getValue() + 1);
    input.dispatchEvent(new Event('change'));
  };
  
  minus.addEventListener('click', handleMinus);
  plus.addEventListener('click', handlePlus);
}

/**
 * Setup phone number validation
 */
export function setupPhoneValidation(phoneInput, warningElement) {
  if (!phoneInput) return;
  
  phoneInput.addEventListener('input', (e) => {
    // Remove all non-digit characters
    let value = e.target.value.replace(/\D/g, '');
    e.target.value = value;
    
    // Show/hide warning based on length
    if (warningElement) {
      const digitCount = value.length;
      if (digitCount > 10) {
        warningElement.style.display = 'block';
        warningElement.textContent = `Phone number has ${digitCount} digits. Must be exactly 10 digits.`;
      } else {
        warningElement.style.display = 'none';
      }
    }
  });
  
  phoneInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const digits = pasted.replace(/\D/g, '');
    phoneInput.value = digits;
    
    // Trigger input event to show warning if needed
    phoneInput.dispatchEvent(new Event('input'));
  });
}

/**
 * Initialize main survey form submission
 */
export function initSurveyForm() {
  const surveyForm = document.getElementById('survey-form');
  if (!surveyForm) return;
  
  surveyForm.addEventListener('submit', (e) => {
    const projectName = document.getElementById('project_name').value;
    if (!projectName) {
      e.preventDefault();
      alert('Please select a project from the sidebar first.');
      return false;
    }
    
    // Validate phone number
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      const phoneValue = phoneInput.value.replace(/\D/g, '');
      if (phoneValue.length !== 10) {
        e.preventDefault();
        alert('Phone number must be exactly 10 digits.');
        return false;
      }
    }
    
    const chosen = document.querySelector('input[name="budget_category"]:checked');
    if (!chosen) {
      e.preventDefault();
      alert('Please choose a budget category first.');
      return false;
    }
    const budgetRangeInput = document.getElementById('budget_range');
    if (budgetRangeInput && !budgetRangeInput.value) {
      const budgetCard = document.getElementById("budget-card");
      if (budgetCard) {
        const budgetMap = JSON.parse(budgetCard.dataset.budgets);
        const cat = chosen.value;
        budgetRangeInput.value = JSON.stringify(budgetMap[cat]["range"]);
      }
    }
  });
}

/**
 * Initialize participant form handlers
 */
export function initParticipantFormHandlers() {
  // Budget cards
  initBudgetCards('form-');
  
  // Initialize preferences
  initParticipantFormPreferences();
  
  // Stepper
  initStepper('form-');
  
  // Form submission
  const participantForm = document.getElementById('participant-form');
  if (participantForm) {
    participantForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Ensure project is selected and project_name is set
      const activeProject = document.querySelector('.project-item.active');
      if (!activeProject) {
        alert('Please select a project first');
        return false;
      }
      
      const formProjectName = document.getElementById('form-project-name');
      if (formProjectName) {
        formProjectName.value = activeProject.dataset.project;
      }
      
      // Validate phone number
      const formPhoneInput = document.getElementById('form-phone');
      if (formPhoneInput) {
        const phoneValue = formPhoneInput.value.replace(/\D/g, '');
        if (phoneValue.length !== 10) {
          alert('Phone number must be exactly 10 digits.');
          return false;
        }
      }
      
      const formBudgetRangeInput = document.getElementById('form-budget_range');
      const chosen = participantForm.querySelector('input[name="budget_category"]:checked');
      
      if (!chosen) {
        alert('Please choose a budget category first.');
        return false;
      }
      
      if (!formBudgetRangeInput.value) {
        const formBudgetCard = document.getElementById('form-budget-card');
        if (formBudgetCard) {
          const formBudgetMap = JSON.parse(formBudgetCard.dataset.budgets);
          const cat = chosen.value;
          formBudgetRangeInput.value = JSON.stringify(formBudgetMap[cat]["range"]);
        }
      }
      
      // Submit form
      const formData = new FormData(participantForm);
      try {
        const response = await fetch('/submit', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok || response.redirected) {
          // Reload participants
          const projectSafeName = activeProject.dataset.project;
          if (window.projectManager) {
            window.projectManager.hideParticipantFormModal();
            window.projectManager.loadParticipants(projectSafeName);
            window.projectManager.loadSubmissionCount(projectSafeName);
          }
        } else {
          const error = await response.text();
          alert(`Error adding participant: ${error}`);
        }
      } catch (error) {
        alert(`Error adding participant: ${error.message}`);
      }
    });
  }
}

/**
 * Initialize preferences handlers separately so they can be re-initialized
 */
export function initParticipantFormPreferences() {
  const prefGrid = document.getElementById('form-pref-grid');
  if (!prefGrid) return;
  
  initPreferences('form-');
}
