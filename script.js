const RANDOM_QUOTE_API_URL = 'https://dummyjson.com/quotes/random';
const quoteDisplayElement = document.getElementById('quote-display');
const quoteInputElement = document.getElementById('quote-input');
const timerElement = document.getElementById('time');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const restartBtn = document.getElementById('restart-btn');

let startTime;
let timerInterval;
let isTyping = false;

// 1. Fetch Quote from API
async function getRandomQuote() {
    const response = await fetch(RANDOM_QUOTE_API_URL);
    const data = await response.json();
    return data.quote;
}

// 2. Render Quote into individual span elements
async function renderNewQuote() {
    const quote = await getRandomQuote();
    quoteDisplayElement.innerHTML = '';
    
    // Split the quote into an array of characters and wrap each in a span
    quote.split('').forEach(character => {
        const characterSpan = document.createElement('span');
        characterSpan.innerText = character;
        quoteDisplayElement.appendChild(characterSpan);
    });
    
    quoteInputElement.value = null;
    resetStats();
}

// 3. Real-time Event Listener for Input
quoteInputElement.addEventListener('input', () => {
    if (!isTyping) {
        startTimer();
        isTyping = true;
    }

    const arrayQuote = quoteDisplayElement.querySelectorAll('span');
    const arrayValue = quoteInputElement.value.split('');
    let correctCharacters = 0;
    let totalTyped = arrayValue.length;
    let allCorrect = true;

    arrayQuote.forEach((characterSpan, index) => {
        const character = arrayValue[index];
        
        if (character == null) {
            // User hasn't typed this character yet
            characterSpan.classList.remove('correct');
            characterSpan.classList.remove('incorrect');
            allCorrect = false;
        } else if (character === characterSpan.innerText) {
            // Correctly typed character
            characterSpan.classList.add('correct');
            characterSpan.classList.remove('incorrect');
            correctCharacters++;
        } else {
            // Incorrectly typed character
            characterSpan.classList.remove('correct');
            characterSpan.classList.add('incorrect');
            allCorrect = false;
        }
    });

    calculateStats(correctCharacters, totalTyped);

    // Stop timer and finish if the user typed everything correctly
    if (allCorrect && arrayValue.length === arrayQuote.length) {
        clearInterval(timerInterval);
        quoteInputElement.disabled = true;
    }
});

// 4. Mathematical Logic for WPM and Accuracy
function calculateStats(correctChars, totalTyped) {
    if (totalTyped === 0) return;

    // Accuracy: (Correct Characters / Total Typed Characters) * 100
    const accuracy = Math.round((correctChars / totalTyped) * 100);
    accuracyElement.innerText = accuracy;

    // WPM: (Total Correct Characters / 5) / (Time in Minutes)
    // Standard typing metrics assume a word is 5 characters long
    const timeElapsedInMinutes = getTimerTime() / 60;
    if (timeElapsedInMinutes > 0) {
        const wpm = Math.round((correctChars / 5) / timeElapsedInMinutes);
        wpmElement.innerText = wpm;
    }
}

// 5. Timer Functions
function startTimer() {
    timerElement.innerText = 0;
    startTime = new Date();
    timerInterval = setInterval(() => {
        timerElement.innerText = getTimerTime();
        // Recalculate WPM every second to keep the stat live
        const currentCorrect = document.querySelectorAll('.correct').length;
        calculateStats(currentCorrect, quoteInputElement.value.length);
    }, 1000);
}

function getTimerTime() {
    return Math.floor((new Date() - startTime) / 1000);
}

function resetStats() {
    clearInterval(timerInterval);
    timerElement.innerText = 0;
    wpmElement.innerText = 0;
    accuracyElement.innerText = 100;
    isTyping = false;
    quoteInputElement.disabled = false;
    quoteInputElement.focus();
}

// Event listener for restart button
restartBtn.addEventListener('click', renderNewQuote);

// Initialize the first quote on load
renderNewQuote();