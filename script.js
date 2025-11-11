/**
 * Coastal Soil Erosion Prediction System
 * Main JavaScript file for prediction calculations and UI interactions
 */

// ============================================
// Constants and Configuration
// ============================================

// Formula coefficients
const FORMULA_CONSTANT = 81610.062;
const SEAWALL_COEFFICIENT = -54.458;
const TYPHOON_COEFFICIENT = 2665.351;
const FLOOD_COEFFICIENT = 2048.205;

// DOM Elements
const form = document.getElementById('predictionForm');
const predictBtn = document.getElementById('predictBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsSection = document.getElementById('resultsSection');
const soilLossValue = document.getElementById('soilLossValue');
const soilTypeValue = document.getElementById('soilTypeValue');
const recommendationsSection = document.getElementById('recommendationsSection');
const recommendationsLoading = document.getElementById('recommendationsLoading');
const recommendationsText = document.getElementById('recommendationsText');
const detailedRecommendationsSection = document.getElementById('detailedRecommendationsSection');
const soilLossRecommendations = document.getElementById('soilLossRecommendations');
const soilTypeRecommendations = document.getElementById('soilTypeRecommendations');
const vegetationRecommendations = document.getElementById('vegetationRecommendations');
const soilLossContent = document.getElementById('soilLossContent');
const soilTypeContent = document.getElementById('soilTypeContent');
const vegetationContent = document.getElementById('vegetationContent');

// API Configuration
const API_BASE_URL = '/api';

// ============================================
// Utility Functions
// ============================================

/**
 * Formats a number with thousand separators and decimal places
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
function formatNumber(num, decimals = 2) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Rounds a number to the nearest integer
 * @param {number} num - The number to round
 * @returns {number} Rounded integer
 */
function roundToNearestInteger(num) {
    return Math.round(num);
}

/**
 * Validates if input is a valid positive number
 * @param {string} value - Input value to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && isFinite(num);
}

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculates predicted soil loss using the formula:
 * Predicted Soil Loss = 81610.062 - 54.458 * S + 2665.351 * T + 2048.205 * F
 * 
 * @param {number} seawallLength - Seawall length in meters (S)
 * @param {number} typhoons - Number of typhoons per year (T)
 * @param {number} floods - Number of floods per year (F)
 * @returns {number} Predicted soil loss in metric tons per year
 */
function calculateSoilLoss(seawallLength, typhoons, floods) {
    // Ensure inputs are numbers
    const S = parseFloat(seawallLength) || 0;
    const T = parseFloat(typhoons) || 0;
    const F = parseFloat(floods) || 0;
    
    // Apply the formula
    const soilLoss = FORMULA_CONSTANT 
        + (SEAWALL_COEFFICIENT * S)
        + (TYPHOON_COEFFICIENT * T)
        + (FLOOD_COEFFICIENT * F);
    
    // Ensure non-negative result (soil loss cannot be negative)
    return Math.max(0, soilLoss);
}

/**
 * Gets the display name for a soil type
 */
function getSoilTypeDisplayName(soilType) {
    const names = {
        sandy: 'Sandy Soil',
        clay: 'Clay Soil',
        loamy: 'Loamy Soil',
        silty: 'Silty Soil',
        peaty: 'Peaty Soil',
        chalky: 'Chalky Soil'
    };
    return names[soilType] || soilType;
}

// ============================================
// UI Update Functions
// ============================================

/**
 * Updates the results section with calculated values
 * @param {number} soilLoss - Predicted soil loss value
 * @param {string} soilType - Selected soil type
 */
function displayResults(soilLoss, soilType) {
    // Format and display soil loss
    soilLossValue.textContent = formatNumber(soilLoss);
    
    // Display soil type
    soilTypeValue.textContent = getSoilTypeDisplayName(soilType);
    
    // Show results section with animation
    resultsSection.style.display = 'block';
    
    // Fetch and display AI recommendations
    fetchRecommendations(soilLoss, getSoilTypeDisplayName(soilType));
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }, 100);
}

/**
 * Fetches AI recommendations from the backend API
 * @param {number} soilLoss - Predicted soil loss value
 * @param {string} soilType - Selected soil type display name
 */
