(function() {
"use strict";

var APP_POOL = [
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

var NORMAL_LINES = [
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

var GOLD_LINES = [
"🌟 Bonus Reward Unlocked! Claim 500 Coins.",
"🎁 You received a mystery gift box!",
"🎉 Triple points active for the next hour!",
"⭐ Rare achievement completed: Fast Sweeper!"
];

var PRIORITY_LINES = [
"🚨 Security Alert: New login from unknown device.",
"⚠️ Flight schedule change: Gate updated to B12.",
"💼 Urgent meeting rescheduled to 2:00 PM.",
"🔒 Two-factor authentication code: 492-018"
];

var notifications = [];
var score = 0;
var combo = 1;
var bestCombo = 1;
var streak = 0;
var prioritySaved = 0;
var priorityTotal = 0;
var isProcessing = false;
var startTime = Date.now();
var lastDismissTime = 0;
var gameActive = true;

var listArea = document.getElementById('listArea');
var countPill = document.getElementById('countPill');
var scoreVal = document.getElementById('scoreVal');
var comboFlash = document.getElementById('comboFlash');
var streakVal = document.getElementById('streakVal');
var overlay = document.getElementById('overlay');
var finalScore = document.getElementById('finalScore');
var finalCombo = document.getElementById('finalCombo');
var finalPriority = document.getElementById('finalPriority');
var finalRank = document.getElementById('finalRank');
var overlaySub = document.getElementById('overlaySub');
var shareBtn = document.getElementById('shareBtn');
var againBtn = document.getElementById('againBtn');
var srStatus = document.getElementById('srStatus');

function getRandomItem(arr) {
return arr[Math.floor(Math.random() * arr.length)];
}

function generateNotification() {
var appInfo = getRandomItem(APP_POOL);
var rand = Math.random();
var type = "normal";
var message = "";

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

function generateBatch(count) {
if (!count) count = 12;
var batch = [];
for (var i = 0; i < count; i++) {
batch.push(generateNotification());
}
return batch;
}

function getScoreMultiplier(type) {
if (type === "gold") return 3;
if (type === "priority") return 0;
return 1;
}

function getRandomRank() {
var ranks = ["🥇 Gold", "🥈 Silver", "🥉 Bronze", "🏅 Honorable"];
return ranks[Math.floor(Math.random() * ranks.length)];
}

var actx = null;

function playTone(freq, duration, vol) {
if (!duration) duration = 0.08;
if (!vol) vol = 0.12;
try {
if (!actx) actx = new(window.AudioContext || window.webkitAudioContext)();
var osc = actx.createOscillator();
var gain = actx.createGain();
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
setTimeout(function() { playTone(840, 0.06); }, 80);
}

function playPriority() {
playTone(400, 0.15, 0.18);
setTimeout(function() { playTone(300, 0.12, 0.15); }, 100);
}

function playVictory() {
var tones = [0, 0.1, 0.2, 0.35, 0.5];
for (var i = 0; i < tones.length; i++) {
(function(index) {
setTimeout(function() {
playTone(523 + index * 100, 0.12, 0.15);
}, tones[index] * 1000);
})(i);
}
}

function renderNotifications() {
listArea.innerHTML = '';
if (notifications.length === 0) {
showEmptyState();
return;
}

for (var i = 0; i < notifications.length; i++) {
var notif = notifications[i];
var card = document.createElement('div');
card.className = 'card ' + notif.type;
card.dataset.index = i;
card.dataset.id = notif.id;
card.style.animationDelay = (i * 0.04) + 's';

var isPriority = notif.type === 'priority';

var html = '';
html += '<div class="icon">' + notif.icon + '</div>';
html += '<div class="body-txt">';
html += '<div class="row1">';
html += '<span class="app">' + notif.app + '</span>';
if (notif.type === 'gold') html += '<span class="tag gold">⭐ Gold</span>';
if (notif.type === 'priority') html += '<span class="tag priority">⚡ Priority</span>';
html += '<span class="time">' + notif.time + '</span>';
html += '</div>';
html += '<div class="preview">' + notif.text + '</div>';
html += '</div>';
html += '<div class="actions">';
if (isPriority) {
html += '<button class="btn-read glass-btn" data-id="' + notif.id + '">✓ Read</button>';
} else {
html += '<button class="btn-x glass-btn" data-id="' + notif.id + '">✕</button>';
}
html += '</div>';

card.innerHTML = html;

var startX = 0, startY = 0, dx = 0, dy = 0, isDragging = false;

card.addEventListener('pointerdown', function(e) {
if (e.target.closest('.btn-x') || e.target.closest('.btn-read')) return;
startX = e.clientX;
startY = e.clientY;
isDragging = true;
this.style.transition = 'none';
this.style.cursor = 'grabbing';
});

document.addEventListener('pointermove', function(e) {
if (!isDragging) return;
dx = e.clientX - startX;
dy = e.clientY - startY;
var rot = dx * 0.08;
card.style.transform = 'translateX(' + dx + 'px) rotate(' + rot + 'deg)';
card.style.opacity = 1 - Math.abs(dx) / 400;
});

document.addEventListener('pointerup', function(e) {
if (!isDragging) return;
isDragging = false;
card.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease';
card.style.cursor = 'grab';

if (Math.abs(dx) > 120 && notif.type !== 'priority') {
var dir = dx > 0 ? 'right' : 'left';
dismissCard(card, dir);
} else {
card.style.transform = '';
card.style.opacity = '1';
}
dx = 0;
dy = 0;
});

var xBtn = card.querySelector('.btn-x');
if (xBtn) {
xBtn.addEventListener('click', function(e) {
e.stopPropagation();
dismissCard(card, 'right');
});
}

var readBtn = card.querySelector('.btn-read');
if (readBtn) {
readBtn.addEventListener('click', function(e) {
e.stopPropagation();
handlePriorityRead(card);
});
}

listArea.appendChild(card);
}

updateUI();
}

function showEmptyState() {
listArea.innerHTML = '';
var div = document.createElement('div');
div.className = 'panel-state';
div.innerHTML = '<div class="glyph">🧹</div><h2>All clear!</h2><p>You\'ve cleared all notifications. Time for a fresh batch.</p><button class="btn-primary glass-btn" onclick="TidyQuest.newBatch()">🔄 New batch</button>';
listArea.appendChild(div);
}

function dismissCard(card, direction) {
if (!gameActive || isProcessing) return;
var id = card.dataset.id;
var notif = null;
for (var i = 0; i < notifications.length; i++) {
if (notifications[i].id === id) {
notif = notifications[i];
break;
}
}
if (!notif) return;

isProcessing = true;

if (notif.type === 'priority') {
card.classList.add('shake');
playPriority();
setTimeout(function() {
card.classList.remove('shake');
isProcessing = false;
}, 400);
return;
}

var mult = getScoreMultiplier(notif.type);
var comboMult = Math.min(combo, 10);
var points = 10 * mult * comboMult;

if (notif.type === 'gold') points += 20;

var now = Date.now();
if (now - lastDismissTime < 2000) {
combo = Math.min(combo + 0.5, 10);
if (combo > 3) playCombo();
} else {
combo = Math.max(1, combo - 0.5);
}

combo = Math.round(combo);
if (combo > bestCombo) bestCombo = combo;

score += points;
lastDismissTime = now;
streak++;

var dirClass = direction === 'right' ? 'leaving-right' : 'leaving-left';
card.classList.add(dirClass);
playDismiss();

spawnParticles(card);
showFloatingScore(card, points);

var newNotifs = [];
for (var j = 0; j < notifications.length; j++) {
if (notifications[j].id !== id) {
newNotifs.push(notifications[j]);
}
}
notifications = newNotifs;

setTimeout(function() {
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
var id = card.dataset.id;
var notif = null;
for (var i = 0; i < notifications.length; i++) {
if (notifications[i].id === id) {
notif = notifications[i];
break;
}
}
if (!notif) return;

isProcessing = true;
prioritySaved++;
playPriority();

card.classList.add('leaving-up');

var newNotifs = [];
for (var j = 0; j < notifications.length; j++) {
if (notifications[j].id !== id) {
newNotifs.push(notifications[j]);
}
}
notifications = newNotifs;

setTimeout(function() {
isProcessing = false;
renderNotifications();
updateUI();

if (notifications.length === 0) {
setTimeout(showVictory, 400);
}
}, 350);
}

function spawnParticles(card) {
var rect = card.getBoundingClientRect();
var container = card.closest('.list') || listArea;
var containerRect = container.getBoundingClientRect();

var cx = rect.left - containerRect.left + rect.width / 2;
var cy = rect.top - containerRect.top + rect.height / 2;

var colors = ['#FF7A45', '#7C5CFF', '#3DDC97', '#FFD166', '#FF5D7A'];

for (var i = 0; i < 14; i++) {
var p = document.createElement('div');
p.className = 'particle';
var size = 4 + Math.random() * 10;
var angle = Math.random() * 2 * Math.PI;
var dist = 50 + Math.random() * 100;
p.style.width = size + 'px';
p.style.height = size + 'px';
p.style.background = colors[Math.floor(Math.random() * colors.length)];
p.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
p.style.boxShadow = '0 0 10px ' + colors[Math.floor(Math.random() * colors.length)] + '40';
p.style.left = cx + 'px';
p.style.top = cy + 'px';
p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
container.appendChild(p);
setTimeout(function(el) { el.remove(); }, 700);
}
}

function showFloatingScore(card, points) {
var rect = card.getBoundingClientRect();
var container = card.closest('.list') || listArea;
var containerRect = container.getBoundingClientRect();

var el = document.createElement('div');
el.className = 'pop-score';
el.textContent = '+' + points;
el.style.left = (rect.left - containerRect.left + rect.width / 2 - 20) + 'px';
el.style.top = (rect.top - containerRect.top - 10) + 'px';
el.style.color = points > 30 ? '#FFD166' : '#3DDC97';
el.style.textShadow = '0 4px 20px rgba(0,0,0,0.3)';
container.appendChild(el);
setTimeout(function() { el.remove(); }, 800);
}

function updateUI() {
scoreVal.textContent = score;
comboFlash.textContent = '×' + combo;
streakVal.textContent = streak;
countPill.textContent = notifications.length + ' waiting';

if (combo > 3) {
comboFlash.style.color = '#FF7A45';
comboFlash.style.transform = 'scale(1.2)';
comboFlash.classList.add('pop');
setTimeout(function() { comboFlash.classList.remove('pop'); }, 300);
} else {
comboFlash.style.color = '';
comboFlash.style.transform = '';
}
}

function showVictory() {
gameActive = false;
var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
var rank = getRandomRank();

finalScore.textContent = score;
finalCombo.textContent = '×' + bestCombo;
finalPriority.textContent = prioritySaved + '/' + priorityTotal;
finalRank.textContent = rank;
overlaySub.textContent = 'Cleared in ' + elapsed + 's';

playVictory();
overlay.classList.remove('hidden');

updateLeaderboard(score);
}

function updateLeaderboard(myScore) {
var lb = document.getElementById('leaderboard');
var entries = [
{ name: "You", score: myScore, me: true },
{ name: "Alex", score: Math.floor(Math.random() * 100 + 50) },
{ name: "Sam", score: Math.floor(Math.random() * 80 + 30) },
{ name: "Jordan", score: Math.floor(Math.random() * 60 + 20) },
{ name: "Taylor", score: Math.floor(Math.random() * 40 + 10) }
];

entries.sort(function(a, b) { return b.score - a.score; });

var html = '';
for (var i = 0; i < entries.length; i++) {
var e = entries[i];
var cls = e.me ? 'leaderboard-row me' : 'leaderboard-row';
var nameDisplay = e.me ? '⭐ ' + e.name : e.name;
html += '<div class="' + cls + '">';
html += '<span class="rank">#' + (i + 1) + '</span>';
html += '<span class="name">' + nameDisplay + '</span>';
html += '<span class="pts">' + e.score + '</span>';
html += '</div>';
}
lb.innerHTML = html;
}

function shareScore() {
var text = '🧹 I cleared all notifications with a ' + bestCombo + 'x combo and scored ' + score + ' points! Can you beat me? #TidyQuest #NYCCodeQuest2026';
if (navigator.share) {
navigator.share({ title: 'TidyQuest Score', text: text }).catch(function() {});
} else {
navigator.clipboard.writeText(text).then(function() {
srStatus.textContent = 'Score copied to clipboard!';
setTimeout(function() { srStatus.textContent = ''; }, 2000);
}).catch(function() {
var tweetUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
window.open(tweetUrl, '_blank');
});
}
}

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
setTimeout(function() { srStatus.textContent = ''; }, 1500);
}

function updateClock() {
var now = new Date();
var h = String(now.getHours()).padStart(2, '0');
var m = String(now.getMinutes()).padStart(2, '0');
document.getElementById('clock').textContent = h + ':' + m;
}

window.TidyQuest = {
newBatch: newBatch,
shareScore: shareScore
};

function init() {
notifications = generateBatch(12);
priorityTotal = 0;
for (var i = 0; i < notifications.length; i++) {
if (notifications[i].type === 'priority') priorityTotal++;
}
renderNotifications();
updateUI();
updateClock();
setInterval(updateClock, 30000);

shareBtn.addEventListener('click', shareScore);
againBtn.addEventListener('click', function() {
newBatch();
});

document.addEventListener('keydown', function(e) {
if (e.key === 'r' && !overlay.classList.contains('hidden')) {
newBatch();
}
if (e.key === 's' && !overlay.classList.contains('hidden')) {
shareScore();
}
});

console.log('🧹 TidyQuest loaded!');
console.log('📊 ' + notifications.length + ' notifications ready');
}

if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
} else {
init();
}

})();
