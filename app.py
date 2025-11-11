"""
Flask backend for TOCSEA system
Handles Together AI API integration for plant/tree recommendations
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from together import Together
import os
import re

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable CORS for frontend requests

# Initialize Together AI client
TOGETHER_API_KEY = "tgp_v1_rQ3i3iNCz3UaTBeVo_iBAvfB_OVdSQ1Q8kOpt6izrf8"
client = Together(api_key=TOGETHER_API_KEY)

def clean_ai_response(text):
    """
    Clean up verbose AI responses to extract only the essential recommendations
    Ensures all valid recommendations are preserved
    """
    lines = text.split('\n')
    cleaned_lines = []
    
    # Skip patterns that indicate verbose explanations (but be careful not to skip valid recommendations)
    skip_patterns = [
        'okay, so', 'i need to', 'i remember', 'i think', 'maybe', 'hmm', 'wait',
        "i'm not sure", 'i should', 'putting it all together', 'to address',
        'important:', 'additional recommendations', 'maintenance:', 'spacing:',
        'benefits:', 'quantity:', 'hectare', 'per hectare', 'these species',
        'combining', 'chosen for', 'promoting', 'based on', 'examples of what'
    ]
    
    for line in lines:
        line_lower = line.lower().strip()
        original_line = line.strip()
        
        # Skip if line is too long (likely explanation) - but allow up to 120 chars for longer plant names
        if len(line) > 120:
            continue
        
        # Skip if line contains skip patterns (but check it's not part of a valid recommendation)
        if any(pattern in line_lower for pattern in skip_patterns):
            # Double check - if it has emoji and number, it might still be valid
            if not (('🌳' in line or '🌴' in line or '🌾' in line or '🌿' in line or '🌱' in line) and any(char.isdigit() for char in line)):
                continue
        
        # Skip markdown formatting headers
        if line.strip().startswith('**') and not any(char.isdigit() for char in line):
            continue
        if line.strip().startswith('#') and not any(char.isdigit() for char in line):
            continue
        
        # Keep lines that look like recommendations
        # Pattern 1: Contains emoji and number
        if ('🌳' in line or '🌴' in line or '🌾' in line or '🌿' in line or '🌱' in line) and any(char.isdigit() for char in line):
            cleaned_lines.append(original_line)
        # Pattern 2: Contains dash/hyphen and number (common format)
        elif ('–' in line or '-' in line) and any(char.isdigit() for char in line) and len(line) < 100:
            # Make sure it's not just an explanation line
            if not any(skip in line_lower for skip in ['example', 'format', 'include', 'provide']):
                cleaned_lines.append(original_line)
        # Pattern 3: Number followed by plant name (alternative format)
        elif any(char.isdigit() for char in line) and len(line) < 100:
            # Check if it looks like "25 trees" or "Coconut 18" format
            if ('tree' in line_lower or 'clump' in line_lower or 'cluster' in line_lower or 
                'coconut' in line_lower or 'pandan' in line_lower or 'mahogany' in line_lower or
                'vetiver' in line_lower or 'bamboo' in line_lower or 'grass' in line_lower):
                if not any(skip in line_lower for skip in ['example', 'format', 'include', 'provide', 'important']):
                    cleaned_lines.append(original_line)
    
    return '\n'.join(cleaned_lines) if cleaned_lines else text

def get_ai_recommendations(soil_type, soil_loss):
    """
    Get AI-generated recommendations for trees and plants based on soil type and predicted soil loss
    
    Args:
        soil_type (str): The selected soil type (e.g., "Loamy Soil", "Sandy Soil")
        soil_loss (float): Predicted soil loss in metric tons per year
    
    Returns:
        str: AI-generated recommendations text
    """
    prompt = f"""Based on a predicted soil loss of {soil_loss:.2f} metric tons per year for {soil_type}, provide a COMPLETE list of ALL suitable trees and plants to reduce erosion.

IMPORTANT REQUIREMENTS:
- List ALL suitable species for {soil_type} that help control erosion
- Include coastal/tropical trees like Coconut and Pandan if suitable for the soil type
- Consider the soil loss level ({soil_loss:.2f} metric tons/year) to determine appropriate quantities
- Provide ONLY a simple list format - NO explanations, reasoning, or thinking process
- NO spacing details, benefits, or hectares

Format each recommendation exactly like this:
🌳 Plant/Tree Name – [number] [unit]

Examples of what to include (if suitable for {soil_type}):
🌴 Coconut – [number] trees
🌿 Pandan – [number] trees
🌳 Mahogany – [number] trees
🌾 Vetiver grass – [number] clumps
🌿 Bamboo – [number] clusters
🌱 [Other suitable species] – [number] [unit]

Provide ALL suitable recommendations (typically 5-10 species). Use simple units like "trees", "clumps", or "clusters". Ensure the list is COMPLETE and includes all relevant species for {soil_type}."""

    try:
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        raw_response = response.choices[0].message.content
        # Clean up verbose responses
        cleaned_response = clean_ai_response(raw_response)
        
        return cleaned_response
    except Exception as e:
        return f"Error generating recommendations: {str(e)}"

def get_detailed_recommendations(soil_type, soil_loss, vegetation_list):
    """
    Get detailed AI-generated recommendations in three sections:
    1. Based on predicted soil loss
    2. Based on selected soil type
    3. For recommended vegetation
    
    Args:
        soil_type (str): The selected soil type
        soil_loss (float): Predicted soil loss in metric tons per year
        vegetation_list (str): List of recommended vegetation
    
    Returns:
        dict: Dictionary with three sections of recommendations
    """
    prompt = f"""Based on the following information:
