"""
================================================================================
TOCSEA - Coastal Soil Erosion Prediction System
Backend API Server
================================================================================

This Flask application provides the backend API for the TOCSEA system.
It handles AI-powered recommendations for soil erosion mitigation using
Together AI's language model.

Author: TOCSEA Development Team
Version: 1.0.0
================================================================================
"""

# ============================================================================
# IMPORTS AND DEPENDENCIES
# ============================================================================

import os
import re
import warnings
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from together import Together

# ============================================================================
# CONFIGURATION AND INITIALIZATION
# ============================================================================

# Suppress Flask development server warnings
warnings.filterwarnings('ignore', message='.*development server.*')

# Flask application initialization
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable Cross-Origin Resource Sharing

# Together AI API configuration
TOGETHER_API_KEY = os.getenv(
    'TOGETHER_API_KEY', 
    'tgp_v1_rQ3i3iNCz3UaTBeVo_iBAvfB_OVdSQ1Q8kOpt6izrf8'
)
client = Together(api_key=TOGETHER_API_KEY)

# AI Model configuration
AI_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct-Lite"
AI_TEMPERATURE = 0.3
AI_MAX_TOKENS_RECOMMENDATIONS = 500
AI_MAX_TOKENS_DETAILED = 800

# ============================================================================
# HELPER FUNCTIONS - AI Response Processing
# ============================================================================

def parse_vegetation_recommendations(raw_response):
    """
    Parse and extract vegetation recommendations from AI response.
    
    Handles multiple formats:
    - Multi-line format with emojis
    - Single-line format with multiple recommendations
    - Corrupted emoji characters
    
    Args:
        raw_response (str): Raw text response from AI
        
    Returns:
        str: Clean, formatted recommendations text
    """
    lines = raw_response.split('\n')
    recommendations = []
    
    # Extract lines matching recommendation format
    # Pattern: (optional emoji/char) + name + dash + number + unit
    for line in lines:
        line = line.strip()
        if re.match(r'^.{0,3}\s*.+?[–\-]\s*\d+\s+\w+', line):
            recommendations.append(line)
    
    # If found, return formatted recommendations
    if recommendations:
        return '\n'.join(recommendations)
    
    # Fallback: Try single-line format extraction
    single_line_pattern = r'.{0,3}\s+[^–\-]+?[–\-]\s*\d+\s+\w+'
    matches = re.findall(single_line_pattern, raw_response)
    if matches:
        return '\n'.join(matches)
    
    # Final fallback: return raw response
    return raw_response


def parse_detailed_recommendations(detailed_text):
    """
    Parse detailed recommendations into three structured sections.
    
    Extracts bullet points from three sections:
    1. Soil loss mitigation recommendations
    2. Soil type management recommendations
    3. Vegetation planting/maintenance recommendations
    
    Args:
        detailed_text (str): Raw detailed recommendations text
        
    Returns:
        dict: Dictionary with keys: 'soil_loss', 'soil_type', 'vegetation'
    """
    sections = {
        "soil_loss": "",
        "soil_type": "",
        "vegetation": ""
    }
    
    # Section patterns: (start_pattern, end_pattern, section_key)
    section_patterns = [
        (r'SECTION\s*1[:\-]?\s*', r'SECTION\s*2[:\-]?\s*', "soil_loss"),
        (r'SECTION\s*2[:\-]?\s*', r'SECTION\s*3[:\-]?\s*', "soil_type"),
        (r'SECTION\s*3[:\-]?\s*', r'$', "vegetation"),
    ]
    
    for start_pattern, end_pattern, section_key in section_patterns:
        match = re.search(start_pattern, detailed_text, re.IGNORECASE)
        if not match:
            continue
        
        # Extract section content
        start_pos = match.end()
        end_match = re.search(end_pattern, detailed_text[start_pos:], re.IGNORECASE)
        
        if end_match:
            section_text = detailed_text[start_pos:start_pos + end_match.start()].strip()
        else:
            section_text = detailed_text[start_pos:].strip()
        
        # Extract bullet points from section
        lines = section_text.split('\n')
        bullet_points = []
        
        for line in lines:
            line = line.strip()
            # Match bullet point format: •, -, or *
            if re.match(r'^[•\-\*]\s+', line):
                # Clean content: remove bullet marker and markdown
                content = re.sub(r'^[•\-\*]\s+', '', line).strip()
                content = re.sub(r'\*\*([^*]+)\*\*', r'\1', content)
                
                # Only include substantial content
                if content and len(content) > 5:
                    bullet_points.append('• ' + content)
        
        sections[section_key] = '\n'.join(bullet_points)
    
    return sections

# ============================================================================
# AI INTEGRATION FUNCTIONS
# ============================================================================

