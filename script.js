/**
 * ================================================================================
 * TOCSEA - Coastal Soil Erosion Prediction System
 * Frontend JavaScript Application
 * ================================================================================
 * 
 * This file contains all client-side logic for the TOCSEA system including:
 * - Soil loss calculation using the prediction formula
 * - UI state management and updates
 * - API integration for AI recommendations
 * - Form validation and user input handling
 * - PDF export and clipboard functionality
 * 
 * Author: TOCSEA Development Team
 * Version: 1.0.0
 * ================================================================================
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
const exportButtonsWrapper = document.getElementById('exportButtonsWrapper');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const copyClipboardBtn = document.getElementById('copyClipboardBtn');

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
    
    // Show export buttons
    exportButtonsWrapper.style.display = 'flex';
    
    // Store data for export
    window.currentSoilLoss = soilLoss;
    window.currentSoilType = getSoilTypeDisplayName(soilType);
    
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
 * Maps plant names to emoji Unicode codes
 * @param {string} plantName - Name of the plant
 * @returns {string} Emoji character
 */
function getPlantEmoji(plantName) {
    const name = plantName.toLowerCase().trim();
    const emojiMap = {
        'coconut': '\u{1F334}', // 🌴
        'pandan': '\u{1F33F}', // 🌿
        'mahogany': '\u{1F333}', // 🌳
        'vetiver': '\u{1F33E}', // 🌾
        'bamboo': '\u{1F33F}', // 🌿
        'acacia': '\u{1F333}', // 🌳
        'eucalyptus': '\u{1F333}', // 🌳
        'casuarina': '\u{1F333}', // 🌳
        'leucaena': '\u{1F331}', // 🌱
        'tamarind': '\u{1F333}', // 🌳
        'terminalia': '\u{1F333}', // 🌳
        'gmelina': '\u{1F333}', // 🌳
        'melaleuca': '\u{1F333}', // 🌳
        'pinus': '\u{1F332}', // 🌲 (pine tree)
        'pine': '\u{1F332}', // 🌲
        'grass': '\u{1F33E}', // 🌾
        'tree': '\u{1F333}', // 🌳
        'plant': '\u{1F331}', // 🌱
    };
    
    // Check for exact matches first
    if (emojiMap[name]) {
        return emojiMap[name];
    }
    
    // Check for partial matches (prioritize longer matches first)
    const sortedKeys = Object.keys(emojiMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (name.includes(key)) {
            return emojiMap[key];
        }
    }
    
    // Default emoji based on common patterns
    if (name.includes('tree') || name.includes('wood')) {
        return '\u{1F333}'; // 🌳
    } else if (name.includes('grass') || name.includes('vetiver')) {
        return '\u{1F33E}'; // 🌾
    } else if (name.includes('bamboo') || name.includes('pandan')) {
        return '\u{1F33F}'; // 🌿
    } else if (name.includes('coconut') || name.includes('palm')) {
        return '\u{1F334}'; // 🌴
    }
    
    // Default fallback
    return '\u{1F331}'; // 🌱
}

/**
 * Formats the AI recommendations text for display
 * @param {string} recommendations - Clean recommendations text from AI (already filtered)
 * @param {number} soilLoss - Predicted soil loss value
 * @param {string} soilType - Selected soil type
 * @returns {string} Formatted HTML string
 */
