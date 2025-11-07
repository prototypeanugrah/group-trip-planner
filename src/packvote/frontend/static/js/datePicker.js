// Date picker functionality

/**
 * Initialize a date picker instance
 */
export function initDatePicker(prefix) {
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
  let isDropdownOpen = false;
  const container = trigger.closest('.date-picker-container');
  const getMinSelectableDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);
    return today;
  };
  const dropdownParent = dropdown.parentElement;
  const placeholder = document.createElement('span');
  placeholder.style.display = 'none';
  placeholder.dataset.datePickerAnchor = prefix;
  dropdownParent?.insertBefore(placeholder, dropdown.nextSibling);
  
  function moveDropdownToPortal() {
    if (typeof document === 'undefined') return;
    if (dropdown.dataset.portal === 'true') return;
    const body = document.body;
    if (!body) return;
    body.appendChild(dropdown);
    dropdown.dataset.portal = 'true';
    dropdown.style.position = 'fixed';
    dropdown.style.pointerEvents = 'auto';
    dropdown.style.zIndex = '2000';
  }
  
  function restoreDropdownToFlow() {
    if (dropdown.dataset.portal === 'true' && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(dropdown, placeholder);
      dropdown.dataset.portal = 'false';
      dropdown.style.position = '';
      dropdown.style.pointerEvents = '';
      dropdown.style.zIndex = '';
    }
  }
  
  function positionDropdown() {
    if (!isDropdownOpen) return;
    
    const rect = trigger.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    const dropdownHeight = dropdownRect.height || dropdown.offsetHeight || 320;
    const dropdownWidth = dropdownRect.width || dropdown.offsetWidth || 320;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 16;
    
    let placeAbove = (viewportHeight - rect.bottom) < (dropdownHeight + 24) && (rect.top - padding) > dropdownHeight;
    let top = rect.bottom + 12;
    
    if (placeAbove) {
      top = rect.top - dropdownHeight - 12;
      if (top < padding) {
        placeAbove = false;
        top = rect.bottom + 12;
      }
    }
    
    if (!placeAbove && (top + dropdownHeight) > (viewportHeight - padding)) {
      const potentialTop = rect.top - dropdownHeight - 12;
      if (potentialTop >= padding) {
        placeAbove = true;
        top = potentialTop;
      } else {
        top = Math.max(padding, viewportHeight - dropdownHeight - padding);
      }
    }
    
    const minLeft = padding;
    const maxLeft = viewportWidth - dropdownWidth - padding;
    const unclampedLeft = rect.left;
    const left = Math.min(Math.max(unclampedLeft, minLeft), Math.max(minLeft, maxLeft));
    
    dropdown.style.top = `${Math.round(top)}px`;
    dropdown.style.left = `${Math.round(left)}px`;
    dropdown.classList.toggle('bottom-up', placeAbove);
  }
  
  function openDropdown() {
    if (isDropdownOpen) return;
    isDropdownOpen = true;
    moveDropdownToPortal();
    dropdown.style.display = 'block';
    dropdown.classList.add('is-open');
    container?.classList.add('open');
    positionDropdown();
    window.addEventListener('resize', positionDropdown);
    document.addEventListener('scroll', positionDropdown, true);
  }
  
  function closeDropdown() {
    if (!isDropdownOpen) return;
    isDropdownOpen = false;
    dropdown.style.display = 'none';
    dropdown.classList.remove('bottom-up');
    dropdown.classList.remove('is-open');
    dropdown.style.top = '';
    dropdown.style.left = '';
    container?.classList.remove('open');
    restoreDropdownToFlow();
    window.removeEventListener('resize', positionDropdown);
    document.removeEventListener('scroll', positionDropdown, true);
  }
  
  dropdown.addEventListener('date-picker:force-close', () => closeDropdown());
  
  // Populate year dropdown (current year - 1 to + 20 years for high flexibility)
  function populateYears() {
    const minDate = getMinSelectableDate();
    const currentYear = minDate.getFullYear();
    yearSelect.innerHTML = '';
    for (let year = currentYear; year <= currentYear + 20; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
  }

  function updateMonthOptions() {
    const minDate = getMinSelectableDate();
    const minYear = minDate.getFullYear();
    const minMonth = minDate.getMonth();
    const selectedYear = parseInt(yearSelect.value, 10);
    let monthValue = parseInt(monthSelect.value, 10);
    
    Array.from(monthSelect.options).forEach(option => {
      const optionMonth = parseInt(option.value, 10);
      const shouldDisable = selectedYear === minYear && optionMonth < minMonth;
      option.disabled = shouldDisable;
      option.hidden = shouldDisable;
    });
    
    if (selectedYear === minYear && monthValue < minMonth) {
      monthSelect.value = minMonth;
      monthValue = minMonth;
      currentMonth = minMonth;
    }
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
  
  // Helper function to compare dates (ignoring time)
  function isDateInPast(date, referenceDate = getMinSelectableDate()) {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    compareDate.setMilliseconds(0);
    return compareDate < referenceDate;
  }
  
  // Render calendar
  function renderCalendar() {
    const minDate = getMinSelectableDate();
    if (currentYear < minDate.getFullYear()) {
      currentYear = minDate.getFullYear();
      yearSelect.value = currentYear;
    }
    if (currentYear === minDate.getFullYear() && currentMonth < minDate.getMonth()) {
      currentMonth = minDate.getMonth();
      monthSelect.value = currentMonth;
    }
    if (selectedDate && isDateInPast(selectedDate, minDate)) {
      selectedDate = null;
      hiddenInput.value = '';
      display.textContent = 'Select date';
    }
    
    updateMonthOptions();
    daysContainer.innerHTML = '';
    
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const today = minDate;
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
      dayDate.setHours(0, 0, 0, 0);
      
      // Check if date is in the past
      const isPast = isDateInPast(dayDate, minDate);
      if (isPast) {
        dayElement.classList.add('disabled');
        dayElement.disabled = true;
      }
      
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
      
      // Handle day click (only if not disabled)
      if (!isPast) {
        dayElement.addEventListener('click', () => {
          selectedDate = dayDate;
          hiddenInput.value = formatDateInput(selectedDate);
          display.textContent = formatDateDisplay(selectedDate);
          closeDropdown();
          
          // Update selected state in calendar
          renderCalendar();
        });
      }
      
      daysContainer.appendChild(dayElement);
    }
  }
  
  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    document.querySelectorAll('.date-picker-dropdown.is-open').forEach(dd => {
      if (dd !== dropdown) {
        dd.dispatchEvent(new CustomEvent('date-picker:force-close'));
      }
    });
    
    if (isDropdownOpen) {
      closeDropdown();
      return;
    }
    
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
    openDropdown();
  });
  
  // Handle month change
  monthSelect.addEventListener('change', () => {
    const minDate = getMinSelectableDate();
    const selectedYear = parseInt(yearSelect.value, 10);
    let nextMonth = parseInt(monthSelect.value, 10);
    if (selectedYear === minDate.getFullYear() && nextMonth < minDate.getMonth()) {
      nextMonth = minDate.getMonth();
      monthSelect.value = nextMonth;
    }
    currentMonth = nextMonth;
    renderCalendar();
  });
  
  // Handle year change
  yearSelect.addEventListener('change', () => {
    currentYear = parseInt(yearSelect.value);
    updateMonthOptions();
    renderCalendar();
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
      closeDropdown();
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
      closeDropdown();
      const now = new Date();
      monthSelect.value = now.getMonth();
      yearSelect.value = now.getFullYear();
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();
      renderCalendar();
    }
  };
}