def get_ai_recommendations(soil_type, soil_loss):
    """
    Get AI-generated vegetation recommendations based on soil conditions.
    
    Uses Together AI to generate a list of recommended trees and plants
    suitable for the given soil type and soil loss level.
    
    Args:
        soil_type (str): Selected soil type (e.g., "Loamy Soil", "Sandy Soil")
        soil_loss (float): Predicted soil loss in metric tons per year
        
    Returns:
        str: Formatted recommendations text with plant names and quantities
    """
    prompt = f"""You are a soil erosion expert. Provide ONLY the final recommendation list. NO explanations, NO thinking process, NO meta-commentary.

Soil Type: {soil_type}
Predicted Soil Loss: {soil_loss:.2f} metric tons per year

Output format (ONLY output the list, nothing else):
🌴 Coconut – [number] trees
🌿 Pandan – [number] trees
🌳 Mahogany – [number] trees
🌾 Vetiver grass – [number] clumps
🌿 Bamboo – [number] clusters
🌱 [Species Name] – [number] [unit]

Requirements:
- List 5-10 suitable species for {soil_type}
- Include quantities based on soil loss level
- Use format: [emoji] [Name] – [number] [unit]
- NO explanations, NO "based on", NO "these species", NO thinking process
- Start immediately with the first recommendation"""

    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise expert. Output ONLY the final recommendations. No explanations, no thinking process, no meta-commentary."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=AI_TEMPERATURE,
            max_tokens=AI_MAX_TOKENS_RECOMMENDATIONS
        )
        
        raw_response = response.choices[0].message.content.strip()
        return parse_vegetation_recommendations(raw_response)
        
    except Exception as e:
        return f"Error generating recommendations: {str(e)}"


def get_detailed_recommendations(soil_type, soil_loss, vegetation_list):
    """
    Get detailed AI-generated recommendations in three structured sections.
    
    Generates comprehensive recommendations covering:
    1. Soil loss mitigation strategies
    2. Soil type management practices
    3. Vegetation planting and maintenance guidelines
    
    Args:
        soil_type (str): Selected soil type
        soil_loss (float): Predicted soil loss in metric tons per year
        vegetation_list (str): List of recommended vegetation
        
    Returns:
        dict: Dictionary with three sections:
            - 'soil_loss': Recommendations for mitigating soil loss
            - 'soil_type': Recommendations for managing soil type
            - 'vegetation': Recommendations for planting/maintaining vegetation
    """
    prompt = f"""You are a soil management expert. Output ONLY the final recommendations. NO explanations, NO thinking process, NO meta-commentary.

Soil Loss: {soil_loss:.2f} metric tons/year
Soil Type: {soil_type}
Vegetation: {vegetation_list[:200]}

Output format (ONLY output the sections, nothing else):
SECTION 1:
• Recommendation 1
• Recommendation 2
• Recommendation 3

SECTION 2:
• Recommendation 1
• Recommendation 2
• Recommendation 3

SECTION 3:
• Recommendation 1
• Recommendation 2
• Recommendation 3

Requirements:
- SECTION 1: 3-5 bullet points for mitigating {soil_loss:.2f} metric tons/year soil loss
- SECTION 2: 3-5 bullet points for managing {soil_type} soil
- SECTION 3: 3-5 bullet points for planting/maintaining the vegetation
- Use ONLY bullet points (•)
- NO explanations, NO "based on", NO thinking process
- Start immediately with "SECTION 1:"
"""

    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise expert. Output ONLY the final recommendations in the exact format requested. No explanations, no thinking process, no meta-commentary."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=AI_TEMPERATURE,
            max_tokens=AI_MAX_TOKENS_DETAILED
        )
        
        detailed_text = response.choices[0].message.content.strip()
        return parse_detailed_recommendations(detailed_text)
        
    except Exception as e:
        return {
            "soil_loss": f"Error: {str(e)}",
            "soil_type": "",
            "vegetation": ""
        }

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """
    API Endpoint: Get AI-powered vegetation recommendations.
    
    Request Body (JSON):
        {
            "soil_type": "Loamy Soil",
            "soil_loss": 7.82
        }
    
    Response (JSON):
        {
            "success": true,
            "recommendations": "...",
            "detailed_recommendations": {
                "soil_loss": "...",
                "soil_type": "...",
                "vegetation": "..."
            }
        }
    
    Status Codes:
        200: Success
        400: Bad Request (missing or invalid parameters)
        500: Internal Server Error
    """
    try:
        # Validate request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        soil_type = data.get('soil_type')
        soil_loss = data.get('soil_loss')
        
        if not soil_type or soil_loss is None:
            return jsonify({
                "error": "Missing required fields: soil_type and soil_loss"
            }), 400
        
        # Generate AI recommendations
        recommendations = get_ai_recommendations(soil_type, float(soil_loss))
        
        # Generate detailed recommendations
        detailed_recommendations = get_detailed_recommendations(
            soil_type,
            float(soil_loss),
            recommendations[:500]  # Limit length for prompt efficiency
        )
        
        # Return success response
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "detailed_recommendations": detailed_recommendations
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    API Endpoint: Health check for monitoring and load balancers.
    
    Returns:
        JSON: {"status": "healthy"}
        Status Code: 200
    """
    return jsonify({"status": "healthy"}), 200


@app.route('/')
def index():
    """
    Serve the main HTML page.
    
    Returns:
        HTML: index.html file
    """
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """
    Serve static files (CSS, JS, images, etc.).
    
    Args:
        path (str): Path to the static file
        
    Returns:
        File: Requested static file
    """
    return send_from_directory('.', path)

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    import logging
    
    # Configure logging to suppress development server warnings
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    
    # Run Flask development server
    app.run(debug=True, port=5000)
