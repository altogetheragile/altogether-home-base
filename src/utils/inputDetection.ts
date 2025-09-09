/**
 * Utility function to detect if the user is currently typing in an input field
 * This prevents global keyboard shortcuts from interfering with normal text input
 */
export const isTypingInInputField = (): boolean => {
  const activeElement = document.activeElement;
  return activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    (activeElement as HTMLElement).contentEditable === 'true'
  ) || false;
};