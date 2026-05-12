// State Management
let gameState = {
    p1Name: "Player 1",
    p2Name: "Player 2",
    p1Score: 0,
    p2Score: 0,
    server: 1, // 1 or 2
    history: [],
    gameEnded: false
};

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const winnerScreen = document.getElementById('winner-screen');

const p1Input = document.getElementById('p1-name');
const p2Input = document.getElementById('p2-name');
const startBtn = document.getElementById('start-btn');

const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const p1NameEl = document.getElementById('p1-display-name');
const p2NameEl = document.getElementById('p2-display-name');
const p1Panel = document.getElementById('p1-panel');
const p2Panel = document.getElementById('p2-panel');

const statusEl = document.getElementById('game-status');
const winnerText = document.getElementById('winner-text');
const finalScoreEl = document.getElementById('final-score-display');

// Initialize
startBtn.addEventListener('click', startGame);
document.getElementById('back-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset the match?")) {
        switchScreen(setupScreen);
    }
});

document.getElementById('undo-btn').addEventListener('click', undoPoint);
document.getElementById('winner-undo-btn').addEventListener('click', () => {
    undoPoint();
    switchScreen(gameScreen);
});

document.getElementById('random-serve-btn').addEventListener('click', () => {
    // Randomly choose server (1 or 2)
    gameState.server = Math.random() < 0.5 ? 1 : 2;
    
    // Get current names from inputs for feedback
    const name1 = p1Input.value.trim() || "Player 1";
    const name2 = p2Input.value.trim() || "Player 2";
    const selectedName = gameState.server === 1 ? name1 : name2;

    const btn = document.getElementById('random-serve-btn');
    btn.textContent = `First Serve: ${selectedName}`;
    setTimeout(() => {
        btn.textContent = "Randomize Server";
    }, 2000);
});

document.getElementById('rematch-btn').addEventListener('click', () => {
    switchScreen(setupScreen);
});

function startGame() {
    gameState.p1Name = p1Input.value.trim() || "Player 1";
    gameState.p2Name = p2Input.value.trim() || "Player 2";
    
    p1NameEl.textContent = gameState.p1Name;
    p2NameEl.textContent = gameState.p2Name;
    
    gameState.p1Score = 0;
    gameState.p2Score = 0;
    // server is already set by randomizer or defaults to 1
    gameState.history = [];
    gameState.gameEnded = false;
    
    updateDisplay();
    switchScreen(gameScreen);
}

function addPoint(player) {
    if (gameState.gameEnded) return;

    // Save state for undo
    gameState.history.push({
        p1Score: gameState.p1Score,
        p2Score: gameState.p2Score,
        server: gameState.server
    });

    if (player === 1) {
        gameState.p1Score++;
        gameState.server = 1;
        animateScore(p1ScoreEl);
    } else {
        gameState.p2Score++;
        gameState.server = 2;
        animateScore(p2ScoreEl);
    }

    updateDisplay();
    checkWinner();
}

function undoPoint() {
    if (gameState.history.length > 0) {
        const lastState = gameState.history.pop();
        gameState.p1Score = lastState.p1Score;
        gameState.p2Score = lastState.p2Score;
        gameState.server = lastState.server;
        gameState.gameEnded = false;
        updateDisplay();
    }
}

function checkWinner() {
    const s1 = gameState.p1Score;
    const s2 = gameState.p2Score;
    let winner = null;

    // Badminton Rules:
    // 1. First to 21 wins, but must have 2 point lead.
    // 2. If 20-20, side that gains 2 point lead wins.
    // 3. If 29-29, side that scores the 30th point wins.

    if (s1 >= 21 || s2 >= 21) {
        if (Math.abs(s1 - s2) >= 2 || s1 === 30 || s2 === 30) {
            winner = s1 > s2 ? gameState.p1Name : gameState.p2Name;
        }
    }

    if (winner) {
        gameState.gameEnded = true;
        showWinner(winner);
    }
}

// Global match history
let matchHistory = [];

function showWinner(winner) {
    winnerText.textContent = `${winner} Wins!`;
    finalScoreEl.textContent = `${gameState.p1Score} - ${gameState.p2Score}`;
    
    // Record to match history
    matchHistory.push({
        winner,
        p1Name: gameState.p1Name,
        p2Name: gameState.p2Name,
        p1Score: gameState.p1Score,
        p2Score: gameState.p2Score
    });
    
    updateHistoryUI();

    // Switch to winner screen after a small delay and animate
    setTimeout(() => {
        if (!gameState.gameEnded) return; // Prevent switching if user undid the point in that time
        switchScreen(winnerScreen);
        const winnerTextEl = document.getElementById('winner-text');
        winnerTextEl.classList.add('animate');
        setTimeout(() => {
            winnerTextEl.classList.remove('animate');
        }, 1200);
        celebrate();
    }, 600);
}

function updateHistoryUI() {
    const historyEl = document.getElementById('match-history');
    const statsEl = document.getElementById('win-stats');
    if (!historyEl || !statsEl) return;

    if (matchHistory.length === 0) {
        statsEl.innerHTML = '<div class="stat-placeholder">No matches played yet</div>';
        historyEl.innerHTML = '';
        return;
    }

    // Calculate Win Stats
    const wins = {};
    matchHistory.forEach(m => {
        wins[m.winner] = (wins[m.winner] || 0) + 1;
    });

    // Display Top 2 Winners (usually the two current players)
    const sortedWinners = Object.entries(wins).sort((a, b) => b[1] - a[1]);
    statsEl.innerHTML = sortedWinners.slice(0, 2).map(([name, count]) => `
        <div class="stat-item">
            <span class="stat-value">${count}</span>
            <span class="stat-label">${name}</span>
        </div>
    `).join('');

    // Render History List (most recent first)
    historyEl.innerHTML = matchHistory.slice().reverse().map(m => `
        <li class="history-item">
            <div class="history-names">${m.p1Name} vs ${m.p2Name}</div>
            <div class="history-score">${m.p1Score}-${m.p2Score}</div>
        </li>
    `).join('');
}

function celebrate() {
    const duration = 1500;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#fbbf24', '#38bdf8', '#f43f5e']
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#fbbf24', '#38bdf8', '#f43f5e']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

function updateDisplay() {
    p1ScoreEl.textContent = gameState.p1Score;
    p2ScoreEl.textContent = gameState.p2Score;
    
    // Update Serving Panel
    p1Panel.classList.toggle('serving', gameState.server === 1);
    p2Panel.classList.toggle('serving', gameState.server === 2);
    
    // Update Status Label
    if (gameState.p1Score >= 20 && gameState.p2Score >= 20 && Math.abs(gameState.p1Score - gameState.p2Score) < 2) {
        if (gameState.p1Score === 29 && gameState.p2Score === 29) {
            statusEl.textContent = "GOLDEN POINT - Next point wins";
        } else {
            statusEl.textContent = "DEUCE - Win by 2";
        }
    } else {
        statusEl.textContent = "First to 21";
    }
}

function animateScore(el) {
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 200);
}

function switchScreen(target) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    target.classList.add('active');
}

// Initial UI Update
updateHistoryUI();

