// Read budget map from data attribute
const budgetCard = document.getElementById("budget-card");
if (budgetCard) {
  const budgetMap = JSON.parse(budgetCard.dataset.budgets);
  const budgetCards = document.querySelectorAll('#budget-cards .pill');
  const budgetRangeInput = document.getElementById('budget_range');
  budgetCards.forEach(card => {
    card.addEventListener('click', () => {
      budgetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const cat = parseInt(card.dataset.budget);
      budgetRangeInput.value = JSON.stringify(budgetMap[cat]["range"]);
    });
  });
}

// Pref tiles toggle UI
document.querySelectorAll('.pref').forEach(tile => {
  const cb = tile.querySelector('input[type="checkbox"]');
  
  // Handle clicks on the label/tile
  tile.addEventListener('click', (e) => {
    // Prevent double-toggle if clicking directly on the checkbox
    if (e.target !== cb) {
      e.preventDefault();
      cb.checked = !cb.checked;
    }
    updateActiveState(tile, cb);
  });
  
  // Handle checkbox change events to sync visual state
  cb.addEventListener('change', () => {
    updateActiveState(tile, cb);
  });
  
  // Initialize active state
  updateActiveState(tile, cb);
});

function updateActiveState(tile, checkbox) {
  if (!tile || !checkbox) return;
  
  if (checkbox.checked) {
    tile.classList.add('active');
  } else {
    tile.classList.remove('active');
  }
}

// Stepper
const minus = document.getElementById('minus');
const plus = document.getElementById('plus');
const dur  = document.getElementById('travel_duration');
if (minus && plus && dur) {
  minus.onclick = () => { dur.value = Math.max(parseInt(dur.min), (parseInt(dur.value)||1) - 1); };
  plus.onclick  = () => { dur.value = Math.min(parseInt(dur.max), (parseInt(dur.value)||1) + 1); };
}

// Phone number validation - only allow digits, show warning if exceeds 10
function setupPhoneValidation(phoneInput, warningElement) {
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

// Guard submit: ensure budget chosen & hidden filled
const surveyForm = document.getElementById('survey-form');
if (surveyForm) {
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
        const cat = parseInt(chosen.value);
        budgetRangeInput.value = JSON.stringify(budgetMap[cat]["range"]);
      }
    }
  });
  
  // Setup phone validation
  setupPhoneValidation(
    document.getElementById('phone'),
    document.getElementById('phone-warning')
  );
}

// ========== Project Management ==========

// Modal functions
function showModal() {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.style.display = 'flex';
    const input = document.getElementById('modal-project-name');
    if (input) {
      input.focus();
      input.value = '';
    }
  }
}

function hideModal() {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Show modal on overlay click (but not on modal content)
const modalOverlay = document.querySelector('.modal-overlay');
const modalContent = document.querySelector('.modal-content');
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    // Only close if clicking the overlay itself, not the content
    if (e.target === modalOverlay) {
      hideModal();
    }
  });
}

// Show modal on "Create Your First Project" button
const createFirstProjectBtn = document.getElementById('create-first-project-btn');
if (createFirstProjectBtn) {
  createFirstProjectBtn.addEventListener('click', showModal);
}

// Modal create button
const modalCreateBtn = document.getElementById('modal-create-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalProjectNameInput = document.getElementById('modal-project-name');

if (modalCreateBtn) {
  modalCreateBtn.addEventListener('click', async () => {
    const projectName = modalProjectNameInput.value.trim();
    if (!projectName) {
      alert('Please enter a project name');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('name', projectName);
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const project = await response.json();
        hideModal();
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
  modalCancelBtn.addEventListener('click', hideModal);
}

// Allow Enter key to submit in modal
if (modalProjectNameInput) {
  modalProjectNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && modalCreateBtn) {
      modalCreateBtn.click();
    }
  });
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const projectModal = document.getElementById('project-modal');
    const participantModal = document.getElementById('participant-form-modal');
    
    if (projectModal && projectModal.style.display !== 'none') {
      hideModal();
    } else if (participantModal && participantModal.style.display !== 'none') {
      hideParticipantFormModal();
    }
  }
});

