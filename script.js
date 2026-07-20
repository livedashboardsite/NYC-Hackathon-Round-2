(function() {
    "use strict";

    // ========================================
    // APP DATA
    // ========================================
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

    // ========================================
    // STATE
    // ========================================
    let notifications = [];
    let score = 0;
    let combo = 1;
    let bestCombo = 1;
    let streak = 0;
    let prioritySaved = 0;
    let priorityTotal = 0;
    let isProcessing = false;
    let startTime = Date.now();
    let lastDismissTime = 0;
    let gameActive = true;

    // ========================================
    // DOM REFS
    // ========================================
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
    const shareBtn = document.getElementById('shareBtn');
    const againBtn = document.getElementById('againBtn');
    const srStatus = document.getElementById('srStatus');

    // ========================================
    // HELPERS
    // ========================================
    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateNotification() {
        const appInfo = getRandomItem(APP_POOL);
        const rand = Math.random();
        let type = "normal";
        let message = "";

        if (rand < 0.20) {
            type = "priority";
            message = getRandomItem(PRIORITY_LINES);
            priorityTotal++;
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

    function generateBatch(count = 12) {
        const batch = [];
        for (let i = 0; i < count; i++) {
            batch.push(generateNotification());
        }
        return batch;
    }

    function getScoreMultiplier(type) {
        if (type === "gold") return 3;
        if (type === "priority") return 0; // Must read, not swipe
        return 1;
    }

    function getRandomRank() {
        const ranks = ["🥇 Gold", "🥈 Silver", "🥉 Bronze", "🏅 Honorable"];
        return ranks[Math.floor(Math.random() * ranks.length)];
    }

    // ========================================
    // AUDIO (Simple Web Audio)
    // ========================================
    let actx = null;

    function playTone(freq, duration = 0.08, vol = 0.12) {
        try {
            if (!actx) actx = new(window.AudioContext || window.webkitAudioContext)();
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, actx.currentTime);
            gain.gain.exponentialRampToValueAtTime(vol, actx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + duration);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start();
            osc.stop(actx.currentTime + duration);
        } catch (_) {}
    }

    function playDismiss() {
        playTone(520 + combo * 15, 0.07);
    }

    function playCombo() {
        playTone(680, 0.06);
        setTimeout(() => playTone(840, 0.06), 80);
    }

    function playPriority() {
        playTone(400, 0.15, 0.18);
        setTimeout(() => playTone(300, 0.12, 0.15), 100);
    }

    function playVictory() {
        [0, 0.1, 0.2, 0.35, 0.5].forEach((t, i) => {
            setTimeout(() => playTone(523 + i * 100, 0.12, 0.15), t * 1000);
        });
    }

    // ========================================
    // RENDER
    // ========================================
    function renderNotifications() {
        listArea.innerHTML = '';
        if (notifications.length === 0) {
            showEmptyState();
            return;
        }

        notifications.forEach((notif, index) => {
            const card = document.createElement('div');
            card.className = `card ${notif.type}`;
            card.dataset.index = index;
            card.dataset.id = notif.id;
            card.style.animationDelay = (index * 0.04) + 's';

            const isPriority = notif.type === 'priority';

            card.innerHTML = `
                <div class="icon">${notif.icon}</div>
                <div class="body-txt">
                    <div class="row1">
                        <span class="app">${notif.app}</span>
                        ${notif.type === 'gold' ? '<span class="tag gold">⭐ Gold</span>' : ''}
                        ${notif.type === 'priority' ? '<span class="tag priority">⚡ Priority</span>' : ''}
                        <span class="time">${notif.time}</span>
                    </div>
                    <div class="preview">${notif.text}</div>
                </div>
                <div class="actions">
                    ${isPriority ? `
                        <button class="btn-read" data-id="${notif.id}">✓ Read</button>
                    ` : `
                        <button class="btn-x" data-id="${notif.id}">✕</button>
                    `}
                </div>
            `;

            // Swipe/Drag support
            let startX = 0,
                startY = 0,
                dx = 0,
                dy = 0,
                isDragging = false;

            card.addEventListener('pointerdown', (e) => {
                if (e.target.closest('.btn-x') || e.target.closest('.btn-read')) return;
                startX = e.clientX;
                startY = e.clientY;
                isDragging = true;
                card.style.transition = 'none';
                card.style.cursor = 'grabbing';
            });

            document.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                dx = e.clientX - startX;
                dy = e.clientY - startY;
                const rot = dx * 0.08;
                card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
                card.style.opacity = 1 - Math.abs(dx) / 400;
            });

            document.addEventListener('pointerup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                card.style.cursor = 'grab';

                if (Math.abs(dx) > 120 && !isPriority) {
                    // Swipe to dismiss
                    const dir = dx > 0 ? 'right' : 'left';
                    dismissCard(card, dir);
                } else {
                    card.style.transform = '';
                    card.style.opacity = '1';
                }
                dx = 0;
                dy = 0;
            });

            // Button handlers
            card.querySelector('.btn-x')?.addEventListener('click', (e) => {
                e.stopPropagation();
                dismissCard(card, 'right');
            });

            card.querySelector('.btn-read')?.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePriorityRead(card);
            });

            listArea.appendChild(card);
        });

        updateUI();
    }

    function showEmptyState() {
        listArea.innerHTML = `
            <div class="panel-state">
                <div class="glyph">🧹</div>
                <h2>All clear!</h2>
                <p>You've cleared all notifications. Time for a fresh batch.</p>
                <button class="btn-primary" onclick="TidyQuest.newBatch()">🔄 New batch</button>
            </div>
        `;
    }

    // ========================================
    // CARD ACTIONS
    // ========================================
    function dismissCard(card, direction) {
        if (!gameActive || isProcessing) return;
        const id = card.dataset.id;
        const notif = notifications.find(n => n.id === id);
        if (!notif) return;

        isProcessing = true;

        // Don't allow swiping priority
        if (notif.type === 'priority') {
            card.classList.add('shake');
            playPriority();
            setTimeout(() => {
                card.classList.remove('shake');
                isProcessing = false;
            }, 300);
            return;
        }

        // Calculate points
        const mult = getScoreMultiplier(notif.type);
        const comboMult = Math.min(combo, 10);
        let points = 10 * mult * comboMult;

        // Bonus for gold
        if (notif.type === 'gold') points += 20;

        // Update combo
        const now = Date.now();
        if (now - lastDismissTime < 2000) {
            combo = Math.min(combo + 0.5, 10);
            if (combo > 3) playCombo();
        } else {
            combo = Math.max(1, combo - 0.5);
        }

        combo = Math.round(combo);
        if (combo > bestCombo) bestCombo = combo;

        // Add score
        score += points;
        lastDismissTime = now;

        // Streak
        streak++;

        // Remove card with animation
        const dirClass = direction === 'right' ? 'leaving-right' : 'leaving-left';
        card.classList.add(dirClass);
        playDismiss();

        // Particles
        spawnParticles(card);

        // Floating score
        showFloatingScore(card, points);

        // Remove from array
        notifications = notifications.filter(n => n.id !== id);

        setTimeout(() => {
            isProcessing = false;
            renderNotifications();
            updateUI();

            if (notifications.length === 0) {
                setTimeout(showVictory, 400);
            }
        }, 350);
    }

    function handlePriorityRead(card) {
        if (!gameActive || isProcessing) return;
        const id = card.dataset.id;
        const notif = notifications.find(n => n.id === id);
        if (!notif) return;

        isProcessing = true;
        prioritySaved++;
        playPriority();

        // Remove card
        card.classList.add('leaving-up');
        notifications = notifications.filter(n => n.id !== id);

        setTimeout(() => {
            isProcessing = false;
            renderNotifications();
            updateUI();

            if (notifications.length === 0) {
                setTimeout(showVictory, 400);
            }
        }, 350);
    }

    // ========================================
    // PARTICLES & EFFECTS
    // ========================================
    function spawnParticles(card) {
        const rect = card.getBoundingClientRect();
        const container = card.closest('.list') || listArea;
        const containerRect = container.getBoundingClientRect();

        const cx = rect.left - containerRect.left + rect.width / 2;
        const cy = rect.top - containerRect.top + rect.height / 2;

        const colors = ['#FF7A45', '#7C5CFF', '#3DDC97', '#FFD166', '#FF5D7A'];

        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = 4 + Math.random() * 8;
            const angle = Math.random() * 2 * Math.PI;
            const dist = 40 + Math.random() * 80;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            p.style.left = cx + 'px';
            p.style.top = cy + 'px';
            p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
            p.style.setProperty('--pr', (Math.random() * 360) + 'deg');
            container.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    }

    function showFloatingScore(card, points) {
        const rect = card.getBoundingClientRect();
        const container = card.closest('.list') || listArea;
        const containerRect = container.getBoundingClientRect();

        const el = document.createElement('div');
        el.className = 'pop-score';
        el.textContent = `+${points}`;
        el.style.left = (rect.left - containerRect.left + rect.width / 2 - 20) + 'px';
        el.style.top = (rect.top - containerRect.top - 10) + 'px';
        el.style.color = points > 30 ? '#FFD166' : '#3DDC97';
        container.appendChild(el);
        setTimeout(() => el.remove(), 700);
    }

    // ========================================
    // UI UPDATE
    // ========================================
    function updateUI() {
        scoreVal.textContent = score;
        comboFlash.textContent = `×${combo}`;
        streakVal.textContent = streak;
        countPill.textContent = `${notifications.length} waiting`;

        if (combo > 3) {
            comboFlash.style.color = '#FF7A45';
            comboFlash.style.transform = 'scale(1.2)';
        } else {
            comboFlash.style.color = '';
            comboFlash.style.transform = '';
        }
    }

    // ========================================
    // VICTORY
    // ========================================
    function showVictory() {
        gameActive = false;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rank = getRandomRank();

        finalScore.textContent = score;
        finalCombo.textContent = `×${bestCombo}`;
        finalPriority.textContent = `${prioritySaved}/${priorityTotal}`;
        finalRank.textContent = rank;
        overlaySub.textContent = `Cleared in ${elapsed}s`;

        playVictory();
        overlay.classList.remove('hidden');

        // Update leaderboard with your score
        updateLeaderboard(score);
    }

    function updateLeaderboard(myScore) {
        const lb = document.getElementById('leaderboard');
        const entries = [
            { name: "You", score: myScore, me: true },
            { name: "Alex", score: Math.floor(Math.random() * 100 + 50) },
            { name: "Sam", score: Math.floor(Math.random() * 80 + 30) },
            { name: "Jordan", score: Math.floor(Math.random() * 60 + 20) },
            { name: "Taylor", score: Math.floor(Math.random() * 40 + 10) }
        ];

        entries.sort((a, b) => b.score - a.score);

        lb.innerHTML = entries.map((e, i) => `
            <div class="leaderboard-row ${e.me ? 'me' : ''}">
                <span class="rank">#${i + 1}</span>
                <span class="name">${e.me ? '⭐ ' : ''}${e.name}</span>
                <span class="pts">${e.score}</span>
            </div>
        `).join('');
    }

    // ========================================
    // SHARE
    // ========================================
    function shareScore() {
        const text = `🧹 I cleared all notifications with a ${bestCombo}x combo and scored ${score} points! Can you beat me? #TidyQuest #NYCCodeQuest2026`;
        if (navigator.share) {
            navigator.share({ title: 'TidyQuest Score', text: text })
                .catch(() => {});
        } else {
            navigator.clipboard.writeText(text).then(() => {
                srStatus.textContent = 'Score copied to clipboard!';
                setTimeout(() => srStatus.textContent = '', 2000);
            }).catch(() => {
                // Fallback
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                window.open(tweetUrl, '_blank');
            });
        }
    }

    // ========================================
    // NEW BATCH
    // ========================================
    function newBatch() {
        notifications = generateBatch(12);
        score = 0;
        combo = 1;
        bestCombo = 1;
        streak = 0;
        prioritySaved = 0;
        priorityTotal = 0;
        startTime = Date.now();
        gameActive = true;
        lastDismissTime = 0;
        overlay.classList.add('hidden');
        renderNotifications();
        updateUI();
        srStatus.textContent = 'New batch ready!';
        setTimeout(() => srStatus.textContent = '', 1500);
    }

    // ========================================
    // CLOCK
    // ========================================
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('clock').textContent = `${h}:${m}`;
    }

    // ========================================
    // EXPOSE TO GLOBAL
    // ========================================
    window.TidyQuest = {
        newBatch: newBatch,
        shareScore: shareScore
    };

    // ========================================
    // INIT
    // ========================================
    function init() {
        // Generate initial batch
        notifications = generateBatch(12);
        priorityTotal = notifications.filter(n => n.type === 'priority').length;

        // Render
        renderNotifications();
        updateUI();
        updateClock();
        setInterval(updateClock, 30000);

        // Event listeners
        shareBtn.addEventListener('click', shareScore);
        againBtn.addEventListener('click', () => {
            newBatch();
        });

        // Keyboard shortcut: 'r' for restart, 's' for share
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && !overlay.classList.contains('hidden')) {
                newBatch();
            }
            if (e.key === 's' && !overlay.classList.contains('hidden')) {
                shareScore();
            }
        });

        console.log('🧹 TidyQuest loaded!');
        console.log(`📊 ${notifications.length} notifications ready`);
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