async function fetchRecommendations(soilLoss, soilType) {
    // Show recommendations section and loading state
    recommendationsSection.style.display = 'block';
    recommendationsLoading.style.display = 'flex';
    recommendationsText.style.display = 'none';
    recommendationsText.textContent = '';
    
    // Hide detailed recommendations section while loading
    detailedRecommendationsSection.style.display = 'none';
    soilLossRecommendations.style.display = 'none';
    soilTypeRecommendations.style.display = 'none';
    vegetationRecommendations.style.display = 'none';
    soilLossContent.textContent = '';
    soilTypeContent.textContent = '';
    vegetationContent.textContent = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                soil_type: soilType,
                soil_loss: soilLoss
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.recommendations) {
            // Hide loading, show recommendations
            recommendationsLoading.style.display = 'none';
            recommendationsText.style.display = 'block';
            
            // Format and display recommendations
            const formattedText = formatRecommendations(data.recommendations, soilLoss, soilType);
            recommendationsText.innerHTML = formattedText;
            
            // Show footer
            const footer = document.getElementById('recommendationsFooter');
            if (footer) {
                footer.style.display = 'block';
            }
            
            // Display detailed recommendations if available
            if (data.detailed_recommendations) {
                displayDetailedRecommendations(data.detailed_recommendations);
            }
        } else {
            throw new Error(data.error || 'Failed to get recommendations');
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        recommendationsLoading.style.display = 'none';
        recommendationsText.style.display = 'block';
        recommendationsText.innerHTML = `
            <div class="recommendations-error">
                <p>⚠️ Unable to fetch recommendations at this time.</p>
                <p class="error-detail">${error.message}</p>
                <p class="error-hint">Please ensure the backend server is running on port 5000.</p>
            </div>
        `;
    }
}

/**
 * Formats the AI recommendations text for display
 * @param {string} recommendations - Raw recommendations text from AI
 * @param {number} soilLoss - Predicted soil loss value
 * @param {string} soilType - Selected soil type
 * @returns {string} Formatted HTML string
 */
