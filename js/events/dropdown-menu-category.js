import { getCategoryOptions } from "../templates/add-task-template.js";
import { toggleDropdownIcon, setBorderColorGrey, updateSelectedCategory as updateCategoryValue } from "./dropdown-menu-core.js";

/** Toggles the category dropdown.
 * Opens or closes the dropdown and populates it with options.
 */
export function toggleCategoryDropdown() {
  const { wrapper, container, input } = getCategoryElements();
  if (!wrapper || !container) return;

  const isOpen = wrapper.classList.contains("open");
  clearCategory();
  toggleDropdownIcon("category");

  isOpen ? closeDropdown(wrapper, container) : openDropdown(wrapper, container, input);
}

/** Gets category dropdown DOM elements.
 * @returns {Object} Category dropdown elements.
 */
function getCategoryElements() {
  return {
    wrapper: document.getElementById("category-options-wrapper"),
    container: document.getElementById("category-options-container"),
    input: document.getElementById("dropdown-category")
  };
}

/** Opens the category dropdown.
 * @param {HTMLElement} wrapper - Wrapper element.
 * @param {HTMLElement} container - Container element.
 * @param {HTMLElement} input - Input element.
 */
function openDropdown(wrapper, container, input) {
  input.classList.add("border-light-blue");
  container.innerHTML = getCategoryOptions();
  requestAnimationFrame(() => wrapper.classList.add("open"));
}

/** Closes the category dropdown.
 * @param {HTMLElement} wrapper - Wrapper element.
 * @param {HTMLElement} container - Container element.
 */
function closeDropdown(wrapper, container) {
  setBorderColorGrey("dropdown-category");
  wrapper.classList.remove("open");
  setTimeout(() => container.innerHTML = "", 300);
}

/** Sets the selected category in the dropdown.
 * Updates the selected category text and hidden input value.
 * @param {HTMLElement} optionElement - The selected option element.
 * @returns {string} The selected category value.
 */
export function setCategory(optionElement) {
  const elements = getCategorySetElements();
  if (!isValidCategoryElements(elements)) return null;

  updateCategoryUI(elements.selected, elements.hiddenInput, optionElement);
  resetCategoryError();
  closeCategoryDropdownAtSet(elements.wrapper, elements.optionsContainer);
  toggleDropdownIcon("category");
  setBorderColorGrey("dropdown-category");

  const categoryValue = optionElement.dataset.category;
  updateCategoryValue(categoryValue);
  return categoryValue;
}

/** Gets elements for setting category.
 * @returns {Object} Category elements.
 */
function getCategorySetElements() {
  return {
    wrapper: document.getElementById("category-options-wrapper"),
    selected: document.getElementById("selected-category"),
    optionsContainer: document.getElementById("category-options-container"),
    hiddenInput: document.getElementById("hidden-category-input")
  };
}

/** Validates category elements.
 * @param {Object} elements - Elements to validate.
 * @returns {boolean} True if valid.
 */
function isValidCategoryElements(elements) {
  return !!(elements.selected && elements.hiddenInput && 
            elements.wrapper && elements.optionsContainer);
}

/** Updates the selected category text and hidden input value.
 * @param {HTMLElement} selected - Selected category display element.
 * @param {HTMLElement} hiddenInput - Hidden input element.
 * @param {HTMLElement} optionElement - Selected option element.
 */
function updateCategoryUI(selected, hiddenInput, optionElement) {
  selected.textContent = optionElement.textContent;
  hiddenInput.value = optionElement.textContent;
}

/** Resets the category error state.
 */
function resetCategoryError() {
  const dropdownCategory = document.getElementById("dropdown-category");
  const categoryError = document.getElementById("category-error");
  
  if (dropdownCategory) {
    dropdownCategory.classList.remove("invalid");
    categoryError?.classList.remove("d-flex");
  }
}

/** Closes the category dropdown and clears options.
 * @param {HTMLElement} wrapper - Wrapper element.
 * @param {HTMLElement} optionsContainer - Options container.
 */
function closeCategoryDropdownAtSet(wrapper, optionsContainer) {
  wrapper.classList.remove("open");
  optionsContainer.innerHTML = "";
}

/** Creates a demo selected category.
 * @param {string} categoryName - The name of the category to select.
 */
export function demoSelectCategory(categoryName = "User Story") {
  const fakeOptionElement = createFakeOption(categoryName);
  setCategory(fakeOptionElement);
  toggleDropdownIcon("category");
}

/** Creates a fake option element.
 * @param {string} categoryName - Category name.
 * @returns {HTMLElement} Fake option element.
 */
function createFakeOption(categoryName) {
  const element = document.createElement("div");
  element.textContent = categoryName;
  element.dataset.category = categoryName;
  return element;
}

/** Clears the selected category.
 */
export function clearCategory() {
  updateCategoryValue(null);
  const selected = document.getElementById("selected-category");
  if (selected) {
    selected.textContent = "Select task category";
  }
}