// Load and display participants for a project
async function loadParticipants(projectSafeName) {
  try {
    const response = await fetch(`/api/projects/${projectSafeName}/submissions`);
    if (response.ok) {
      const participants = await response.json();
      displayParticipants(participants);
      updateParticipantsCount(participants.length);
    }
  } catch (error) {
    console.error('Error loading participants:', error);
  }
}

// Helper function to capitalize names and locations properly
function capitalizeText(text) {
  if (!text) return 'N/A';
  
  // Handle locations with commas (e.g., "Austin, TX" or "San Francisco, CA")
  if (text.includes(',')) {
    return text.split(',').map((part, index) => {
      const trimmed = part.trim();
      if (index === 1) {
        // State abbreviation - keep uppercase
        return trimmed.toUpperCase();
      }
      // City name - capitalize each word
      return trimmed.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    }).join(', ');
  }
  
  // For names without commas, capitalize each word
  return text.split(' ').map(word => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function displayParticipants(participants) {
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
  
  const budgetLabels = { 1: 'Low', 2: 'Medium', 3: 'High' };
  
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
      <td>${participant.travel_date || 'N/A'}</td>
      <td>${participant.travel_duration || 'N/A'} days</td>
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
}

function updateParticipantsCount(count) {
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
}

// Project selection
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
    
    // Load participants and update count
    loadParticipants(projectSafeName);
  });
});

// New project form toggle (sidebar form - for when projects already exist)
const newProjectBtn = document.getElementById('new-project-btn');
const newProjectForm = document.getElementById('new-project-form');
const cancelProjectBtn = document.getElementById('cancel-project-btn');
const createProjectBtn = document.getElementById('create-project-btn');
const newProjectNameInput = document.getElementById('new-project-name');

if (newProjectBtn) {
  newProjectBtn.addEventListener('click', () => {
    // Use modal instead of inline form
    showModal();
  });
}

if (cancelProjectBtn) {
  cancelProjectBtn.addEventListener('click', () => {
    newProjectForm.style.display = 'none';
    newProjectNameInput.value = '';
  });
}

