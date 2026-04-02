document.addEventListener('DOMContentLoaded', () => {
    // ---- VANTA.JS BACKGROUND SETUP ----
    let vantaEffect = null;
    
    const initVanta = (isDark) => {
        if (!window.VANTA) return;
        
        // Destroy existing config to avoid memory leaks
        if (vantaEffect) vantaEffect.destroy();
        
        vantaEffect = VANTA.NET({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            // User requested exactly: color: 0x269bd9, backgroundColor: 0x51512
            // For light mode we change it slightly to keep it visible
            color: isDark ? 0x269bd9 : 0x2563eb,
            backgroundColor: isDark ? 0x051512 : 0xf1f5f9,
            points: 15.00,
            maxDistance: 20.00,
            spacing: 15.00
        });
    };

    // ---- UI SETUP ----
    const themeBtn = document.getElementById('theme-btn');
    const exprInput = document.getElementById('expression-input');
    const inputOverlay = document.getElementById('input-overlay');
    const checkBtn = document.getElementById('check-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    const resultSection = document.getElementById('result-section');
    const statusCard = document.getElementById('status-card');
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    
    const visualCard = document.getElementById('visualization-card');
    const stepsList = document.getElementById('steps-list');
    const stackContainer = document.getElementById('stack-container');
    
    const playPauseBtn = document.getElementById('play-pause-btn');
    const speedSlider = document.getElementById('speed-slider');
    
    const historyList = document.getElementById('history-list');
    const emptyHistory = document.getElementById('empty-history');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const toast = document.getElementById('toast');

    let animationSteps = [];
    let currentStepIdx = 0;
    let isPaused = false;
    let animationId = null;
    let history = JSON.parse(localStorage.getItem('bracket_network_history')) || [];

    // Initialize Theme
    let isDarkMode = true;
    if (localStorage.getItem('network_theme') === 'light') {
        isDarkMode = false;
        document.body.classList.replace('dark-mode', 'light-mode');
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.add('dark-mode');
        // If it was empty or dark, enforce body class dark-mode just in case HTML missed it
    }
    
    // Boot up Vanta background based on theme
    initVanta(isDarkMode);
    renderHistory();

    // Event Listeners
    themeBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        
        if (isDarkMode) {
            document.body.classList.replace('light-mode', 'dark-mode');
            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('network_theme', 'dark');
        } else {
            document.body.classList.replace('dark-mode', 'light-mode');
            themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('network_theme', 'light');
        }
        
        // Re-init Vanta to new colors smoothly
        initVanta(isDarkMode);
    });

    exprInput.addEventListener('input', () => {
        inputOverlay.innerHTML = exprInput.value;
    });
    
    exprInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validateExpression();
    });

    checkBtn.addEventListener('click', validateExpression);
    
    clearBtn.addEventListener('click', () => {
        exprInput.value = '';
        inputOverlay.innerHTML = '';
        resultSection.classList.add('hidden');
        resetVisualization();
    });

    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.removeItem('bracket_network_history');
        renderHistory();
        showToast('History purged');
    });

    playPauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        playPauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-pause"></i> Pause';
        if (!isPaused && currentStepIdx < animationSteps.length) {
            runAnimationStep();
        }
    });

    async function validateExpression() {
        const expression = exprInput.value.trim();
        if (!expression) {
            showToast('Scan aborted: Empty input');
            return;
        }

        resultSection.classList.remove('hidden');
        visualCard.classList.add('hidden');
        resetVisualization();
        updateStatus('processing');
        inputOverlay.innerHTML = expression;

        try {
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression })
            });
            const data = await response.json();
            
            if (data.balanced) {
                updateStatus('balanced', data.message);
            } else {
                updateStatus('unbalanced', data.message);
                if (data.errorIndex !== -1) {
                    highlightError(expression, data.errorIndex);
                }
            }

            if (data.steps && data.steps.length > 0) {
                visualCard.classList.remove('hidden');
                animationSteps = data.steps;
                startAnimation();
            }

            addToHistory(expression, data.balanced);
        } catch (error) {
            console.error('Network Validation Error:', error);
            updateStatus('error', 'Server disconnected.');
        }
    }

    function updateStatus(type, msg = '') {
        statusCard.className = 'status-card glass-panel';
        if (type === 'processing') {
            statusIcon.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
            statusTitle.textContent = 'Scanning Data...';
            statusMessage.textContent = 'Parsing expression nodes';
        } else if (type === 'balanced') {
            statusCard.classList.add('balanced');
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            statusTitle.textContent = 'Structure Validated';
            statusMessage.textContent = msg;
        } else if (type === 'unbalanced') {
            statusCard.classList.add('unbalanced');
            statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            statusTitle.textContent = 'Syntax Violation';
            statusMessage.textContent = msg;
        } else if (type === 'error') {
            statusCard.classList.add('unbalanced');
            statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            statusTitle.textContent = 'System Error';
            statusMessage.textContent = msg;
        }
    }

    function highlightError(expr, idx) {
        if (idx < 0 || idx >= expr.length) return;
        const before = expr.substring(0, idx);
        const char = expr.charAt(idx) || ' ';
        const after = expr.substring(idx + 1);
        inputOverlay.innerHTML = `${before.replace(/ /g, '&nbsp;')}<span class="error-char">${char}</span>${after.replace(/ /g, '&nbsp;')}`;
    }

    function resetVisualization() {
        if (animationId) clearTimeout(animationId);
        stepsList.innerHTML = '';
        stackContainer.innerHTML = '<div class="stack-empty-msg" id="stack-empty">Stack is clean</div><div class="stack-base"></div>';
        currentStepIdx = 0;
        animationSteps = [];
        isPaused = false;
        playPauseBtn.disabled = true;
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }

    function startAnimation() {
        playPauseBtn.disabled = false;
        isPaused = false;
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        
        // Let UI settle before animating
        setTimeout(runAnimationStep, 500);
    }

    function runAnimationStep() {
        if (isPaused || currentStepIdx >= animationSteps.length) {
            if (currentStepIdx >= animationSteps.length) {
                playPauseBtn.disabled = true;
                playPauseBtn.innerHTML = '<i class="fas fa-check-double"></i> Verified';
            }
            return;
        }

        const step = animationSteps[currentStepIdx];
        
        const stepEl = document.createElement('div');
        stepEl.className = `step-item active ${step.action}`;
        
        Array.from(stepsList.children).forEach(c => c.classList.remove('active'));
        
        let html = `<span>${step.step_title}</span>`;
        if (step.message) {
            html += `<span class="step-message"><i class="fas fa-bug"></i> ${step.message}</span>`;
        }
        stepEl.innerHTML = html;
        stepsList.appendChild(stepEl);
        stepEl.scrollIntoView({ behavior: 'smooth', block: 'end' });

        renderStack(step.stack, step.action);
        
        currentStepIdx++;
        
        const timeoutMs = parseInt(speedSlider.value);
        animationId = setTimeout(runAnimationStep, timeoutMs);
    }

    function renderStack(currentStack, action) {
        const stackEmptyMsg = document.getElementById('stack-empty');
        if (!stackEmptyMsg) return;
        
        const existingItems = Array.from(stackContainer.querySelectorAll('.stack-item:not(.popping)'));
        
        if (action === 'push') {
            stackEmptyMsg.style.display = 'none';
            const newItem = document.createElement('div');
            newItem.className = 'stack-item';
            // The item pushed is the last one in the backend array
            newItem.textContent = currentStack[currentStack.length - 1];
            stackContainer.appendChild(newItem);
        } else if (action === 'pop') {
            // Find the top item and animate it out
            if (existingItems.length > 0) {
                const topItem = existingItems[existingItems.length - 1];
                topItem.classList.add('popping');
                // Remove from DOM after animation completes (approx 400ms)
                setTimeout(() => {
                    if (topItem.parentNode) topItem.remove();
                    if (currentStack.length === 0) stackEmptyMsg.style.display = 'block';
                }, 400);
            }
        } else if (action === 'error') {
            // On mismatch error, give the top item an error shake
            if (existingItems.length > 0) {
                const topItem = existingItems[existingItems.length - 1];
                topItem.classList.add('error-shake');
            }
            // For general syncing on error
            setTimeout(() => forceSyncStack(currentStack), 500);
        } else {
            forceSyncStack(currentStack);
        }

        function forceSyncStack(stack) {
            stackContainer.querySelectorAll('.stack-item').forEach(el => el.remove());
            if (stack.length === 0) {
                stackEmptyMsg.style.display = 'block';
            } else {
                stackEmptyMsg.style.display = 'none';
                stack.forEach(c => {
                    const item = document.createElement('div');
                    item.className = 'stack-item';
                    item.textContent = c;
                    stackContainer.appendChild(item);
                });
            }
        }
    }

    function addToHistory(expr, isBalanced) {
        if (history.length > 0 && history[0].expr === expr) return;

        const entry = { expr, isBalanced, time: new Date().toISOString() };
        history.unshift(entry);
        if(history.length > 15) history.pop();

        localStorage.setItem('bracket_network_history', JSON.stringify(history));
        renderHistory();
        showToast('Logged to registry');
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            emptyHistory.classList.remove('hidden');
            return;
        }
        emptyHistory.classList.add('hidden');

        history.forEach((item) => {
            const li = document.createElement('li');
            li.className = `history-item ${item.isBalanced ? 'balanced' : 'unbalanced'}`;
            li.innerHTML = `
                <span class="history-expr">${item.expr}</span>
                <span class="history-result">
                    ${item.isBalanced ? '<i class="fas fa-check-circle"></i> Valid' : '<i class="fas fa-times-circle"></i> Invalid'}
                </span>
            `;
            li.addEventListener('click', () => {
                exprInput.value = item.expr;
                validateExpression();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            historyList.appendChild(li);
        });
    }

    function showToast(msg) {
        toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }
    
    // Cleanup vanilla logic if user leaves
    window.addEventListener('beforeunload', () => {
        if (vantaEffect) vantaEffect.destroy();
    });
});
