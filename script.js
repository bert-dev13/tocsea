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

/**
 * Tree planting ratio constant
 * 
 * FORMULA BASIS: 1 tree per 5 metric tons of soil loss
 * 
 * This ratio is used to calculate the total number of trees/plants needed:
 *   Total Plants Needed = ceil(Soil Loss (tons) / TREES_PER_TON)
 * 
 * NOTE: This ratio should be validated with:
 * - Forestry/agricultural research data
 * - Local environmental conditions
 * - Actual field testing results
 * - Expert consultation
 * 
 * The ratio may need adjustment based on:
 * - Plant species effectiveness
 * - Soil composition
 * - Climate conditions
 * - Erosion severity
 */
const TREES_PER_TON = 5;

// DOM Elements
const form = document.getElementById('predictionForm');
const predictBtn = document.getElementById('predictBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsSection = document.getElementById('resultsSection');
const soilLossValue = document.getElementById('soilLossValue');
const soilTypeValue = document.getElementById('soilTypeValue');
const plantRecommendations = document.getElementById('plantRecommendations');
const recommendationsContent = document.getElementById('recommendationsContent');

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
 * Calculates the recommended number of trees to plant
 * Based on ratio: 1 tree per 5 metric tons of soil loss
 * 
 * @param {number} soilLoss - Predicted soil loss in metric tons per year
 * @returns {number} Recommended number of trees (rounded to nearest integer)
 */
function calculateTreeRecommendation(soilLoss) {
    if (soilLoss <= 0) {
        return 0;
    }
    
    const treesNeeded = soilLoss / TREES_PER_TON;
    return roundToNearestInteger(treesNeeded);
}

/**
 * Plant recommendation database for different soil types
 * Each soil type has suitable plants with their effectiveness ratios
 * 
 * IMPORTANT NOTE: These plant recommendations are based on general knowledge
 * of coastal erosion control plants suitable for different soil types in
 * tropical/coastal regions. These recommendations should be validated and
 * updated with:
 * - Scientific research data
 * - Local agricultural/forestry expert consultation
 * - Site-specific environmental conditions
 * - Actual field testing results
 * 
 * The ratios represent the percentage distribution of each plant type
 * in the total planting recommendation (ratios should sum to approximately 1.0-1.5)
 */
const PLANT_RECOMMENDATIONS = {
    sandy: [
        { name: 'Coconut trees', ratio: 0.4, baseUnit: 'trees' },
        { name: 'Pandan', ratio: 0.3, baseUnit: 'plants' },
        { name: 'Mangrove', ratio: 0.3, baseUnit: 'trees' },
        { name: 'Beach morning glory', ratio: 0.2, baseUnit: 'plants' },
        { name: 'Sea purslane', ratio: 0.25, baseUnit: 'plants' }
    ],
    clay: [
        { name: 'Mangrove', ratio: 0.35, baseUnit: 'trees' },
        { name: 'Nipa palm', ratio: 0.3, baseUnit: 'trees' },
        { name: 'Bakauan', ratio: 0.35, baseUnit: 'trees' },
        { name: 'Pandan', ratio: 0.2, baseUnit: 'plants' },
        { name: 'Sea hibiscus', ratio: 0.25, baseUnit: 'trees' }
    ],
    loamy: [
        { name: 'Coconut trees', ratio: 0.35, baseUnit: 'trees' },
        { name: 'Mangrove', ratio: 0.3, baseUnit: 'trees' },
        { name: 'Pandan', ratio: 0.25, baseUnit: 'plants' },
        { name: 'Beach morning glory', ratio: 0.2, baseUnit: 'plants' },
        { name: 'Sea purslane', ratio: 0.2, baseUnit: 'plants' }
    ],
    silty: [
        { name: 'Mangrove', ratio: 0.4, baseUnit: 'trees' },
        { name: 'Nipa palm', ratio: 0.3, baseUnit: 'trees' },
        { name: 'Pandan', ratio: 0.25, baseUnit: 'plants' },
        { name: 'Bakauan', ratio: 0.35, baseUnit: 'trees' },
        { name: 'Sea hibiscus', ratio: 0.2, baseUnit: 'trees' }
    ],
    peaty: [
        { name: 'Mangrove', ratio: 0.4, baseUnit: 'trees' },
        { name: 'Nipa palm', ratio: 0.35, baseUnit: 'trees' },
        { name: 'Bakauan', ratio: 0.3, baseUnit: 'trees' },
        { name: 'Pandan', ratio: 0.2, baseUnit: 'plants' },
        { name: 'Sea hibiscus', ratio: 0.25, baseUnit: 'trees' }
    ],
    chalky: [
        { name: 'Coconut trees', ratio: 0.4, baseUnit: 'trees' },
        { name: 'Mangrove', ratio: 0.3, baseUnit: 'trees' },
        { name: 'Pandan', ratio: 0.3, baseUnit: 'plants' },
        { name: 'Beach morning glory', ratio: 0.25, baseUnit: 'plants' },
        { name: 'Sea purslane', ratio: 0.25, baseUnit: 'plants' }
    ]
};

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

/**
 * Calculates plant recommendations based on soil type and soil loss
 * 
 * FORMULA EXPLANATION:
 * 
 * Step 1: Calculate total plants/trees needed
 *   totalPlantsNeeded = ceil(soilLoss / TREES_PER_TON)
 *   where TREES_PER_TON = 5 (meaning 1 tree per 5 metric tons of soil loss)
 * 
 * Step 2: Distribute plants based on soil type-specific ratios
 *   For each plant type:
 *     quantity = ceil(totalPlantsNeeded × plant.ratio)
 * 
 * Step 3: Apply adjustments
 *   - Minimum: If soil loss > 0 and quantity = 0, set quantity = 1
 *   - High soil loss adjustment: If soil loss > 100 tons, multiply by 1.2
 * 
 * EXAMPLE:
 *   If soilLoss = 50 tons and plant.ratio = 0.4:
 *     totalPlantsNeeded = ceil(50 / 5) = 10
 *     quantity = ceil(10 × 0.4) = ceil(4.0) = 4 trees/plants
 * 
 *   If soilLoss = 150 tons and plant.ratio = 0.3:
 *     totalPlantsNeeded = ceil(150 / 5) = 30
 *     quantity = ceil(30 × 0.3) = ceil(9.0) = 9
 *     High soil loss adjustment: 9 × 1.2 = 10.8 → ceil(10.8) = 11 trees/plants
 * 
 * @param {string} soilType - Type of soil (sandy, clay, loamy, etc.)
 * @param {number} soilLoss - Predicted soil loss in metric tons per year
 * @returns {Array} Array of recommended plants with quantities
 */
function calculatePlantRecommendations(soilType, soilLoss) {
    if (!soilType || soilLoss <= 0) {
        return [];
    }
    
    const plants = PLANT_RECOMMENDATIONS[soilType];
    if (!plants) {
        return [];
    }
    
    // Step 1: Calculate total trees/plants needed
    // Formula: 1 tree per 5 metric tons of soil loss
    const totalPlantsNeeded = Math.ceil(soilLoss / TREES_PER_TON);
    
    // Step 2: Calculate recommendations for each plant type
    return plants.map(plant => {
        // Calculate quantity based on ratio and soil loss level
        // Higher soil loss may require more plants
        let quantity = Math.ceil(totalPlantsNeeded * plant.ratio);
        
        // Step 3a: Ensure minimum quantity of 1 for very low soil loss
        if (soilLoss > 0 && quantity === 0) {
            quantity = 1;
        }
        
        // Step 3b: Adjust for high soil loss (more plants needed)
        // For soil loss > 100 tons, increase quantity by 20%
        if (soilLoss > 100) {
            quantity = Math.ceil(quantity * 1.2);
        }
        
        return {
            name: plant.name,
            quantity: quantity,
            unit: plant.baseUnit
        };
    });
}

// ============================================
// UI Update Functions
// ============================================

/**
 * Updates the results section with calculated values
 * @param {number} soilLoss - Predicted soil loss value
 * @param {string} soilType - Selected soil type
 * @param {Array} recommendations - Array of plant recommendations
 */
function displayResults(soilLoss, soilType, recommendations) {
    // Format and display soil loss
    soilLossValue.textContent = formatNumber(soilLoss);
    
    // Display soil type
    soilTypeValue.textContent = getSoilTypeDisplayName(soilType);
    
    // Display plant recommendations
    displayPlantRecommendations(soilLoss, soilType, recommendations);
    
    // Show results section with animation
    resultsSection.style.display = 'block';
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }, 100);
}

