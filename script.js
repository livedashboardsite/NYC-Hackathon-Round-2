(function() {
    "use strict";

    // ========== DATA ==========
    const APP_POOL = [
        { app: "Mail", icon: "✉️" },
        { app: "Chat", icon: "💬" },
        { app: "Social", icon: "🌐" },
        { app: "Calendar", icon: "📅" },
        { app: "News", icon: "📰" },
        { app: "Shop", icon: "🛍️" },
        { app: "Fitness", icon: "🏃" },
        { app: "Music", icon: "🎵" },
        { app: "System", icon: "⚙️" }
    ];

    const NORMAL_LINES = [
        "Your weekly summary is ready to view.",
        "50% off on your next order! Limited time only.",
        "Someone liked your comment: 'Nice photo!'",
        "Don't forget to complete your daily step goal.",
        "New playlist recommended based on your listening.",
        "Storage space is 80% full. Clean up recommended.",
        "Flash sale starting in 15 minutes!",
        "Your driver is arriving in 3 minutes.",
        "Daily news digest: Top stories for today.",
        "Your package has been delivered to the front porch."
    ];

    const GOLD_LINES = [
        "🌟 Bonus Reward Unlocked! Claim 500 Coins.",
        "🎁 You received a mystery gift box!",
        "🎉 Triple points active for the next hour!",
        "⭐ Rare achievement completed: Fast Sweeper!"
    ];

    const PRIORITY_LINES = [
        "🚨 Security Alert: New login from unknown device.",
        "⚠️ Flight schedule change: Gate updated to B12.",
        "💼 Urgent meeting rescheduled to 2:00 PM.",
        "🔒 Two-factor authentication code: 492-018"
    ];

    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateNotification() {
        const appInfo = getRandomItem(APP_POOL);
        const rand = Math.random();
        let type, message;

        if (rand < 0.20) {
            type = "priority";
            message = getRandomItem(PRIORITY_LINES);
        } else if (rand < 0.35) {
            type = "gold";
            message = getRandomItem(GOLD_LINES);
        } else {
            type = "normal";
            message = getRandomItem(NORMAL_LINES);
        }

        return {
            id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
            app: appInfo.app,
            icon: appInfo.icon,
            text: message,
            type: type,
            time: "Just now"
        };
    }

    // ========== GAME STATE ==========
    let state = {
        notifications: [],
        score: 0,
        combo: 1,
        streak: 0,
        bestCombo: 1,
        prioritySaved: 0,
        priorityTotal: 0,
        startTime: Date.now(),
        isActive: true
    };

    // ========== DOM REFS ==========
    const listArea = document.getElementById('listArea');
    const countPill = document.getElementById('countPill');
    const scoreVal = document.getElementById('scoreVal');
    const comboFlash = document.getElementById('comboFlash');
    const streakVal = document.getElementById('streakVal');
    const overlay = document.getElementById('overlay');
    const finalScore = document.getElementById('finalScore');
    const finalCombo = document.getElementById('finalCombo');
    const finalPriority = document.getElementById('finalPriority');
    const finalRank = document.getElementById('finalRank');
    const overlaySub = document.getElementById('overlaySub');
    const againBtn = document.getElementById('againBtn');
    const shareBtn = document.getElementById('shareBtn');
    const leaderboardEl = document.getElementById('leaderboard');
    const srStatus = document.getElementById('srStatus');

    // ========== CLOCK ==========
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('clock').textContent = h + ':' + m;
    }
    updateClock();
    setInterval(updateClock, 10000);

    // ========== RENDER ==========
    function render() {
        // Update count
        const waiting = state.notifications.length;
        countPill.textContent = waiting + ' waiting';

        // Update stats
        scoreVal.textContent = state.score;
        comboFlash.textContent = '×' + state.combo;
        streakVal.textContent = state.streak;

        // Render notifications
        if (waiting === 0) {
            listArea.innerHTML = `
                <div class="panel-state">
                    <div class="glyph">🎯</div>
                    <h2>All clear!</h2>
                    <p>You've swept the tray. New notifications will arrive soon.</p>
                    <button class="btn-primary" id="spawnBtn">Spawn test batch</button>
                </div>
            `;
            document.getElementById('spawnBtn')?.addEventListener('click', () => {
                for (let i = 0; i < 6; i++) {
                    state.notifications.push(generateNotification());
                }
                render();
            });
            return;
        }

        let html = '';
        state.notifications.forEach((notif, index) => {
            const typeClass = notif.type === 'gold' ? 'gold' : notif.type === 'priority' ? 'priority' : '';
            const tag = notif.type !== 'normal' ? `<span class="tag ${typeClass}">${notif.type}</span>` : '';

            html += `
                <div class="card ${typeClass}" data-index="${index}" data-id="${notif.id}">
                    <div class="icon">${notif.icon}</div>
                    <div class="body-txt">
                        <div class="row1">
                            <span class="app">${notif.app}</span>
                            ${tag}
                            <span class="time">${notif.time}</span>
                        </div>
                        <div class="preview">${notif.text}</div>
                    </div>
                    <div class="actions">
                        <button class="btn-x" data-action="swipe" aria-label="Clear notification">✕</button>
                        ${notif.type === 'priority' ? `<button class="btn-read" data-action="read">✓ Read</button>` : ''}
                    </div>
                </div>
            `;
        });

        listArea.innerHTML = html;

        // Attach event listeners
        document.querySelectorAll('.card').forEach(card => {
            const index = parseInt(card.dataset.index);
            const notif = state.notifications[index];
            if (!notif) return;

            // Swipe button
            const swipeBtn = card.querySelector('[data-action="swipe"]');
            if (swipeBtn) {
                swipeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleSwipe(index);
                });
            }

            // Read button (priority only)
            const readBtn = card.querySelector('[data-action="read"]');
            if (readBtn) {
                readBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleRead(index);
                });
            }

            // Drag/swipe support
            let startX = 0, currentX = 0, isDragging = false;
            card.addEventListener('pointerdown', (e) => {
                if (e.target.closest('button')) return;
                startX = e.clientX;
                isDragging = true;
                card.style.transition = 'none';
                card.classList.add('dragging');
            });

            document.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                currentX = dx;
                card.style.setProperty('--dx', dx + 'px');
                const rot = Math.min(Math.max(dx / 15, -20), 20);
                card.style.setProperty('--rot', rot + 'deg');
                card.style.opacity = 1 - Math.abs(dx) / 400;
            });

            document.addEventListener('pointerup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                card.classList.remove('dragging');
                card.style.transition = 'transform .3s, opacity .3s';

                if (currentX > 80) {
                    // Swipe right - clear
                    handleSwipe(index);
                } else if (currentX < -80) {
                    // Swipe left - ignore
                    card.style.setProperty('--dx', '-100px');
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.style.setProperty('--dx', '0px');
                        card.style.setProperty('--rot', '0deg');
                        card.style.opacity = '1';
                    }, 300);
                } else {
                    card.style.setProperty('--dx', '0px');
                    card.style.setProperty('--rot', '0deg');
                    card.style.opacity = '1';
                }
                currentX = 0;
            });
        });
    }

    // ========== ACTIONS ==========
    function handleSwipe(index) {
        const notif = state.notifications[index];
        if (!notif) return;

        // Priority notifications cannot be swiped
        if (notif.type === 'priority') {
            // Show shake feedback
            const cards = document.querySelectorAll('.card');
            if (cards[index]) {
                cards[index].classList.add('shake');
                setTimeout(() => cards[index]?.classList.remove('shake'), 300);
            }
            srStatus.textContent = 'Cannot swipe priority notification. Please tap Read.';
            return;
        }

        // Calculate points with combo
        let points = 1;
        if (notif.type === 'gold') points = 3;

        // Apply combo multiplier
        const totalPoints = points * state.combo;
        state.score += totalPoints;
        state.streak += 1;
        state.combo += 1;

        // Track best combo
        if (state.combo > state.bestCombo) {
            state.bestCombo = state.combo;
        }

        // Remove notification
        state.notifications.splice(index, 1);

        // Show popup
        showPopup('+' + totalPoints + ' pts', index);

        render();

        // Check for victory
        if (state.notifications.length === 0) {
            setTimeout(showVictory, 500);
        }
    }

    function handleRead(index) {
        const notif = state.notifications[index];
        if (!notif || notif.type !== 'priority') return;

        state.prioritySaved += 1;
        state.priorityTotal += 1;
        state.notifications.splice(index, 1);

        // Reset combo on read (they handled it correctly)
        state.combo = 1;

        showPopup('✓ Priority saved!', index);
        render();

        if (state.notifications.length === 0) {
            setTimeout(showVictory, 500);
        }
    }

    function showPopup(text, index) {
        const cards = document.querySelectorAll('.card');
        if (!cards[index]) return;

        const rect = cards[index].getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = 'pop-score';
        popup.textContent = text;
        popup.style.left = (rect.left + rect.width / 2 - 40) + 'px';
        popup.style.top = (rect.top - 10) + 'px';
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 800);

        // Combo flash
        comboFlash.style.transform = 'scale(1.6)';
        setTimeout(() => comboFlash.style.transform = 'scale(1)', 150);
    }

    function showVictory() {
        if (!state.isActive) return;
        state.isActive = false;

        const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
        overlaySub.textContent = `Cleared in ${elapsed}s`;
        finalScore.textContent = state.score;
        finalCombo.textContent = '×' + state.bestCombo;
        finalPriority.textContent = state.prioritySaved + '/' + state.priorityTotal;

        // Rank based on score
        let rank = '🌱 Novice';
        if (state.score > 50) rank = '🌟 Pro';
        if (state.score > 100) rank = '👑 Master';
        if (state.score > 200) rank = '🏆 Legend';
        finalRank.textContent = rank;

        overlay.classList.remove('hidden');

        // Update leaderboard
        updateLeaderboard(state.score);
    }

    // ========== LEADERBOARD ==========
    let leaderboard = [];

    function updateLeaderboard(score) {
        const names = ['You', 'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery'];
        const playerName = names[Math.floor(Math.random() * names.length)];

        leaderboard.push({ name: playerName, score: score, isMe: true });
        leaderboard.sort((a, b) => b.score - a.score);
        if (leaderboard.length > 8) leaderboard.pop();

        renderLeaderboard();
    }

    function renderLeaderboard() {
        const fakeNames = ['Luna', 'Milo', 'Zara', 'Felix', 'Ivy', 'Nova', 'Atlas', 'Willow', 'Jade', 'Leo'];
        let display = [...leaderboard];

        // Add fake entries if needed
        while (display.length < 6) {
            const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
            const score = Math.floor(Math.random() * 150) + 20;
            display.push({ name: name, score: score, isMe: false });
        }

        display.sort((a, b) => b.score - a.score);
        display = display.slice(0, 8);

        let html = '';
        display.forEach((entry, i) => {
            const cls = entry.isMe ? 'leaderboard-row me' : 'leaderboard-row';
            html += `
                <div class="${cls}">
                    <span class="rank">#${i + 1}</span>
                    <span class="name">${entry.isMe ? '⭐ ' : ''}${entry.name}</span>
                    <span class="pts">${entry.score} pts</span>
                </div>
            `;
        });
        leaderboardEl.innerHTML = html;
    }

    // ========== RESET ==========
    function resetGame() {
        state.notifications = [];
        state.score = 0;
        state.combo = 1;
        state.streak = 0;
        state.bestCombo = 1;
        state.prioritySaved = 0;
        state.priorityTotal = 0;
        state.startTime = Date.now();
        state.isActive = true;
        overlay.classList.add('hidden');
        render();
    }

    // ========== SHARE ==========
    function shareScore() {
        const text = `I scored ${state.score} points in TidyQuest! 🎯\nBest combo: ×${state.bestCombo}\nPriority notifications saved: ${state.prioritySaved}/${state.priorityTotal}`;
        if (navigator.share) {
            navigator.share({ title: 'TidyQuest Score', text: text });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                alert('Score copied to clipboard! Share it with friends.');
            });
        }
    }

    // ========== INIT ==========
    function init() {
        // Generate initial notifications
        for (let i = 0; i < 7; i++) {
            state.notifications.push(generateNotification());
        }
        render();
        renderLeaderboard();

        // Event listeners
        againBtn.addEventListener('click', resetGame);
        shareBtn.addEventListener('click', shareScore);
    }

    init();
})();