function formatRecommendations(recommendations, soilLoss, soilType) {
    // Extract tree/plant names and quantities from the recommendations
    const lines = recommendations.split('\n').filter(line => line.trim());
    const items = [];
    
    // Pattern to match various formats:
    // "🌳 Mahogany – 25 trees recommended"
    // "Mahogany – 25 trees"
    // "25 – Mahogany trees"
    const patterns = [
        /[🌳🌴🌾🌿🌱]?\s*([^–\-:0-9]+?)\s*[–\-:]\s*(\d+)\s*([^–\-:]*)/i,  // Name – Number Unit
        /(\d+)\s*[–\-:]\s*[🌳🌴🌾🌿🌱]?\s*([^–\-:]+)/i,  // Number – Name
    ];
    
    lines.forEach(line => {
        const trimmed = line.trim();
        
        // Skip empty lines, markdown headers, and intro/explanation text
        if (!trimmed || 
            trimmed.startsWith('#') || 
            trimmed.startsWith('**') ||
            trimmed.startsWith('*') ||
            trimmed.toLowerCase().includes('based on') ||
            trimmed.toLowerCase().includes('okay, so') ||
            trimmed.toLowerCase().includes('i need to') ||
            trimmed.toLowerCase().includes('i remember') ||
            trimmed.toLowerCase().includes('i think') ||
            trimmed.toLowerCase().includes('maybe') ||
            trimmed.toLowerCase().includes('hmm') ||
            trimmed.toLowerCase().includes('wait') ||
            trimmed.toLowerCase().includes('i\'m not sure') ||
            trimmed.toLowerCase().includes('i should') ||
            trimmed.toLowerCase().includes('putting it all together') ||
            trimmed.toLowerCase().includes('to address') ||
            trimmed.toLowerCase().includes('important:') ||
            trimmed.toLowerCase().includes('additional') ||
            trimmed.toLowerCase().includes('maintenance') ||
            trimmed.toLowerCase().includes('spacing:') ||
            trimmed.toLowerCase().includes('benefits:') ||
            trimmed.toLowerCase().includes('quantity:') ||
            trimmed.toLowerCase().includes('hectare') ||
            trimmed.toLowerCase().includes('per hectare') ||
            (trimmed.toLowerCase().includes('recommended') && !trimmed.match(/\d+/)) ||
            trimmed.toLowerCase().includes('these species') ||
            trimmed.toLowerCase().includes('combining') ||
            trimmed.toLowerCase().includes('provide') ||
            trimmed.toLowerCase().includes('chosen for') ||
            trimmed.toLowerCase().includes('promoting') ||
            trimmed.length > 100) {  // Skip long explanation paragraphs
            return;
        }
        
        // Try to extract tree name and quantity
        for (const pattern of patterns) {
            const match = trimmed.match(pattern);
            if (match) {
                let name, quantity, unit = '';
                
                if (match[1] && match[1].match(/\d+/)) {
                    // Reversed format: number first (pattern 2)
                    quantity = match[1];
                    name = match[2].trim();
                } else {
                    // Normal format: name first (pattern 1)
                    name = match[1].trim();
                    quantity = match[2];
                    unit = match[3] ? match[3].trim() : '';
                }
                
                // Clean up the name (remove emojis, extra words)
                name = name.replace(/[🌳🌴🌾🌿🌱]/g, '').trim();
                name = name.replace(/\s*(recommended|trees?|plants?|clumps?|clusters?)\s*$/gi, '').trim();
                
                // Extract unit from quantity part if not already extracted
                if (!unit && quantity) {
                    const unitMatch = trimmed.match(/\d+\s*([a-z]+)/i);
                    if (unitMatch) {
                        unit = unitMatch[1];
                    }
                }
                
                // Build full quantity string
                let quantityText = quantity;
                if (unit && !quantityText.includes(unit)) {
                    quantityText += ' ' + unit;
                } else if (!unit) {
                    // Default unit based on name
                    if (name.toLowerCase().includes('grass')) {
                        quantityText += ' clumps';
                    } else if (name.toLowerCase().includes('bamboo')) {
                        quantityText += ' clusters';
                    } else {
                        quantityText += ' trees';
                    }
                }
                
                if (name && quantity) {
                    items.push({ name, quantity: quantityText });
                    break;
                }
            }
        }
    });
    
    // If no items found, try a simpler extraction with more patterns
    if (items.length === 0) {
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.match(/\d+/) && trimmed.length < 120) {
                // Try multiple extraction patterns
                
                // Pattern 1: Number at start, then name
                const numFirstMatch = trimmed.match(/^(\d+)\s+([a-z\s]+)/i);
                if (numFirstMatch) {
                    const name = numFirstMatch[2].trim().replace(/\s*(recommended|trees?|plants?|clumps?|clusters?)\s*$/gi, '').trim();
                    if (name && name.length > 2) {
                        const quantity = numFirstMatch[1] + ' trees';
                        items.push({ name, quantity });
                        return;
                    }
                }
                
                // Pattern 2: Name then number
                const numMatch = trimmed.match(/(\d+)/);
                const nameMatch = trimmed.match(/^[🌳🌴🌾🌿🌱]?\s*([^0-9–\-:]+)/);
                if (numMatch && nameMatch) {
                    let name = nameMatch[1].trim().replace(/[–\-:]\s*$/, '').trim();
                    name = name.replace(/\s*(recommended|trees?|plants?|clumps?|clusters?)\s*$/gi, '').trim();
                    
                    if (name && name.length > 2) {
                        // Determine unit based on name
                        let unit = 'trees';
                        if (name.toLowerCase().includes('grass')) {
                            unit = 'clumps';
                        } else if (name.toLowerCase().includes('bamboo')) {
                            unit = 'clusters';
                        }
                        const quantity = numMatch[1] + ' ' + unit;
                        items.push({ name, quantity });
                    }
                }
            }
        });
    }
    
    // Remove duplicates based on name (case-insensitive)
    const seen = new Set();
    const uniqueItems = [];
    items.forEach(item => {
        const key = item.name.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
        }
    });
    items.length = 0;
    items.push(...uniqueItems);
    
    // Build table HTML
    if (items.length === 0) {
        // Fallback: show raw text but cleaned up
        return `<div class="recommendations-list">${recommendations}</div>`;
    }
    
    let html = '<table class="recommendations-table">';
    html += '<thead><tr><th>Tree/Plant</th><th>Recommended Quantity</th></tr></thead>';
    html += '<tbody>';
    items.forEach(item => {
        html += `<tr>
            <td class="recommendation-name">${item.name}</td>
            <td class="recommendation-quantity">${item.quantity}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    
    return html;
}

/**
 * Displays detailed recommendations in three sections
 * @param {object} detailedRecommendations - Object with soil_loss, soil_type, and vegetation sections
 */
function displayDetailedRecommendations(detailedRecommendations) {
    console.log('Displaying detailed recommendations:', detailedRecommendations);
    
    // Show detailed recommendations section
    detailedRecommendationsSection.style.display = 'block';
    
    // Display Section 1: Based on Soil Loss
    if (detailedRecommendations.soil_loss && detailedRecommendations.soil_loss.trim()) {
        soilLossContent.innerHTML = formatRecommendationText(detailedRecommendations.soil_loss);
        soilLossRecommendations.style.display = 'block';
        console.log('Section 1 displayed');
    } else {
        console.log('Section 1 empty or missing');
    }
    
    // Display Section 2: Based on Soil Type
    if (detailedRecommendations.soil_type && detailedRecommendations.soil_type.trim()) {
        soilTypeContent.innerHTML = formatRecommendationText(detailedRecommendations.soil_type);
        soilTypeRecommendations.style.display = 'block';
        console.log('Section 2 displayed');
    } else {
        console.log('Section 2 empty or missing');
    }
    
    // Display Section 3: For Vegetation
    if (detailedRecommendations.vegetation && detailedRecommendations.vegetation.trim()) {
        vegetationContent.innerHTML = formatRecommendationText(detailedRecommendations.vegetation);
        vegetationRecommendations.style.display = 'block';
        console.log('Section 3 displayed');
    } else {
        console.log('Section 3 empty or missing');
    }
}

/**
 * Formats recommendation text for display (handles bullet points, paragraphs, etc.)
 * @param {string} text - Raw recommendation text
 * @returns {string} Formatted HTML
 */
function formatRecommendationText(text) {
    if (!text) return '';
    
    // Clean up the text - remove section headers and explanations
    let cleanedText = text.replace(/SECTION\s*[123][:\-]?\s*/gi, '').trim();
    
    // Remove verbose explanations
    const skipPatterns = [
        /that's\s+a\s+/i,
        /i\s+should\s+/i,
        /i\s+need\s+to\s+/i,
        /moving\s+on\s+to/i,
        /finally/i,
        /comes\s+to\s+mind/i
    ];
    
    // Split by lines
    const lines = cleanedText.split('\n').filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        
        // Skip section headers
        if (trimmed.match(/^SECTION\s*[123]/i)) return false;
        
        // Skip explanation lines
        if (skipPatterns.some(pattern => pattern.test(trimmed))) return false;
        
        // Skip very long lines (likely explanations)
        if (trimmed.length > 200) return false;
        
        return true;
    });
    
    let html = '';
    let hasBullets = false;
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Check if it's a bullet point
        if (trimmed.match(/^[-•*]\s/) || trimmed.match(/^\d+[\.\)]\s/)) {
            hasBullets = true;
            // Remove bullet marker and clean content
            let content = trimmed.replace(/^[-•*\d\.\)]\s+/, '').trim();
            // Remove markdown bold
            content = content.replace(/\*\*([^*]+)\*\*/g, '$1');
            // Remove extra spaces
            content = content.replace(/\s+/g, ' ');
            
            if (content && content.length > 5) {
                html += `<div class="recommendation-item-text" style="animation-delay: ${index * 0.1}s">${content}</div>`;
            }
        }
    });
    
    // If no bullets found, try to extract from paragraphs
    if (!hasBullets && lines.length > 0) {
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && trimmed.length < 200 && trimmed.length > 10) {
                // Skip if it looks like an explanation
                if (!skipPatterns.some(pattern => pattern.test(trimmed))) {
                    html += `<div class="recommendation-item-text" style="animation-delay: ${index * 0.1}s">${trimmed}</div>`;
                }
            }
        });
    }
    
    return html || '';
}

function resetResults() {
    resultsSection.style.display = 'none';
    recommendationsSection.style.display = 'none';
    detailedRecommendationsSection.style.display = 'none';
    recommendationsText.textContent = '';
    soilLossContent.textContent = '';
    soilTypeContent.textContent = '';
    vegetationContent.textContent = '';
    soilLossRecommendations.style.display = 'none';
    soilTypeRecommendations.style.display = 'none';
    vegetationRecommendations.style.display = 'none';
    const footer = document.getElementById('recommendationsFooter');
    if (footer) {
        footer.style.display = 'none';
    }
    form.reset();
    
    // Remove validation states
    const inputs = form.querySelectorAll('.form-input, .form-select');
    inputs.forEach(input => {
        input.classList.remove('valid', 'invalid');
    });
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Input Validation and Handling
// ============================================

/**
 * Validates all form inputs
 * @returns {boolean} True if all inputs are valid
 */
function validateForm() {
    const seawallLength = document.getElementById('seawallLength').value;
    const typhoons = document.getElementById('typhoons').value;
    const floods = document.getElementById('floods').value;
    const soilType = document.getElementById('soilType').value;
    
    return isValidNumber(seawallLength) && 
           isValidNumber(typhoons) && 
           isValidNumber(floods) &&
           soilType !== '';
}

/**
 * Handles input validation in real-time
 * @param {Event} event - Input event
 */
function handleInputValidation(event) {
    const input = event.target;
    const value = input.value.trim();
    
    // Handle select dropdowns
    if (input.tagName === 'SELECT') {
        if (value === '') {
            input.classList.remove('valid', 'invalid');
        } else {
            input.classList.add('valid');
            input.classList.remove('invalid');
        }
        return;
    }
    
    // Handle number inputs
    if (value === '') {
        input.classList.remove('valid', 'invalid');
        return;
    }
    
    if (isValidNumber(value)) {
        input.classList.add('valid');
        input.classList.remove('invalid');
    } else {
        input.classList.add('invalid');
        input.classList.remove('valid');
    }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handles form submission and triggers prediction
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form inputs
    if (!validateForm()) {
        alert('Please enter valid positive numbers for all fields and select a soil type.\n\nMangyaring maglagay ng wastong positibong numero para sa lahat ng patlang at pumili ng uri ng lupa.');
        return;
    }
    
    // Get input values
    const seawallLength = parseFloat(document.getElementById('seawallLength').value);
    const typhoons = parseFloat(document.getElementById('typhoons').value);
    const floods = parseFloat(document.getElementById('floods').value);
    const soilType = document.getElementById('soilType').value;
    
    // Disable button during calculation
    predictBtn.disabled = true;
    predictBtn.querySelector('span').textContent = 'Calculating...';
    
    // Hide detailed recommendations section when starting new prediction
    detailedRecommendationsSection.style.display = 'none';
    soilLossRecommendations.style.display = 'none';
    soilTypeRecommendations.style.display = 'none';
    vegetationRecommendations.style.display = 'none';
    soilLossContent.textContent = '';
    soilTypeContent.textContent = '';
    vegetationContent.textContent = '';
    
    // Calculate predicted soil loss
    const predictedSoilLoss = calculateSoilLoss(seawallLength, typhoons, floods);
    
    // Display results (this will also trigger AI recommendations fetch)
    displayResults(predictedSoilLoss, soilType);
    
    // Re-enable button
    predictBtn.disabled = false;
    predictBtn.querySelector('span').textContent = 'Predict';
}

// ============================================
// Event Listeners Setup
// ============================================

/**
 * Initializes all event listeners
 */
function initializeEventListeners() {
    // Form submission
    form.addEventListener('submit', handleFormSubmit);
    
    // Reset button
    resetBtn.addEventListener('click', resetResults);
    
    // Real-time input validation
    const inputs = form.querySelectorAll('.form-input, .form-select');
    inputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', handleInputValidation);
        } else {
            input.addEventListener('input', handleInputValidation);
            input.addEventListener('blur', handleInputValidation);
        }
    });
    
    // Prevent non-numeric input (except decimal point and negative sign) - only for number inputs
    const numberInputs = form.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('keydown', (event) => {
            // Allow: backspace, delete, tab, escape, enter, decimal point
            if ([8, 9, 27, 13, 46, 110, 190].indexOf(event.keyCode) !== -1 ||
                // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (event.keyCode === 65 && event.ctrlKey === true) ||
                (event.keyCode === 67 && event.ctrlKey === true) ||
                (event.keyCode === 86 && event.ctrlKey === true) ||
                (event.keyCode === 88 && event.ctrlKey === true) ||
                // Allow: home, end, left, right
                (event.keyCode >= 35 && event.keyCode <= 39)) {
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && 
                (event.keyCode < 96 || event.keyCode > 105)) {
                event.preventDefault();
            }
        });
        
        // Prevent paste of non-numeric content
        input.addEventListener('paste', (event) => {
            event.preventDefault();
            const paste = (event.clipboardData || window.clipboardData).getData('text');
            const num = parseFloat(paste);
            if (!isNaN(num) && num >= 0) {
                input.value = paste;
                handleInputValidation({ target: input });
            }
        });
    });
}

// ============================================
// Initialization
// ============================================

/**
 * Initializes the application when DOM is loaded
 */
function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventListeners);
    } else {
        initializeEventListeners();
    }
}

// Start the application
init();

// ============================================
// Export functions for testing (if needed)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateSoilLoss,
        formatNumber,
        isValidNumber
    };
}

