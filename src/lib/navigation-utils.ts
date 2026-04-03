// Navigation utility functions for smooth scrolling and user experience

/**
 * Scrolls to top of page smoothly
 * Call this when navigating between tabs or sections
 */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Scrolls to top instantly (no animation)
 * Use for initial page loads
 */
export function scrollToTopInstant() {
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * Scrolls to a specific element by ID
 */
export function scrollToElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Hook for handling tab changes with scroll
 * Usage: const handleTabChange = useScrollOnTabChange(setActiveTab);
 */
export function createTabChangeHandler<T>(setTab: (tab: T) => void) {
  return (tab: T) => {
    setTab(tab);
    scrollToTop();
  };
}