- Predicted Soil Loss: {soil_loss:.2f} metric tons per year
- Selected Soil Type: {soil_type}
- Recommended Vegetation: {vegetation_list}

Provide ONLY actionable recommendations in THREE sections. NO explanations, NO thinking process, NO reasoning.

SECTION 1:
List 3-5 bullet points for mitigating soil loss of {soil_loss:.2f} metric tons/year.

SECTION 2:
List 3-5 bullet points for managing {soil_type} soil.

SECTION 3:
List 3-5 bullet points for planting and maintaining the recommended vegetation.

Format each section EXACTLY like this:
SECTION 1:
• First recommendation
• Second recommendation
• Third recommendation

SECTION 2:
• First recommendation
• Second recommendation

SECTION 3:
• First recommendation
• Second recommendation

Use ONLY bullet points (•). NO paragraphs, NO explanations, NO thinking process."""

    try:
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        detailed_text = response.choices[0].message.content
        
        # Clean verbose explanations first
        cleaned_text = clean_detailed_response(detailed_text)
        
        # Parse the response into three sections
        sections = {
            "soil_loss": "",
            "soil_type": "",
            "vegetation": ""
        }
        
        # Method 1: Split by SECTION headers
        section_patterns = [
            (r'SECTION\s*1[:\-]?\s*', r'SECTION\s*2[:\-]?\s*', "soil_loss"),
            (r'SECTION\s*2[:\-]?\s*', r'SECTION\s*3[:\-]?\s*', "soil_type"),
            (r'SECTION\s*3[:\-]?\s*', r'$', "vegetation"),
        ]
        
        for start_pattern, end_pattern, section_key in section_patterns:
            match = re.search(start_pattern, cleaned_text, re.IGNORECASE)
            if match:
                start_pos = match.end()
                end_match = re.search(end_pattern, cleaned_text[start_pos:], re.IGNORECASE)
                if end_match:
                    sections[section_key] = cleaned_text[start_pos:start_pos + end_match.start()].strip()
                else:
                    sections[section_key] = cleaned_text[start_pos:].strip()
        
        # Clean each section to keep only bullet points
        for key in sections:
            sections[key] = clean_section_text(sections[key])
        
        return sections
    except Exception as e:
        return {
            "soil_loss": f"Error generating recommendations: {str(e)}",
            "soil_type": "",
            "vegetation": ""
        }

def clean_detailed_response(text):
    """Remove verbose explanations and thinking process from detailed recommendations"""
    lines = text.split('\n')
    cleaned_lines = []
    
    skip_patterns = [
        'okay, so', 'i need to', 'i remember', 'i think', 'maybe', 'hmm', 'wait',
        "i'm not sure", 'i should', 'putting it all together', 'to address',
        'moving on to', 'finally', 'i also need', 'i should make sure',
        'i need to ensure', 'finally, i\'ll review', 'this way', 'that\'s a',
        'i should think', 'comes to mind', 'i need to suggest', 'i should list',
        'i should make', 'i need to ensure', 'keeping each section'
    ]
    
    for line in lines:
        line_lower = line.lower().strip()
        # Skip verbose explanation lines
        if any(pattern in line_lower for pattern in skip_patterns):
            continue
        # Skip lines that are too long (likely explanations)
        if len(line) > 200:
            continue
        # Skip lines that don't contain bullet points or section headers
        if not (line.strip().startswith('•') or 
                line.strip().startswith('-') or 
                line.strip().startswith('*') or
                'SECTION' in line.upper() or
                line.strip().startswith('**')):
            # But keep short lines that might be part of a bullet point
            if len(line.strip()) < 50:
                cleaned_lines.append(line)
        else:
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def clean_section_text(text):
    """Clean section text to keep only bullet points"""
    if not text:
        return ""
    
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Skip explanation lines
        if any(word in line.lower() for word in ['that\'s', 'i should', 'i need', 'moving on', 'finally']):
            continue
        
        # Keep only bullet points
        if line.startswith('•') or line.startswith('-') or line.startswith('*'):
            # Remove markdown bold
            line = re.sub(r'\*\*([^*]+)\*\*', r'\1', line)
            # Remove extra spaces
            line = re.sub(r'\s+', ' ', line)
            cleaned_lines.append(line)
        # Keep section headers
        elif 'SECTION' in line.upper():
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """
    API endpoint to get plant/tree recommendations
    Expects JSON: {"soil_type": "Loamy Soil", "soil_loss": 7.82}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        soil_type = data.get('soil_type')
        soil_loss = data.get('soil_loss')
        
        if not soil_type or soil_loss is None:
            return jsonify({"error": "Missing required fields: soil_type and soil_loss"}), 400
        
        # Get AI recommendations for vegetation list
        recommendations = get_ai_recommendations(soil_type, float(soil_loss))
        
        # Get detailed recommendations in three sections
        detailed_recommendations = get_detailed_recommendations(
            soil_type, 
            float(soil_loss), 
            recommendations[:500]  # Limit vegetation list length for prompt
        )
        
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "detailed_recommendations": detailed_recommendations
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, images, etc.)"""
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

