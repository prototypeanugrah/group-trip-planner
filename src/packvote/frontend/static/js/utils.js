// Utility functions

/**
 * Updates the active state of a tile based on checkbox state
 */
export function updateActiveState(tile, checkbox) {
  if (!tile || !checkbox) return;
  
  if (checkbox.checked) {
    tile.classList.add('active');
  } else {
    tile.classList.remove('active');
  }
}

/**
 * Capitalizes text properly, handling locations with commas
 */
export function capitalizeText(text) {
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

/**
 * Debounce function to limit API calls
 */
export function debounce(func, wait) {
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

