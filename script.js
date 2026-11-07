const RANDOM_QUOTE_API_URL = 'https://dummyjson.com/quotes/random';
const quoteDisplayElement = document.getElementById('quote-display');
const quoteInputElement = document.getElementById('quote-input');
const timerElement = document.getElementById('time');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const stopBtn = document.getElementById('stop-btn');
const themeToggle = document.getElementById('theme-toggle');
const bgToggle = document.getElementById('bg-toggle');

let startTime;
let timerInterval;
let isGameActive = false;
let currentQuote = "";

// Animated Particles Background Logic using HTML5 Canvas
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];
let animId = null;

function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', handleResize);
handleResize();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
        const theme = document.documentElement.getAttribute('data-theme');
        ctx.fillStyle = theme === 'dark' ? `rgba(77, 166, 255, ${this.opacity})` : `rgba(0, 102, 204, ${this.opacity / 2})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particlesArray = [];
    const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 18000));
    for (let i = 0; i < count; i++) {
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesArray.forEach(p => {
        p.update();
        p.draw();
    });
    animId = requestAnimationFrame(animateParticles);
}

// Background animation controller
bgToggle.addEventListener('click', () => {
    const isAnimActive = document.body.classList.toggle('animated-bg');
    if (isAnimActive) {
        initParticles();
        animateParticles();
        bgToggle.querySelector('i').className = "fa-solid fa-wand-magic-sparkles";
    } else {
        cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bgToggle.querySelector('i').className = "fa-solid fa-wand-magic";
    }
});

// Primary Start Game logic
async function startGame() {
    startOverlay.classList.add('hidden');
    restartBtn.disabled = false;
    stopBtn.disabled = false;
    quoteInputElement.disabled = false;
    quoteInputElement.value = "";
    quoteInputElement.focus();
    isGameActive = true;
    
    await getAndRenderQuote();
    startTimer();
}

// Stats tracking configuration
function resetStats() {
    clearInterval(timerInterval);
    timerElement.innerText = 0;
    wpmElement.innerText = 0;
    accuracyElement.innerText = 100;
    isGameActive = false;
    stopBtn.disabled = true;
}

// Core Character Split & Rendering 
async function getAndRenderQuote() {
    try {
        quoteDisplayElement.innerHTML = 'Loading fresh quote...';
        const response = await fetch(RANDOM_QUOTE_API_URL);
        const data = await response.json();
        currentQuote = data.quote;
        quoteDisplayElement.innerHTML = '';
        
        currentQuote.split('').forEach((char, index) => {
            const charSpan = document.createElement('span');
            charSpan.innerText = char;
            if (index === 0) charSpan.classList.add('current');
            quoteDisplayElement.appendChild(charSpan);
        });
    } catch (err) {
        quoteDisplayElement.innerText = "Error fetching from API. Press 'Restart Match' to retry.";
    }
}

// Keystroke input logic & dynamic highlighting
quoteInputElement.addEventListener('input', () => {
    if (!isGameActive) return;

    const arrayQuote = quoteDisplayElement.querySelectorAll('span');
    const arrayValue = quoteInputElement.value.split('');
    let correctCharacters = 0;
    let typedLength = arrayValue.length;

    arrayQuote.forEach((span, index) => {
        const char = arrayValue[index];

        // Remove indicator & typing cursor styles
        span.classList.remove('current');

        if (char == null) {
            span.classList.remove('correct', 'incorrect');
            if (index === typedLength) {
                span.classList.add('current'); // cursor highlight target
            }
        } else if (char === span.innerText) {
            span.classList.add('correct');
            span.classList.remove('incorrect');
            correctCharacters++;
        } else {
            span.classList.remove('correct');
            span.classList.add('incorrect');
        }
    });

    calculateLiveStats(correctCharacters, typedLength);

    // Stop execution check for completion
    if (typedLength >= arrayQuote.length) {
        completeTest();
    }
});

function calculateLiveStats(correct, total) {
    if (total === 0) return;
    const accuracy = Math.round((correct / total) * 100);
    accuracyElement.innerText = isNaN(accuracy) ? 0 : accuracy;

    const timePassed = getTimerTime();
    if (timePassed > 0) {
        const wpm = Math.round((correct / 5) / (timePassed / 60));
        wpmElement.innerText = Math.max(0, wpm);
    }
}

// Real-time counting and clock display
function startTimer() {
    startTime = new Date();
    timerInterval = setInterval(() => {
        const time = getTimerTime();
        timerElement.innerText = time;
        // recalculate WPM every second to keep current state live
        const currentCorrect = quoteDisplayElement.querySelectorAll('.correct').length;
        const totalTyped = quoteInputElement.value.length;
        calculateLiveStats(currentCorrect, totalTyped);
    }, 1000);
}

function getTimerTime() {
    return Math.floor((new Date() - startTime) / 1000);
}

function completeTest() {
    clearInterval(timerInterval);
    isGameActive = false;
    quoteInputElement.disabled = true;
    stopBtn.disabled = true;
    
    // Add success feedback animations 
    quoteDisplayElement.innerHTML += `<div class="completed-banner" style="color:var(--correct-char); font-weight:bold; margin-top:1.5rem; animation: pulseGlow 1.5s infinite;"><i class="fa-solid fa-circle-check"></i> Test Completed Successfully!</div>`;
}

// Manual Stop Trigger
function stopTest() {
    if (!isGameActive) return;
    
    clearInterval(timerInterval);
    isGameActive = false;
    quoteInputElement.disabled = true;
    stopBtn.disabled = true;
    
    quoteDisplayElement.innerHTML += `<div class="completed-banner" style="color:var(--text-secondary); font-weight:bold; margin-top:1.5rem;"><i class="fa-solid fa-circle-exclamation"></i> Test Stopped.</div>`;
}

// Reset triggers
async function restartGame() {
    resetStats();
    await getAndRenderQuote();
    startTime = new Date();
    isGameActive = true;
    quoteInputElement.disabled = false;
    stopBtn.disabled = false;
    quoteInputElement.value = "";
    quoteInputElement.focus();
    startTimer();
}

// Light & Dark Modes Theme Controller
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', targetTheme);
    themeToggle.querySelector('i').className = targetTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
});

// Event Triggers Configuration
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
stopBtn.addEventListener('click', stopTest);

// Initial triggers
initParticles();
animateParticles();