function formatRecommendations(recommendations, soilLoss, soilType) {
    // Parse clean recommendations: format is "🌳 Name – number unit"
    // Handle both multi-line and single-line formats
    const items = [];
    
    // Debug: log the raw recommendations
    console.log('Raw recommendations:', recommendations);
    
    // Normalize the input: replace different dash types but preserve emoji spacing
    // Don't collapse all spaces - we need to preserve structure around emojis
    let normalized = recommendations.replace(/[–—―]/g, '-').trim();
    
    // First, try to split by newlines (multi-line format)
    const lines = normalized.split('\n').filter(line => line.trim());
    
    // Try multi-line parsing first
    if (lines.length > 1) {
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            // Match format: (optional emoji/corrupted char) + name + dash + number + unit
            // Be very flexible to catch corrupted emojis
            const match = trimmed.match(/^(.{0,3}?)\s*(.+?)\s*-\s*(\d+)\s+(.+)$/);
            if (match) {
                let emoji = match[1].trim();
                const name = match[2].trim();
                const quantity = match[3].trim();
                const unit = match[4].trim();
                
                // Always get emoji from plant name to ensure correct display
                // Only use the matched emoji if it's a valid plant emoji
                const validEmojiPattern = /[🌳🌴🌾🌿🌱🌲]/;
                if (!emoji || !validEmojiPattern.test(emoji) || emoji === '?' || emoji === '') {
                    emoji = getPlantEmoji(name);
                } else {
                    // Ensure emoji is properly encoded
                    emoji = emoji.replace(/\uFE0F/g, ''); // Remove variation selector
                }
                
                items.push({ 
                    emoji: emoji,
                    name: name, 
                    quantity: `${quantity} ${unit}` 
                });
            }
        });
    }
    
    // If no items found or single line, try single-line parsing
    if (items.length === 0) {
        // Use global regex to find all matches in the string
        // Pattern: (optional emoji/corrupted) + name + dash + number + unit
        // More flexible pattern that handles various spacing and corrupted emojis
        const globalPattern = /(.{0,3}?)\s+([^-]+?)\s*-\s*(\d+)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*?)(?=\s*.{0,3}?\s+[^-]+?-\s*\d+|$)/g;
        let match;
        
        while ((match = globalPattern.exec(normalized)) !== null) {
            let emoji = match[1].trim();
            const name = match[2].trim();
            const quantity = match[3].trim();
            const unit = match[4].trim();
            
            // Always validate emoji - if corrupted, get it from plant name
            const validEmojiPattern = /[🌳🌴🌾🌿🌱🌲]/;
            if (!emoji || !validEmojiPattern.test(emoji) || emoji === '?' || emoji === '') {
                emoji = getPlantEmoji(name);
            } else {
                // Ensure emoji is properly encoded
                emoji = emoji.replace(/\uFE0F/g, ''); // Remove variation selector
            }
            
            if (name && quantity && unit) {
                items.push({ 
                    emoji: emoji,
                    name: name, 
                    quantity: `${quantity} ${unit}` 
                });
            }
        }
    }
    
    // If still no items, try splitting by emoji and parsing manually
    if (items.length === 0) {
        const emojiPattern = /([🌳🌴🌾🌿🌱\?])/g;
        const parts = normalized.split(emojiPattern);
        
        for (let i = 1; i < parts.length; i += 2) {
            if (i + 1 < parts.length) {
                let emoji = parts[i].trim();
                let content = parts[i + 1].trim();
                
                // Remove any trailing emoji that might be in the content
                content = content.replace(/\s+[🌳🌴🌾🌿🌱].*$/, '');
                
                // Match: name + dash + number + unit
                const itemMatch = content.match(/^(.+?)\s*-\s*(\d+)\s+(.+)$/);
                
                if (itemMatch) {
                    const name = itemMatch[1].trim();
                    const quantity = itemMatch[2].trim();
                    const unit = itemMatch[3].trim();
                    
                    // Always validate emoji - if corrupted, get it from plant name
                    const validEmojiPattern = /[🌳🌴🌾🌿🌱🌲]/;
                    if (!emoji || !validEmojiPattern.test(emoji) || emoji === '?' || emoji === '') {
                        emoji = getPlantEmoji(name);
                    } else {
                        // Ensure emoji is properly encoded
                        emoji = emoji.replace(/\uFE0F/g, ''); // Remove variation selector
                    }
                    
                    if (name && quantity && unit) {
                        items.push({ 
                            emoji: emoji,
                            name: name, 
                            quantity: `${quantity} ${unit}` 
                        });
                    }
                }
            }
        }
    }
    
    // Final fallback: try to parse lines that start directly with plant name (no emoji)
    if (items.length === 0) {
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            // Match: name + dash + number + unit (no emoji at start)
            const match = trimmed.match(/^([A-Za-z\s]+?)\s*-\s*(\d+)\s+(.+)$/);
            if (match) {
                const name = match[1].trim();
                const quantity = match[2].trim();
                const unit = match[3].trim();
                const emoji = getPlantEmoji(name);
                
                if (name && quantity && unit) {
                    items.push({ 
                        emoji: emoji,
                        name: name, 
                        quantity: `${quantity} ${unit}` 
                    });
                }
            }
        });
    }
    
    // Debug: log parsed items
    console.log('Parsed items:', items);
    
    // Build table HTML
    if (items.length === 0) {
        // If parsing failed, try to display as-is but with better formatting
        console.warn('Failed to parse recommendations, displaying as plain text');
        return `<div class="recommendations-list"><pre style="white-space: pre-wrap; word-wrap: break-word;">${recommendations}</pre></div>`;
    }
    
    let html = '<div class="recommendations-table-wrapper">';
    html += '<table class="recommendations-table">';
    html += '<thead><tr><th class="col-name">Tree/Plant</th><th class="col-quantity">Recommended Quantity</th></tr></thead>';
    html += '<tbody>';
    items.forEach((item) => {
        // Ensure emoji is properly encoded - always use the emoji from getPlantEmoji
        // This ensures we always have a valid emoji even if the original was corrupted
        let emojiHtml = item.emoji;
        
        // Double-check: if emoji is still corrupted, get it from name again
        if (!emojiHtml || emojiHtml === '?' || emojiHtml === '' || !/[🌳🌴🌾🌿🌱🌲]/.test(emojiHtml)) {
            emojiHtml = getPlantEmoji(item.name);
        }
        
        // Ensure proper Unicode encoding
        if (emojiHtml.codePointAt(0)) {
            emojiHtml = String.fromCodePoint(emojiHtml.codePointAt(0));
        }
        
        html += `<tr class="recommendation-row">
            <td class="recommendation-name" data-label="Tree/Plant">
                <span class="recommendation-emoji" role="img" aria-label="${item.name} icon">${emojiHtml}</span>
                <span class="recommendation-name-text">${item.name}</span>
            </td>
            <td class="recommendation-quantity" data-label="Recommended Quantity">
                <span class="quantity-value">${item.quantity}</span>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    html += '</div>';
    
    return html;
}

/**
 * Displays detailed recommendations in three sections
 * @param {object} detailedRecommendations - Object with soil_loss, soil_type, and vegetation sections (already cleaned)
 */
function displayDetailedRecommendations(detailedRecommendations) {
    // Show detailed recommendations section
    detailedRecommendationsSection.style.display = 'block';
    
	// Update section headers to reflect System vs AI context
	const soilLossHeader = document.querySelector('#soilLossRecommendations h3');
	if (soilLossHeader) soilLossHeader.textContent = 'AI Recommendation: Based on Predicted Soil Loss';
	const soilTypeHeader = document.querySelector('#soilTypeRecommendations h3');
	if (soilTypeHeader) soilTypeHeader.textContent = 'System Recommendation: Based on Selected Soil Type';
	const vegetationHeader = document.querySelector('#vegetationRecommendations h3');
	if (vegetationHeader) vegetationHeader.textContent = 'AI Recommendation: Recommended Vegetation';
	
    // Display Section 1: Based on Soil Loss
    if (detailedRecommendations.soil_loss && detailedRecommendations.soil_loss.trim()) {
        soilLossContent.innerHTML = formatRecommendationText(detailedRecommendations.soil_loss);
        soilLossRecommendations.style.display = 'block';
    }
    
    // Display Section 2: Based on Soil Type
    if (detailedRecommendations.soil_type && detailedRecommendations.soil_type.trim()) {
        soilTypeContent.innerHTML = formatRecommendationText(detailedRecommendations.soil_type);
        soilTypeRecommendations.style.display = 'block';
    }
    
    // Display Section 3: For Vegetation
    if (detailedRecommendations.vegetation && detailedRecommendations.vegetation.trim()) {
        vegetationContent.innerHTML = formatRecommendationText(detailedRecommendations.vegetation);
        vegetationRecommendations.style.display = 'block';
    }
}

/**
 * Formats recommendation text for display (handles bullet points)
 * @param {string} text - Clean recommendation text (already filtered, only bullet points)
 * @returns {string} Formatted HTML
 */
function formatRecommendationText(text) {
    if (!text) return '';
    
    // Split by lines and format each bullet point
    const lines = text.split('\n').filter(line => line.trim());
	let html = '';
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Extract content from bullet point (format: "• content")
        const match = trimmed.match(/^[•\-\*]\s+(.+)$/);
        if (match) {
            const content = match[1].trim();
            if (content && content.length > 5) {
				html += `<div class="recommendation-item-text" style="animation-delay: ${index * 0.1}s">${content}</div>`;
            }
        }
    });
    
	return html;
}

/**
 * Gets formatted text content from recommendations
 * @returns {string} Plain text recommendations
 */
function getRecommendationsText() {
    const recommendationsElement = document.getElementById('recommendationsText');
    if (!recommendationsElement) return '';
    
    // Get text content from table if available
    let text = '';
    const table = recommendationsElement.querySelector('table');
    if (table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            let name = row.querySelector('.recommendation-name')?.textContent || '';
            // Strip emojis, variation selectors, and zero-width characters
            name = name
                .normalize('NFC')
                .replace(/[\uD800-\uDFFF]/g, '')
                .replace(/[\uFE0F\u200B-\u200D\u2060]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            const quantity = row.querySelector('.recommendation-quantity')?.textContent || '';
            if (name && quantity) {
                text += `• ${name} - ${quantity}\n`;
            }
        });
    } else {
        text = recommendationsElement.textContent || '';
    }
    
    // Add detailed recommendations if available
	const detailedSections = [
		{ id: 'soilLossContent', label: 'AI Recommendation: Based on Predicted Soil Loss' },
		{ id: 'soilTypeContent', label: 'System Recommendation: Based on Selected Soil Type' },
		{ id: 'vegetationContent', label: 'AI Recommendation: Recommended Vegetation' }
	];
    
    detailedSections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element && element.textContent.trim()) {
            text += `\n${section.label}:\n${element.textContent.trim()}\n`;
        }
    });
    
    return text.trim();
}

/**
 * Gets all input values for export
 * @returns {Object} Form data object
 */
function getFormData() {
    return {
        seawallLength: document.getElementById('seawallLength').value,
        typhoons: document.getElementById('typhoons').value,
        floods: document.getElementById('floods').value,
        soilType: document.getElementById('soilType').value
    };
}

/**
 * Gets the jsPDF library, checking multiple possible locations
 * @returns {Function|null} jsPDF constructor or null if not found
 */
function getJsPDFLibrary() {
    // Try UMD module format first (most common for CDN)
    if (typeof window.jsPDF !== 'undefined') {
        if (window.jsPDF.jsPDF) {
            return window.jsPDF.jsPDF;
        }
        // Check if it's the constructor directly
        if (typeof window.jsPDF === 'function') {
            return window.jsPDF;
        }
        // Check if it has a default export
        if (window.jsPDF.default && typeof window.jsPDF.default === 'function') {
            return window.jsPDF.default;
        }
    }
    
    // Try alternative naming
    if (typeof window.jspdf !== 'undefined') {
        if (window.jspdf.jsPDF) {
            return window.jspdf.jsPDF;
        }
        if (typeof window.jspdf === 'function') {
            return window.jspdf;
        }
    }
    
    return null;
}

/**
 * Sanitizes text for PDF rendering by removing unsupported glyphs (emojis),
 * variation selectors, zero-width characters, and excessive whitespace.
 * @param {string} text
 * @returns {string}
 */
function sanitizePdfText(text) {
    if (!text) return '';
    try {
        return text
            .normalize('NFC')
            // Remove surrogate pairs (emojis and symbols outside BMP)
            .replace(/[\uD800-\uDFFF]/g, '')
            // Remove variation selectors and zero-width chars
            .replace(/[\uFE0F\u200B-\u200D\u2060]/g, '')
            // Normalize dash variants to hyphen-minus
            .replace(/[–—―]/g, '-')
            // Collapse spaces
            .replace(/[ \t\f\v]+/g, ' ')
            // Trim per line
            .split('\n').map(l => l.trim()).join('\n')
            .trim();
    } catch (e) {
        return String(text);
    }
}

/**
 * Downloads results as PDF
 */
function downloadPDF() {
        // Extract recommendation items (Name, Quantity) from DOM for clean PDF table
        function getRecommendationItemsForPdf() {
            const items = [];
            const recommendationsElement = document.getElementById('recommendationsText');
            if (!recommendationsElement) return items;
            const table = recommendationsElement.querySelector('table');
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    let name = row.querySelector('.recommendation-name-text')?.textContent || '';
                    let quantity = row.querySelector('.recommendation-quantity .quantity-value')?.textContent || '';
                    name = sanitizePdfText(name);
                    quantity = sanitizePdfText(quantity);
                    if (name && quantity) {
                        items.push({ name, quantity });
                    }
                });
                return items;
            }
            // Fallback: parse plain text bullets "• Name - quantity"
            const text = sanitizePdfText(getRecommendationsText());
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            lines.forEach(line => {
                const clean = line.replace(/^[•\-\*\d\.\)]\s+/, '');
                const m = clean.match(/^(.+?)\s*-\s*(.+)$/);
                if (m) {
                    items.push({ name: m[1].trim(), quantity: m[2].trim() });
                }
            });
            return items;
        }
        // Extract detailed recommendation sections from DOM for structured rendering
        function getDetailedSectionsForPdf() {
			const sections = [];
			const map = [
				{ id: 'soilLossContent', label: 'AI Recommendation: Based on Predicted Soil Loss' },
				{ id: 'soilTypeContent', label: 'System Recommendation: Based on Selected Soil Type' },
				{ id: 'vegetationContent', label: 'AI Recommendation: Recommended Vegetation' }
			];
            map.forEach(s => {
                const el = document.getElementById(s.id);
                if (!el) return;
                // Prefer collecting each rendered bullet item element to preserve separation
                const itemNodes = el.querySelectorAll('.recommendation-item-text');
                const items = [];
                if (itemNodes && itemNodes.length) {
                    itemNodes.forEach(node => {
                        const txt = sanitizePdfText(node.textContent || '').trim();
                        if (txt && txt.length > 1) items.push(txt);
                    });
                } else {
                    // Fallback: split text content by newlines or sentence delimiters
                    const raw = sanitizePdfText((el.textContent || '').trim());
                    raw.split(/\n+/).forEach(line => {
                        const t = line.trim();
                        if (t) items.push(t.replace(/^[•\-\*]\s+/, ''));
                    });
                    // If still a single long line, break on typical separators
                    if (items.length <= 1 && raw) {
                        raw.split(/(?<=[.;])\s+|(?<=\))\s+|(?<=\])\s+/).forEach(part => {
                            const t = part.trim();
                            if (t && t.length > 2) items.push(t);
                        });
                    }
                }
                if (items.length) {
                    sections.push({ label: s.label, bullets: items });
                }
            });
            return sections;
        }
    // Get jsPDF library
    const jsPDF = getJsPDFLibrary();
    
    if (!jsPDF) {
        // Try waiting a bit and retrying (in case library is still loading)
        setTimeout(() => {
            const retryJsPDF = getJsPDFLibrary();
            if (!retryJsPDF) {
                alert('PDF library could not be loaded. Please:\n\n1. Check your internet connection\n2. Refresh the page\n3. Try using a different browser\n\nIf the problem persists, the PDF feature may not be available.');
                console.error('jsPDF library not found after retry. Window object keys:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
            } else {
                // Retry the download
                downloadPDF();
            }
        }, 500);
        return;
    }
    
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        
        // Get current data
        const soilLoss = window.currentSoilLoss || 0;
        const soilType = window.currentSoilType || 'N/A';
        const formData = getFormData();
        const recommendations = getRecommendationsText();
        const recItems = getRecommendationItemsForPdf();
        const detailedSections = getDetailedSectionsForPdf();
        
        // Set up colors
        const primaryColor = [0, 102, 255]; // #0066ff
        const primaryLight = [230, 240, 255]; // Light blue background
        const secondaryColor = [0, 200, 83]; // #00c853
        const lightGray = [245, 245, 245];
        const darkGray = [64, 64, 64];
        const textGray = [102, 102, 102];
        
        // Helper function to add a section box
        function addSectionBox(y, height, fillColor = null) {
            if (fillColor) {
                doc.setFillColor(...fillColor);
                doc.rect(margin, y, contentWidth, height, 'F');
            }
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.rect(margin, y, contentWidth, height, 'S');
        }
        
        // Helper function to check page break
        function checkPageBreak(requiredHeight) {
            if (yPos + requiredHeight > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
                return true;
            }
            return false;
        }
        
        let yPos = margin;
        
        // ========== HEADER SECTION ==========
        // Header background
        doc.setFillColor(...primaryLight);
        doc.rect(0, 0, pageWidth, 45, 'F');
        
        // Header border
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(2);
        doc.line(0, 45, pageWidth, 45);
        
        // Title
        yPos = 20;
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Coastal Soil Erosion Prediction Report', pageWidth / 2, yPos, { align: 'center' });
        
        // Subtitle
        yPos += 8;
        doc.setFontSize(11);
        doc.setTextColor(...textGray);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema ng Paghula ng Pagguho ng Lupa sa Baybayin', pageWidth / 2, yPos, { align: 'center' });
        
        // Date
        yPos += 6;
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        const reportDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPos, { align: 'center' });
        
        yPos = 55;
        
        // ========== KEY METRICS SECTION ==========
        checkPageBreak(50);
        
        // Section header
        doc.setFontSize(14);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Metrics', margin, yPos);
        yPos += 10;
        
        // Predicted Soil Loss Box
        const soilLossBoxHeight = 35;
        addSectionBox(yPos, soilLossBoxHeight, primaryLight);
        
        doc.setFontSize(10);
        doc.setTextColor(...textGray);
        doc.setFont('helvetica', 'normal');
        doc.text('Predicted Soil Loss', margin + 5, yPos + 7);
        
        doc.setFontSize(28);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        const soilLossText = formatNumber(soilLoss) + ' metric tons/year';
        const soilLossTextWidth = doc.getTextWidth(soilLossText);
        doc.text(soilLossText, margin + (contentWidth / 2) - (soilLossTextWidth / 2), yPos + 22);
        
        yPos += soilLossBoxHeight + 10;
        
        // Soil Type Box
        checkPageBreak(30);
        const soilTypeBoxHeight = 28;
        addSectionBox(yPos, soilTypeBoxHeight, lightGray);
        
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'bold');
        doc.text('Selected Soil Type', margin + 5, yPos + 8);
        
        doc.setFontSize(14);
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(soilType, margin + contentWidth - 5 - doc.getTextWidth(soilType), yPos + 8);
        
        doc.setFontSize(9);
        doc.setTextColor(...textGray);
        doc.setFont('helvetica', 'normal');
        doc.text('Napiling Uri ng Lupa', margin + 5, yPos + 20);
        
        yPos += soilTypeBoxHeight + 15;
        
        // ========== INPUT PARAMETERS SECTION ==========
        checkPageBreak(60);
        
        // Section header
        doc.setFontSize(14);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'bold');
        doc.text('Input Parameters', margin, yPos);
        yPos += 8;
        
        // Parameters box
        const paramBoxHeight = 50;
        addSectionBox(yPos, paramBoxHeight, [255, 255, 255]);
        
        const paramStartY = yPos + 5;
        let paramY = paramStartY;
        const paramLeftCol = margin + 8;
        const paramRightCol = margin + contentWidth / 2 + 10;
        const paramLineHeight = 7;
        
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'normal');
        
        // Left column
        doc.setFont('helvetica', 'bold');
        doc.text('Seawall Length:', paramLeftCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.seawallLength} m`, paramLeftCol + 50, paramY);
        
        paramY += paramLineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Typhoons per Year:', paramLeftCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.typhoons}`, paramLeftCol + 50, paramY);
        
        paramY += paramLineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Floods per Year:', paramLeftCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.floods}`, paramLeftCol + 50, paramY);
        
        // Right column
        paramY = paramStartY;
        doc.setFont('helvetica', 'bold');
        doc.text('Soil Type:', paramRightCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(soilType, paramRightCol + 40, paramY);
        
        yPos += paramBoxHeight + 15;
        
        // ========== RECOMMENDATIONS SECTION ==========
        if (recommendations) {
            checkPageBreak(40);
            
            // Section header
            doc.setFontSize(14);
            doc.setTextColor(...darkGray);
            doc.setFont('helvetica', 'bold');
            doc.text('AI-Powered Recommendations', margin, yPos);
            yPos += 10;
            
            // Prefer a clean two-column table of vegetation recommendations
            if (recItems.length) {
                const rowHeight = 8;
                const colNameX = margin + 6;
                const colQtyX = margin + contentWidth - 6 - 60;
                const headerHeight = 9;
                
                // Header
                doc.setFillColor(245, 247, 251);
                doc.rect(margin, yPos, contentWidth, headerHeight, 'F');
                doc.setDrawColor(230, 233, 239);
                doc.rect(margin, yPos, contentWidth, headerHeight, 'S');
                doc.setFontSize(10);
                doc.setTextColor(...darkGray);
                doc.setFont('helvetica', 'bold');
                doc.text('Tree/Plant', colNameX, yPos + 6);
                doc.text('Recommended Quantity', colQtyX, yPos + 6);
                yPos += headerHeight;
                
                // Rows
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                recItems.forEach((it, idx) => {
                    checkPageBreak(rowHeight + 12);
                    if (idx % 2 === 0) {
                        doc.setFillColor(253, 254, 255);
                        doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
                    }
                    doc.setDrawColor(240, 242, 246);
                    doc.rect(margin, yPos, contentWidth, rowHeight, 'S');
                    const nameLines = doc.splitTextToSize(it.name, (contentWidth - 80));
                    doc.text(nameLines, colNameX, yPos + 5);
                    const qtyText = it.quantity;
                    const qtyWidth = doc.getTextWidth(qtyText);
                    doc.text(qtyText, margin + contentWidth - 6 - qtyWidth, yPos + 5);
                    yPos += rowHeight;
                });
                yPos += 8;
            } else {
                // Fallback: render as bullet list
                doc.setFontSize(10);
                doc.setTextColor(...darkGray);
                doc.setFont('helvetica', 'normal');
                const safeRecommendations = sanitizePdfText(recommendations);
                const lines = safeRecommendations.split('\n').filter(line => line.trim());
                lines.forEach((line) => {
                    checkPageBreak(15);
                    doc.setFillColor(...primaryColor);
                    doc.circle(margin + 8, yPos - 2, 1.5, 'F');
                    const textX = margin + 15;
                    const textWidth = contentWidth - 20;
                    const cleanLine = sanitizePdfText(line.replace(/^[•\-\*\d\.\)]\s+/, '').trim());
                    const splitText = doc.splitTextToSize(cleanLine, textWidth);
                    splitText.forEach((textLine) => {
                        if (yPos > pageHeight - 45) {
                            doc.addPage();
                            yPos = margin + 5;
                        }
                        doc.text(textLine, textX, yPos);
                        yPos += 5;
                    });
                    yPos += 3;
                });
                yPos += 5;
            }
            
            // Detailed recommendations
            if (detailedSections.length) {
                checkPageBreak(20);
                doc.setFontSize(12);
                doc.setTextColor(...darkGray);
                doc.setFont('helvetica', 'bold');
                doc.text('Detailed Recommendations', margin, yPos);
                yPos += 8;
                detailedSections.forEach(section => {
                    checkPageBreak(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(11);
                    doc.setTextColor(...primaryColor);
                    doc.text(section.label + ':', margin + 5, yPos);
                    yPos += 6;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(...darkGray);
                    section.bullets.forEach(b => {
                        checkPageBreak(10);
                        doc.setFillColor(...primaryColor);
                        doc.circle(margin + 8, yPos - 2, 1.5, 'F');
                        const textX = margin + 15;
                        const textWidth = contentWidth - 20;
                        const splitText = doc.splitTextToSize(sanitizePdfText(b), textWidth);
                        splitText.forEach((textLine) => {
                            if (yPos > pageHeight - 45) {
                                doc.addPage();
                                yPos = margin + 5;
                            }
                            doc.text(textLine, textX, yPos);
                            yPos += 5;
                        });
                        yPos += 2;
                    });
                    yPos += 4;
                });
            }
            
            yPos += 5;
        }
        
        // ========== FOOTER ==========
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
            
            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(...textGray);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Page ${i} of ${pageCount} | Coastal Soil Erosion Prediction System | ${reportDate}`,
                pageWidth / 2,
                pageHeight - 12,
                { align: 'center' }
            );
        }
        
        // Save PDF
        const fileName = `Coastal_Soil_Erosion_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('An error occurred while generating the PDF. Please try again.\n\nError: ' + error.message);
    }
}