/**
 * Displays plant recommendations in the results section
 * @param {number} soilLoss - Predicted soil loss value
 * @param {string} soilType - Selected soil type
 * @param {Array} recommendations - Array of plant recommendations
 */
function displayPlantRecommendations(soilLoss, soilType, recommendations) {
    if (!recommendations || recommendations.length === 0) {
        recommendationsContent.innerHTML = '<p class="no-recommendations">No recommendations available for this soil type.</p>';
        plantRecommendations.style.display = 'none';
        return;
    }
    
    plantRecommendations.style.display = 'block';
    
    // Create introduction text
    const introText = `Based on the predicted soil loss of <strong>${formatNumber(soilLoss)}</strong> metric tons per year, the following trees and plants are recommended for <strong>${getSoilTypeDisplayName(soilType)}</strong> to help reduce erosion:`;
    
    // Create recommendations list
    let recommendationsHTML = `
        <p class="recommendations-intro">${introText}</p>
        <ul class="recommendations-list">
    `;
    
    recommendations.forEach(plant => {
        recommendationsHTML += `
            <li class="recommendation-item">
                <span class="plant-name">${plant.name}</span>
                <span class="plant-quantity">– ${formatNumber(plant.quantity, 0)} ${plant.unit} recommended</span>
            </li>
        `;
    });
    
    recommendationsHTML += '</ul>';
    recommendationsContent.innerHTML = recommendationsHTML;
}

/**
 * Hides the results section and resets form
 */
function resetResults() {
    resultsSection.style.display = 'none';
    plantRecommendations.style.display = 'none';
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
    
    // Simulate brief delay for better UX (optional)
    setTimeout(() => {
        // Calculate predicted soil loss
        const predictedSoilLoss = calculateSoilLoss(seawallLength, typhoons, floods);
        
        // Calculate plant recommendations based on soil type
        const recommendations = calculatePlantRecommendations(soilType, predictedSoilLoss);
        
        // Display results
        displayResults(predictedSoilLoss, soilType, recommendations);
        
        // Re-enable button
        predictBtn.disabled = false;
        predictBtn.querySelector('span').textContent = 'Predict';
    }, 300);
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
        calculateTreeRecommendation,
        formatNumber,
        isValidNumber
    };
}

