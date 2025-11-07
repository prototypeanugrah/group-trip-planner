// Location autocomplete functionality

import { debounce } from './utils.js';

/**
 * Initialize location autocomplete for an input field
 */
export function initLocationAutocomplete(inputId) {
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

