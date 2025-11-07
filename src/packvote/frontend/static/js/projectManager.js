// Project management functionality (modals, project selection, participants)

import { capitalizeText } from './utils.js';
import { initParticipantFormPreferences } from './formHandlers.js';

// Store date picker instances for reset functionality
let datePickerInstances = {};

/**
 * Project Manager module
 */
export const projectManager = {
  // Modal functions
  showModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
      modal.style.display = 'flex';
      const input = document.getElementById('modal-project-name');
      if (input) {
        input.focus();
        input.value = '';
      }
      // Reset travel date and duration
      const durationInput = document.getElementById('modal-travel_duration');
      if (durationInput) durationInput.value = 3;
      if (datePickerInstances.modal_travel_date && datePickerInstances.modal_travel_date.reset) {
        datePickerInstances.modal_travel_date.reset();
      }
    }
  },

  hideModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Participant form modal handlers
  showParticipantFormModal() {
    const modal = document.getElementById('participant-form-modal');
    if (modal) {
      // Ensure project is selected before showing modal
      const activeProject = document.querySelector('.project-item.active');
      if (!activeProject) {
        alert('Please select a project first');
        return;
      }
      
      modal.style.display = 'flex';
      // Reset form
      const form = document.getElementById('participant-form');
      if (form) {
        form.reset();
        
        // Set project name BEFORE resetting (to ensure it's preserved)
        const formProjectName = document.getElementById('form-project-name');
        if (formProjectName && activeProject) {
          formProjectName.value = activeProject.dataset.project;
        }
        
        // Reset budget
        document.querySelectorAll('#form-budget-cards .pill').forEach(p => p.classList.remove('active'));
        const formBudgetRangeInput = document.getElementById('form-budget_range');
        if (formBudgetRangeInput) formBudgetRangeInput.value = '';
        // Reset preferences - uncheck all and remove active class
        document.querySelectorAll('#form-pref-grid .pref').forEach(p => {
          const cb = p.querySelector('input[type="checkbox"]');
          if (cb) {
            cb.checked = false;
          }
          p.classList.remove('active');
        });
        // Reset phone
        const formPhoneInput = document.getElementById('form-phone');
        if (formPhoneInput) formPhoneInput.value = '';
        // Hide phone warning
        const formPhoneWarning = document.getElementById('form-phone-warning');
        if (formPhoneWarning) formPhoneWarning.style.display = 'none';
      }
      // Re-initialize preference handlers after a small delay to ensure DOM is ready
      setTimeout(() => {
        initParticipantFormPreferences();
      }, 100);
    }
  },

  hideParticipantFormModal() {
    const modal = document.getElementById('participant-form-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Load and display participants for a project
  async loadParticipants(projectSafeName) {
    try {
      const response = await fetch(`/api/projects/${projectSafeName}/submissions`);
      if (response.ok) {
        const data = await response.json();
        // Handle both old format (array) and new format (object with travel_date, travel_duration, submissions)
        let participants, travelDate, travelDuration;
        if (Array.isArray(data)) {
          participants = data;
          travelDate = null;
          travelDuration = null;
        } else {
          participants = data.submissions || [];
          travelDate = data.travel_date || null;
          travelDuration = data.travel_duration || null;
        }
        this.displayParticipants(participants);
        this.updateParticipantsCount(participants.length);
        this.displayTravelInfo(travelDate, travelDuration);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  },
  
  // Display travel info at top of project page
  displayTravelInfo(travelDate, travelDuration) {
    const travelInfoContainer = document.getElementById('project-travel-info');
    const travelDateEl = document.getElementById('project-travel-date');
    const travelDurationEl = document.getElementById('project-travel-duration');
    
    if (!travelInfoContainer || !travelDateEl || !travelDurationEl) return;
    
    if (travelDate && travelDuration) {
      // Format date for display
      const date = new Date(travelDate);
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      
      travelDateEl.textContent = `📅 ${formattedDate}`;
      travelDurationEl.textContent = `⏱️ ${travelDuration} day${travelDuration !== 1 ? 's' : ''}`;
      travelInfoContainer.style.display = 'flex';
    } else {
      travelInfoContainer.style.display = 'none';
    }
  },

  displayParticipants(participants) {
    const tbody = document.getElementById('participants-tbody');
    const emptyState = document.getElementById('participants-empty');
    const table = document.getElementById('participants-table');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (participants.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (table) table.style.display = 'none';
      return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (table) table.style.display = 'table';
    
    const budgetLabels = { 'low': 'Low', 'medium': 'Medium', 'high': 'High' };
    
    participants.forEach(participant => {
      const row = document.createElement('tr');
      
      // Format date
      const addedDate = participant.added_at 
        ? new Date(participant.added_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'N/A';
      
      // Format preferences
      const prefs = participant.preferences && participant.preferences.length > 0
        ? participant.preferences.map(p => `<span class="preference-tag">${p}</span>`).join('')
        : '<span class="muted">None</span>';
      
      // Capitalize name and location
      const capitalizedName = capitalizeText(participant.name);
      const capitalizedLocation = capitalizeText(participant.current_location);
      
      // Create a unique identifier for the participant (name + phone + added_at)
      const participantId = encodeURIComponent(JSON.stringify({
        name: participant.name,
        phone: participant.phone,
        added_at: participant.added_at
      }));
      
      row.innerHTML = `
        <td><strong>${capitalizedName}</strong></td>
        <td>${capitalizedLocation}</td>
        <td><span class="budget-label">${budgetLabels[participant.budget_category] || 'N/A'}</span></td>
        <td><div class="preferences-list">${prefs}</div></td>
        <td>${addedDate}</td>
        <td>
          <div class="dropdown-menu-container">
            <button class="dropdown-trigger" type="button" aria-label="Participant options">
              <span class="three-dots">⋯</span>
            </button>
            <div class="dropdown-menu">
              <button class="dropdown-item delete-participant" data-participant-id="${participantId}">Delete Participant</button>
            </div>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  },

  updateParticipantsCount(count) {
    const countEl = document.getElementById('participants-count');
    if (countEl) {
      countEl.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
    }
    
    // Update badge in sidebar
    const activeProject = document.querySelector('.project-item.active');
    if (activeProject) {
      const projectSafeName = activeProject.dataset.project;
      const badge = document.getElementById(`count-${projectSafeName}`);
      if (badge) {
        badge.textContent = count;
      }
    }
  },

  // Load submission counts for all projects
  async loadSubmissionCount(projectSafeName) {
    try {
      const response = await fetch(`/api/projects/${projectSafeName}/submissions`);
      if (response.ok) {
        const submissions = await response.json();
        const badge = document.getElementById(`count-${projectSafeName}`);
        if (badge) {
          badge.textContent = submissions.length;
        }
      }
    } catch (error) {
      console.error('Error loading submission count:', error);
    }
  },

  // Initialize project selection
  initProjectSelection() {
    const self = this;
    document.querySelectorAll('.project-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger project selection if clicking on dropdown or actions
        if (e.target.closest('.dropdown-menu-container') || e.target.closest('.project-item-actions')) {
          return;
        }
        
        const projectSafeName = item.dataset.project;
        const projectName = item.dataset.projectName;
        
        // Update active state
        document.querySelectorAll('.project-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Show participants container, hide form
        const participantsContainer = document.getElementById('participants-container');
        const surveyFormContainer = document.getElementById('survey-form-container');
        if (participantsContainer) {
          participantsContainer.style.display = 'block';
          document.getElementById('participants-project-name').textContent = projectName;
        }
        if (surveyFormContainer) {
          surveyFormContainer.style.display = 'none';
        }
        
        // Update form project name (for modal)
        const formProjectName = document.getElementById('form-project-name');
        if (formProjectName) {
          formProjectName.value = projectSafeName;
        }
        
        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('project', projectSafeName);
        window.history.pushState({}, '', url);
        
        // Load participants and update count (this will also load travel info)
        self.loadParticipants(projectSafeName);
      });
    });
  },

  // Initialize project creation modals
  initProjectModals() {
    // Show modal on overlay click (but not on modal content)
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        // Only close if clicking the overlay itself, not the content
        if (e.target === modalOverlay) {
          this.hideModal();
        }
      });
    }

    // Show modal on "Create Your First Project" button
    const createFirstProjectBtn = document.getElementById('create-first-project-btn');
    if (createFirstProjectBtn) {
      createFirstProjectBtn.addEventListener('click', () => this.showModal());
    }

    // Modal create button
    const modalCreateBtn = document.getElementById('modal-create-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalProjectNameInput = document.getElementById('modal-project-name');

    const isDateBeforeToday = (value) => {
      if (!value) return true;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsed.setHours(0, 0, 0, 0);
      return parsed < today;
    };

    if (modalCreateBtn) {
      modalCreateBtn.addEventListener('click', async () => {
        const projectName = modalProjectNameInput.value.trim();
        if (!projectName) {
          alert('Please enter a project name');
          return;
        }
        
        const travelDateInput = document.getElementById('modal-travel_date');
        const travelDurationInput = document.getElementById('modal-travel_duration');
        
        if (!travelDateInput || !travelDateInput.value) {
          alert('Please select a travel date');
          return;
        }
        if (isDateBeforeToday(travelDateInput.value)) {
          alert('Travel date cannot be in the past');
          return;
        }
        
        if (!travelDurationInput || !travelDurationInput.value) {
          alert('Please enter travel duration');
          return;
        }
        
        try {
          const formData = new FormData();
          formData.append('name', projectName);
          formData.append('travel_date', travelDateInput.value);
          formData.append('travel_duration', travelDurationInput.value);
          
          const response = await fetch('/api/projects', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const project = await response.json();
            this.hideModal();
            // Reload page to show new project and participants list
            window.location.href = `/?project=${project.safe_name}`;
          } else {
            const error = await response.text();
            alert(`Error creating project: ${error}`);
          }
        } catch (error) {
          alert(`Error creating project: ${error.message}`);
        }
      });
    }

    if (modalCancelBtn) {
      modalCancelBtn.addEventListener('click', () => this.hideModal());
    }

    // Allow Enter key to submit in modal
    if (modalProjectNameInput) {
      modalProjectNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && modalCreateBtn) {
          modalCreateBtn.click();
        }
      });
    }

    // New project form toggle (sidebar form - for when projects already exist)
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
      newProjectBtn.addEventListener('click', () => {
        // Use modal instead of inline form
        this.showModal();
      });
    }

    // Participant form modal handlers
    const addParticipantBtn = document.getElementById('add-participant-btn');
    if (addParticipantBtn) {
      addParticipantBtn.addEventListener('click', () => {
        this.showParticipantFormModal();
      });
    }

    // Participant form cancel button
    const formCancelBtn = document.getElementById('form-cancel-btn');
    if (formCancelBtn) {
      formCancelBtn.addEventListener('click', () => this.hideParticipantFormModal());
    }

    // Participant form overlay click
    const participantModalOverlay = document.querySelector('#participant-form-modal .modal-overlay');
    if (participantModalOverlay) {
      participantModalOverlay.addEventListener('click', (e) => {
        if (e.target === participantModalOverlay) {
          this.hideParticipantFormModal();
        }
      });
    }
  },

  // Close modal on ESC key
  initEscKeyHandler() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const projectModal = document.getElementById('project-modal');
        const participantModal = document.getElementById('participant-form-modal');
        
        if (projectModal && projectModal.style.display !== 'none') {
          this.hideModal();
        } else if (participantModal && participantModal.style.display !== 'none') {
          this.hideParticipantFormModal();
        }
      }
    });
  },

  // Set date picker instances (called from main.js)
  setDatePickerInstances(instances) {
    datePickerInstances = instances;
  }
};

// Make projectManager available globally for backward compatibility
window.projectManager = projectManager;
