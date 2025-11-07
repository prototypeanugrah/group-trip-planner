// Dropdown menu handlers and delete operations

/**
 * Initialize dropdown menu functionality
 */
export function initDropdownMenus() {
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
}

/**
 * Initialize delete project handler
 */
export function initDeleteProjectHandler() {
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
}

/**
 * Initialize delete participant handler
 */
export function initDeleteParticipantHandler() {
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
          if (window.projectManager) {
            window.projectManager.loadParticipants(projectSafeName);
            window.projectManager.loadSubmissionCount(projectSafeName);
          }
        } else {
          const error = await response.text();
          alert(`Error deleting participant: ${error}`);
        }
      } catch (error) {
        alert(`Error deleting participant: ${error.message}`);
      }
    }
  });
}