/**
 * Copies results to clipboard
 */
async function copyToClipboard() {
    const soilLoss = window.currentSoilLoss || 0;
    const soilType = window.currentSoilType || 'N/A';
    const formData = getFormData();
    const recommendations = getRecommendationsText();
    
    const text = `Coastal Soil Erosion Prediction Report
===============================

Predicted Soil Loss: ${formatNumber(soilLoss)} metric tons per year

Selected Soil Type: ${soilType}

Input Parameters:
- Seawall Length: ${formData.seawallLength} m
- Typhoons per Year: ${formData.typhoons}
- Floods per Year: ${formData.floods}
- Soil Type: ${soilType}

AI-Powered Recommendations:
${recommendations || 'No recommendations available.'}

Generated by Coastal Soil Erosion Prediction System
Date: ${new Date().toLocaleDateString()}
`;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Show success feedback
        const originalText = copyClipboardBtn.querySelector('span:last-child').textContent;
        copyClipboardBtn.querySelector('span:last-child').textContent = 'Copied!';
        copyClipboardBtn.style.backgroundColor = '#00c853';
        
        setTimeout(() => {
            copyClipboardBtn.querySelector('span:last-child').textContent = originalText;
            copyClipboardBtn.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy to clipboard. Please try again or use the PDF download option.');
    }
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
    
    // Remove 'submitted' class to reset validation styling
    form.classList.remove('submitted');
    exportButtonsWrapper.style.display = 'none';
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
    
    // Clear stored data
    window.currentSoilLoss = null;
    window.currentSoilType = null;
    
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
    // Add 'submitted' class to form to show validation errors
    form.classList.add('submitted');
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
    
    // Export buttons
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadPDF);
    }
    
    if (copyClipboardBtn) {
        copyClipboardBtn.addEventListener('click', copyToClipboard);
    }
    
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