// Create new project from sidebar form
if (createProjectBtn) {
  createProjectBtn.addEventListener('click', async () => {
    const projectName = newProjectNameInput.value.trim();
    if (!projectName) {
      alert('Please enter a project name');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('name', projectName);
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const project = await response.json();
        // Reload page to show new project
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

// Load submission counts for all projects
async function loadSubmissionCount(projectSafeName) {
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
}

// Participant form modal handlers
function showParticipantFormModal() {
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
      // Reset duration
      const durationInput = document.getElementById('form-travel_duration');
      if (durationInput) durationInput.value = 3;
      // Reset phone
      const formPhoneInput = document.getElementById('form-phone');
      if (formPhoneInput) formPhoneInput.value = '';
      // Hide phone warning
      const formPhoneWarning = document.getElementById('form-phone-warning');
      if (formPhoneWarning) formPhoneWarning.style.display = 'none';
      // Reset date picker
      if (datePickerInstances.form_travel_date && datePickerInstances.form_travel_date.reset) {
        datePickerInstances.form_travel_date.reset();
      }
    }
    // Re-initialize preference handlers after a small delay to ensure DOM is ready
    // Use a longer delay to ensure form.reset() has completed
    setTimeout(() => {
      initParticipantFormPreferences();
    }, 100);
  }
}

function hideParticipantFormModal() {
  const modal = document.getElementById('participant-form-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Add Participant button
const addParticipantBtn = document.getElementById('add-participant-btn');
if (addParticipantBtn) {
  addParticipantBtn.addEventListener('click', () => {
    showParticipantFormModal();
  });
}

// Participant form cancel button
const formCancelBtn = document.getElementById('form-cancel-btn');
if (formCancelBtn) {
  formCancelBtn.addEventListener('click', hideParticipantFormModal);
}

// Participant form overlay click
const participantModalOverlay = document.querySelector('#participant-form-modal .modal-overlay');
if (participantModalOverlay) {
  participantModalOverlay.addEventListener('click', (e) => {
    if (e.target === participantModalOverlay) {
      hideParticipantFormModal();
    }
  });
}

// Initialize preferences handlers separately so they can be re-initialized
function initParticipantFormPreferences() {
  const prefGrid = document.getElementById('form-pref-grid');
  if (!prefGrid) return;
  
  // Get all preference tiles
  const prefTiles = document.querySelectorAll('#form-pref-grid .pref');
  
  prefTiles.forEach((tile) => {
    const cb = tile.querySelector('input[type="checkbox"]');
    if (!cb) return;
    
    // Create unique handler functions for this tile
    const clickHandler = function(e) {
      // The label will automatically toggle the checkbox when clicked
      // We need to wait a moment for the checkbox state to update, then update visual
      // Use both setTimeout and requestAnimationFrame for reliability
      requestAnimationFrame(() => {
        setTimeout(() => {
          updateActiveState(tile, cb);
        }, 0);
      });
    };
    
    const changeHandler = function() {
      // This fires when checkbox state changes (most reliable)
      updateActiveState(tile, this);
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

// Initialize form handlers for participant modal
function initParticipantFormHandlers() {
  // Budget cards
  const formBudgetCard = document.getElementById('form-budget-card');
  if (formBudgetCard) {
    const formBudgetMap = JSON.parse(formBudgetCard.dataset.budgets);
    const formBudgetCards = document.querySelectorAll('#form-budget-cards .pill');
    const formBudgetRangeInput = document.getElementById('form-budget_range');
    
    formBudgetCards.forEach(card => {
      card.addEventListener('click', () => {
        formBudgetCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const cat = parseInt(card.dataset.budget);
        formBudgetRangeInput.value = JSON.stringify(formBudgetMap[cat]["range"]);
      });
    });
  }
  
  // Initialize preferences
  initParticipantFormPreferences();
  
  // Stepper
  const formMinus = document.getElementById('form-minus');
  const formPlus = document.getElementById('form-plus');
  const formDur = document.getElementById('form-travel_duration');
  if (formMinus && formPlus && formDur) {
    formMinus.onclick = () => { 
      formDur.value = Math.max(parseInt(formDur.min), (parseInt(formDur.value)||1) - 1); 
    };
    formPlus.onclick = () => { 
      formDur.value = Math.min(parseInt(formDur.max), (parseInt(formDur.value)||1) + 1); 
    };
  }
  
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
          const cat = parseInt(chosen.value);
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
          hideParticipantFormModal();
          loadParticipants(projectSafeName);
          // Reload submission count for the project
          loadSubmissionCount(projectSafeName);
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

// ========== Dropdown Menu Handlers ==========

// Close all dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown-menu-container')) {
    document.querySelectorAll('.dropdown-menu-container').forEach(container => {
      container.classList.remove('active');
    });
  }
});

// Toggle dropdown on trigger click
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.dropdown-trigger');
  if (trigger) {
    e.stopPropagation();
    const container = trigger.closest('.dropdown-menu-container');
    const isActive = container.classList.contains('active');
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu-container').forEach(c => {
      c.classList.remove('active');
    });
    
    // Toggle current dropdown
    if (!isActive) {
      container.classList.add('active');
    }
  }
});

// Prevent project item click when clicking on dropdown
document.addEventListener('click', (e) => {
  if (e.target.closest('.dropdown-menu-container') || e.target.closest('.project-item-actions')) {
    e.stopPropagation();
  }
});

// ========== Delete Project Handler ==========
document.addEventListener('click', async (e) => {
  if (e.target.closest('.delete-project')) {
    e.stopPropagation();
    const button = e.target.closest('.delete-project');
    const container = button.closest('.dropdown-menu-container');
    if (container) {
      container.classList.remove('active');
    }
    
    const projectSafeName = button.dataset.project;
    const projectName = button.dataset.projectName;
    
    if (!confirm(`Are you sure you want to delete "${projectName}"? This will permanently delete the project and all its participants.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectSafeName}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Reload page to reflect changes
        window.location.href = '/';
      } else {
        const error = await response.text();
        alert(`Error deleting project: ${error}`);
      }
    } catch (error) {
      alert(`Error deleting project: ${error.message}`);
    }
  }
});

// ========== Delete Participant Handler ==========
document.addEventListener('click', async (e) => {
  if (e.target.closest('.delete-participant')) {
    e.stopPropagation();
    const button = e.target.closest('.delete-participant');
    const container = button.closest('.dropdown-menu-container');
    if (container) {
      container.classList.remove('active');
    }
    
    const participantId = button.dataset.participantId;
    
    // Get current project
    const activeProject = document.querySelector('.project-item.active');
    if (!activeProject) {
      alert('Please select a project first');
      return;
    }
    
    const projectSafeName = activeProject.dataset.project;
    
    if (!confirm('Are you sure you want to delete this participant? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectSafeName}/submissions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participant_id: participantId })
      });
      
      if (response.ok) {
        // Reload participants
        loadParticipants(projectSafeName);
        // Reload submission count
        loadSubmissionCount(projectSafeName);
      } else {
        const error = await response.text();
        alert(`Error deleting participant: ${error}`);
      }
    } catch (error) {
      alert(`Error deleting participant: ${error.message}`);
    }
  }
});

// ========== Location Autocomplete ==========

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize location autocomplete for an input field
function initLocationAutocomplete(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  // Create dropdown container
  const dropdown = document.createElement('div');
  dropdown.className = 'location-autocomplete-dropdown';
  dropdown.style.display = 'none';
  
  // Insert dropdown after input's parent
  const inputParent = input.parentElement;
  inputParent.style.position = 'relative';
  inputParent.appendChild(dropdown);
  
  let selectedIndex = -1;
  let suggestions = [];
  
  // Fetch suggestions from API
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      dropdown.style.display = 'none';
      suggestions = [];
      return;
    }
    
    try {
      const response = await fetch(`/api/location/autocomplete?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        // Handle error response
        if (data.error) {
          console.error('Error from API:', data.error);
          dropdown.style.display = 'none';
          suggestions = [];
          return;
        }
        suggestions = Array.isArray(data) ? data : [];
        displaySuggestions();
      } else {
        dropdown.style.display = 'none';
        suggestions = [];
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      dropdown.style.display = 'none';
      suggestions = [];
    }
  };
  
  // Display suggestions in dropdown
  const displaySuggestions = () => {
    if (suggestions.length === 0) {
      dropdown.style.display = 'none';
      return;
    }
    
    dropdown.innerHTML = '';
    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'location-autocomplete-item';
      item.textContent = suggestion.display_name;
      item.addEventListener('click', () => {
        input.value = suggestion.display_name;
        dropdown.style.display = 'none';
        selectedIndex = -1;
        // Trigger input event to ensure form validation works
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
  };
  
  // Debounced search function
  const debouncedSearch = debounce(fetchSuggestions, 300);
  
  // Handle input events
  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    selectedIndex = -1;
    debouncedSearch(query);
  });
  
  // Handle keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
      updateSelectedItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelectedItem();
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      input.value = suggestions[selectedIndex].display_name;
      dropdown.style.display = 'none';
      selectedIndex = -1;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      selectedIndex = -1;
    }
  });
  
  // Update selected item styling
  const updateSelectedItem = () => {
    const items = dropdown.querySelectorAll('.location-autocomplete-item');
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  };
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!inputParent.contains(e.target)) {
      dropdown.style.display = 'none';
      selectedIndex = -1;
    }
  });
}

