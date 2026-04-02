from flask import Flask, request, jsonify

app = Flask(__name__)

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
    return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BracketBrain - Balanced Bracket Validator</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Outfit', sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; background: linear-gradient(45deg, #00ff88, #00ccff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .input-area { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 30px; margin-bottom: 30px; backdrop-filter: blur(10px); }
        .input-field { width: 100%; padding: 15px; border: none; border-radius: 10px; background: rgba(255,255,255,0.1); color: #fff; font-size: 1.2rem; margin-bottom: 20px; }
        .btn { padding: 15px 30px; border: none; border-radius: 10px; background: linear-gradient(45deg, #00ff88, #00ccff); color: #000; font-weight: bold; cursor: pointer; margin-right: 10px; }
        .result { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 30px; backdrop-filter: blur(10px); }
        .balanced { border-left: 5px solid #00ff88; }
        .unbalanced { border-left: 5px solid #ff4444; }
        .steps { margin-top: 20px; }
        .step { padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.05); border-radius: 8px; }
        .push { border-left: 3px solid #00ff88; }
        .pop { border-left: 3px solid #ffaa00; }
        .error { border-left: 3px solid #ff4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-code"></i> BracketBrain</h1>
            <p>Advanced Bracket Validation System</p>
        </div>
        
        <div class="input-area">
            <input type="text" id="expression" class="input-field" placeholder="Enter expression (e.g., {[(a+b)]*c})" />
            <button onclick="validate()" class="btn"><i class="fas fa-play"></i> Validate</button>
            <button onclick="clearInput()" class="btn" style="background: rgba(255,255,255,0.2);"><i class="fas fa-eraser"></i> Clear</button>
        </div>
        
        <div id="result" class="result" style="display: none;">
            <h2 id="status"></h2>
            <p id="message"></p>
            <div id="steps" class="steps"></div>
        </div>
    </div>
    
    <script>
        async function validate() {
            const expression = document.getElementById('expression').value;
            if (!expression) return;
            
            try {
                const response = await fetch('/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expression })
                });
                const data = await response.json();
                
                const result = document.getElementById('result');
                const status = document.getElementById('status');
                const message = document.getElementById('message');
                const steps = document.getElementById('steps');
                
                result.style.display = 'block';
                
                if (data.balanced) {
                    status.textContent = '✅ Balanced';
                    result.className = 'result balanced';
                } else {
                    status.textContent = '❌ Unbalanced';
                    result.className = 'result unbalanced';
                }
                
                message.textContent = data.message;
                
                steps.innerHTML = '<h3>Steps:</h3>';
                data.steps.forEach(step => {
                    const stepDiv = document.createElement('div');
                    stepDiv.className = `step ${step.action}`;
                    stepDiv.textContent = step.step_title;
                    if (step.message) {
                        stepDiv.innerHTML += `<br><small>${step.message}</small>`;
                    }
                    steps.appendChild(stepDiv);
                });
                
            } catch (error) {
                console.error('Error:', error);
            }
        }
        
        function clearInput() {
            document.getElementById('expression').value = '';
            document.getElementById('result').style.display = 'none';
        }
        
        document.getElementById('expression').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validate();
        });
    </script>
</body>
</html>'''

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
