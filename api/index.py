from flask import Flask, render_template, request, jsonify
import os
from pathlib import Path

app = Flask(__name__, 
    template_folder='../templates',
    static_folder='../static')

def check_balance(expression):
    stack = []
    steps = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    for i, char in enumerate(expression):
        if char in pairs.values():
            stack.append((char, i))
            steps.append({
                'step_title': f"Step {len(steps) + 1}: '{char}' → push",
                'stack': [c[0] for c in stack],
                'action': 'push',
                'char': char,
                'index': i
            })
        elif char in pairs.keys():
            if not stack:
                steps.append({
                    'step_title': f"Step {len(steps) + 1}: '{char}' → error (empty stack)",
                    'stack': [c[0] for c in stack],
                    'action': 'error',
                    'char': char,
                    'index': i,
                    'message': f"Unexpected closing bracket '{char}' at position {i+1}"
                })
                return False, steps, f"Unexpected closing bracket '{char}' at position {i+1}", i
            
            top_char, top_index = stack.pop()
            if pairs[char] != top_char:
                stack.append((top_char, top_index)) # put it back to show state when error occurs
                expected_close = next(k for k, v in pairs.items() if v == top_char)
                steps.append({
                    'step_title': f"Step {len(steps) + 1}: '{char}' → error (mismatch)",
                    'stack': [c[0] for c in stack],
                    'action': 'error',
                    'char': char,
                    'index': i,
                    'message': f"Mismatched closing bracket '{char}' at position {i+1}. Expected '{expected_close}'."
                })
                return False, steps, f"Mismatched closing bracket '{char}' at position {i+1}", i
            
            steps.append({
                'step_title': f"Step {len(steps) + 1}: '{char}' → pop",
                'stack': [c[0] for c in stack],
                'action': 'pop',
                'char': char,
                'index': i
            })
            
    if stack:
        top_char, top_index = stack[-1]
        steps.append({
            'step_title': f"Step {len(steps) + 1}: End → error (stack not empty)",
            'stack': [c[0] for c in stack],
            'action': 'error',
            'char': '',
            'index': len(expression),
            'message': f"Missing closing bracket for '{top_char}' at position {top_index+1}"
        })
        return False, steps, f"Missing closing bracket for '{top_char}'", top_index
        
    return True, steps, "Expression is balanced ✅", -1

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/validate', methods=['POST'])
def validate():
    data = request.get_json()
    if not data or 'expression' not in data:
        return jsonify({'error': 'No expression provided'}), 400
        
    expression = data.get('expression', '')
    if not expression.strip():
        return jsonify({
            'balanced': True,
            'steps': [],
            'message': "Ready to validate",
            'errorIndex': -1
        })
        
    is_balanced, steps, message, error_index = check_balance(expression)
    
    return jsonify({
        'balanced': is_balanced,
        'steps': steps,
        'message': message,
        'errorIndex': error_index
    })

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