// ========== Date Picker ==========

// Initialize a date picker instance
function initDatePicker(prefix) {
  const trigger = document.getElementById(`${prefix}_trigger`);
  const dropdown = document.getElementById(`${prefix}_dropdown`);
  const display = document.getElementById(`${prefix}_display`);
  const hiddenInput = document.getElementById(prefix);
  const monthSelect = document.getElementById(`${prefix}_month`);
  const yearSelect = document.getElementById(`${prefix}_year`);
  const daysContainer = document.getElementById(`${prefix}_days`);
  
  if (!trigger || !dropdown || !display || !hiddenInput || !monthSelect || !yearSelect || !daysContainer) {
    return;
  }
  
  let selectedDate = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  
  // Populate year dropdown (current year - 1 to + 20 years for high flexibility)
  function populateYears() {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let year = currentYear - 1; year <= currentYear + 20; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
  }
  
  // Get days in month
  function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }
  
  // Get first day of month (0 = Sunday, 6 = Saturday)
  function getFirstDayOfMonth(month, year) {
    return new Date(year, month, 1).getDay();
  }
  
  // Format date for display
  function formatDateDisplay(date) {
    if (!date) return 'Select date';
    const d = new Date(date);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  
  // Format date for hidden input (YYYY-MM-DD)
  function formatDateInput(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Render calendar
  function renderCalendar() {
    daysContainer.innerHTML = '';
    
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const today = new Date();
    const isTodayMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'date-picker-day disabled';
      daysContainer.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('button');
      dayElement.type = 'button';
      dayElement.className = 'date-picker-day';
      dayElement.textContent = day;
      
      const dayDate = new Date(currentYear, currentMonth, day);
      
      // Check if it's today
      if (isTodayMonth && day === today.getDate()) {
        dayElement.classList.add('today');
      }
      
      // Check if it's selected
      if (selectedDate) {
        const selected = new Date(selectedDate);
        if (selected.getFullYear() === currentYear &&
            selected.getMonth() === currentMonth &&
            selected.getDate() === day) {
          dayElement.classList.add('selected');
        }
      }
      
      // Handle day click
      dayElement.addEventListener('click', () => {
        selectedDate = dayDate;
        hiddenInput.value = formatDateInput(selectedDate);
        display.textContent = formatDateDisplay(selectedDate);
        dropdown.style.display = 'none';
        
        // Update selected state in calendar
        renderCalendar();
      });
      
      daysContainer.appendChild(dayElement);
    }
  }
  
  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.style.display !== 'none';
    
    // Close all other date pickers
    document.querySelectorAll('.date-picker-dropdown').forEach(dd => {
      if (dd !== dropdown) {
        dd.style.display = 'none';
      }
    });
    
    dropdown.style.display = isOpen ? 'none' : 'block';
    
    // Update month/year selects to match selected date or current date
    if (selectedDate) {
      const d = new Date(selectedDate);
      monthSelect.value = d.getMonth();
      yearSelect.value = d.getFullYear();
      currentMonth = d.getMonth();
      currentYear = d.getFullYear();
    } else {
      const now = new Date();
      monthSelect.value = now.getMonth();
      yearSelect.value = now.getFullYear();
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();
    }
    
    renderCalendar();
  });
  
  // Handle month change
  monthSelect.addEventListener('change', () => {
    currentMonth = parseInt(monthSelect.value);
    renderCalendar();
  });
  
  // Handle year change
  yearSelect.addEventListener('change', () => {
    currentYear = parseInt(yearSelect.value);
    renderCalendar();
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
  
  // Initialize
  populateYears();
  renderCalendar();
  
  // Return reset function for external use
  return {
    reset: () => {
      selectedDate = null;
      hiddenInput.value = '';
      display.textContent = 'Select date';
      dropdown.style.display = 'none';
      const now = new Date();
      monthSelect.value = now.getMonth();
      yearSelect.value = now.getFullYear();
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();
      renderCalendar();
    }
  };
}

// Store date picker instances for reset functionality
let datePickerInstances = {};

// Load all submission counts on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize date pickers
  datePickerInstances.travel_date = initDatePicker('travel_date');
  datePickerInstances.form_travel_date = initDatePicker('form-travel_date');
  
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
  
  // Check if there are no projects - show modal automatically
  const emptyStateContainer = document.getElementById('empty-state-container');
  const projectsList = document.getElementById('projects-list');
  const hasProjects = projectsList && projectsList.querySelector('.project-item');
  
  if (!hasProjects && emptyStateContainer) {
    // Show modal automatically on first load with no projects
    setTimeout(() => {
      showModal();
    }, 300); // Small delay for better UX
  }
  
  // Load participants for active project
  const activeProject = document.querySelector('.project-item.active');
  if (activeProject) {
    const projectSafeName = activeProject.dataset.project;
    loadParticipants(projectSafeName);
  }
  
  // Load submission counts for existing projects
  document.querySelectorAll('.project-item').forEach(item => {
    const projectSafeName = item.dataset.project;
    loadSubmissionCount(projectSafeName);
  });
});