// ============================================
// Lightweight UI Styles Injection (tables, spacing)
// ============================================
;(function injectRecommendationStyles() {
	// Avoid duplicate style injection
	if (document.getElementById('tocsea-recommendation-styles')) return;
	const style = document.createElement('style');
	style.id = 'tocsea-recommendation-styles';
	style.textContent = `
		/* Recommendations Table */
		.recommendations-table-wrapper {
			margin-top: 12px;
			margin-bottom: 16px;
			overflow-x: auto;
			max-width: 100%;
			-webkit-overflow-scrolling: touch;
			position: relative;
		}
		.recommendations-table {
			width: 100%;
			border-collapse: collapse;
			background: #fff;
			font-size: 14px;
			/* Prevent layout jump on narrower screens and allow content to wrap nicely */
			table-layout: auto;
			border: 1px solid #e6e9ef;
			border-radius: 10px;
			overflow: hidden;
			box-shadow: 0 1px 1px rgba(17, 24, 39, 0.02);
		}
		/* Consistent sizing to avoid overflow math glitches */
		.recommendations-table, .recommendations-table * {
			box-sizing: border-box;
		}
		.recommendations-table th, .recommendations-table td {
			min-width: 0; /* enable shrinking */
		}
		/* Help prevent overlapping by constraining desktop column widths */
		.recommendations-table .col-name { width: 60%; }
		.recommendations-table .col-quantity { width: 40%; }
		.recommendations-table thead th {
			text-align: left;
			padding: 10px 12px;
			background: #f5f7fb;
			color: #333;
			border-bottom: 1px solid #e6e9ef;
			white-space: nowrap;
			position: sticky;
			top: 0;
			z-index: 1;
		}
		.recommendations-table tbody td {
			padding: 10px 12px;
			border-bottom: 1px solid #f0f2f6;
			vertical-align: middle;
			word-break: break-word;
			overflow-wrap: anywhere;
		}
		/* Ensure name cell composes emoji + text without overflow */
		.recommendations-table td.recommendation-name {
			display: flex;
			align-items: center;
			gap: 8px;
			min-width: 0;
		}
		.recommendations-table tbody tr:hover {
			background: #f9fbff;
		}
		.recommendations-table tbody tr:nth-child(even) {
			background: #fbfcff;
		}
		/* Column alignment */
		.recommendations-table .col-name,
		.recommendations-table td.recommendation-name {
			text-align: left;
		}
		.recommendations-table .col-quantity,
		.recommendations-table td.recommendation-quantity {
			text-align: right;
			white-space: nowrap;
		}
		.recommendation-emoji {
			display: inline-flex;
			width: 22px;
			align-items: center;
			justify-content: center;
			font-size: 18px;
			margin-right: 8px;
			flex: 0 0 22px;
		}
		.recommendation-name-text {
			font-weight: 600;
			color: #2b2f36;
			word-break: break-word;
			overflow-wrap: anywhere;
			display: inline-block;
			max-width: 100%;
			flex: 1 1 auto;
			min-width: 0;
			hyphens: auto;
		}
		.recommendation-quantity .quantity-value {
			display: inline-block;
			padding: 4px 8px;
			background: #eef6ff;
			color: #0b5ed7;
			border: 1px solid #d8e9ff;
			border-radius: 6px;
			font-weight: 600;
			letter-spacing: .1px;
			min-width: 88px;
			text-align: center;
			max-width: 100%;
			white-space: nowrap;
		}
		/* Tablet tweaks */
		@media (max-width: 840px) {
			.recommendations-table {
				font-size: 13px;
			}
			.recommendations-table thead th {
				padding: 8px 10px;
			}
			.recommendations-table tbody td {
				padding: 8px 10px;
			}
		}
		/* Detailed sections layout and spacing */
		#detailedRecommendationsSection {
			margin-top: 18px;
			display: none;
		}
		#soilLossRecommendations,
		#soilTypeRecommendations,
		#vegetationRecommendations {
			background: #fff;
			border: 1px solid #e6e9ef;
			border-radius: 10px;
			padding: 12px 14px;
			margin-top: 12px;
		}
		#soilLossRecommendations h3,
		#soilTypeRecommendations h3,
		#vegetationRecommendations h3 {
			margin: 0 0 8px 0;
			font-size: 15px;
			color: #1f2937;
		}
		/* Bullet list for detailed items */
		.recommendation-bullets {
			margin: 6px 0 0 0;
			padding-left: 18px;
		}
		.recommendation-bullets li {
			margin: 6px 0;
			line-height: 1.4;
			color: #374151;
		}
		/* Footer spacing */
		#recommendationsFooter {
			margin-top: 10px;
		}
		/* Mobile tweaks */
		@media (max-width: 768px) {
			.recommendations-table thead {
				display: none;
			}
			.recommendations-table tbody tr {
				display: block;
				border: 1px solid #eef2f7;
				border-radius: 8px;
				margin-bottom: 10px;
				padding: 8px 10px;
				background: #fff;
				box-shadow: 0 1px 2px rgba(17, 24, 39, 0.05);
			}
			.recommendations-table tbody td {
				display: grid;
				grid-template-columns: 140px 1fr;
				align-items: start;
				gap: 10px;
				border: 0;
				padding: 6px 0;
				min-width: 0; /* allow content to shrink and wrap */
			}
			/* Make name cell content flow correctly within grid */
			.recommendations-table tbody td.recommendation-name {
				display: grid;
				grid-template-columns: 140px 1fr;
				align-items: start;
				gap: 10px;
			}
			.recommendations-table tbody td::before {
				content: attr(data-label);
				font-weight: 600;
				color: #6b7280;
				margin-right: 0;
				line-height: 1.3;
			}
			/* Ensure inner content can wrap without overlapping */
			.recommendations-table tbody td > * {
				min-width: 0;
			}
			/* Allow quantity badge to wrap if constrained */
			.recommendation-quantity .quantity-value {
				white-space: normal;
				hyphens: auto;
				word-break: break-word;
			}
			.recommendations-table td.recommendation-quantity {
				text-align: left;
			}
			.recommendation-quantity .quantity-value {
				font-size: 13px;
				padding: 3px 6px;
				justify-self: start;
			}
			.recommendation-emoji {
				width: 20px;
				font-size: 16px;
				margin-right: 6px;
				flex: 0 0 20px;
			}
		}
		@media (max-width: 480px) {
			.recommendations-table {
				font-size: 12px;
			}
			/* Switch to stacked labels to avoid overlap on very small screens */
			.recommendations-table tbody td {
				grid-template-columns: 1fr;
				gap: 6px;
			}
			.recommendations-table tbody td::before {
				display: block;
				margin-bottom: 2px;
			}
			/* On very small screens, ensure name cell stacks cleanly */
			.recommendations-table tbody td.recommendation-name {
				grid-template-columns: 1fr;
			}
			.recommendation-quantity .quantity-value {
				font-size: 12px;
				padding: 2px 5px;
				max-width: 100%;
				white-space: normal; /* allow badge to wrap if needed */
				word-break: break-word;
				hyphens: auto;
			}
			#soilLossRecommendations h3,
			#soilTypeRecommendations h3,
			#vegetationRecommendations h3 {
				font-size: 14px;
			}
		}
	`;
	document.head.appendChild(style);
})();

