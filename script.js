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

function generateNotification(idx) {
  var appInfo = getRandomItem(APP_POOL);
  var rand = Math.random();
  var type = "normal";
  var message = "";

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
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6) + "_" + idx,
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
  priorityTotal = 0;
  for (var i = 0; i < count; i++) {
    var item = generateNotification(i);
    if (item.type === 'priority') priorityTotal++;
    batch.push(item);
  }
  return batch;
}

function getScoreMultiplier(type) {
  if (type === "gold") return 3;
  if (type === "priority") return 0;
  return 1;
}

function getRandomRank() {
  var ranks = ["🥇 Gold Clean", "🥈 Silver Sweeper", "🥉 Bronze Tidy", "🏅 Fast Organizer"];
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
    
    var typeStyles = "bg-white/5 border-white/10 border-l-transparent";
    if (notif.type === 'gold') {
      typeStyles = "bg-amber-500/10 border-amber-500/30 border-l-brand-warn shadow-lg shadow-amber-500/10";
    } else if (notif.type === 'priority') {
      typeStyles = "bg-rose-500/10 border-rose-500/30 border-l-brand-danger shadow-lg shadow-rose-500/10";
    }

    card.className = 'card relative flex items-center gap-3 p-3.5 rounded-2xl border backdrop-blur-md cursor-grab active:cursor-grabbing select-none transition-all duration-300 ' + typeStyles;
    card.dataset.id = notif.id;

    var isPriority = notif.type === 'priority';

    var html = '';
    html += '<div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0 pointer-events-none">' + notif.icon + '</div>';
    html += '<div class="flex-1 min-w-0 pointer-events-none">';
    html += '<div class="flex items-center gap-2 flex-wrap">';
    html += '<span class="font-semibold text-xs sm:text-sm text-slate-100">' + notif.app + '</span>';
    if (notif.type === 'gold') html += '<span class="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-brand-warn font-semibold">⭐ Gold</span>';
    if (notif.type === 'priority') html += '<span class="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-brand-danger font-semibold">⚡ Priority</span>';
    html += '<span class="ml-auto text-[11px] font-mono text-slate-400 shrink-0">' + notif.time + '</span>';
    html += '</div>';
    html += '<div class="text-xs text-slate-300 mt-1 truncate leading-tight">' + notif.text + '</div>';
    html += '</div>';
    html += '<div class="flex flex-col gap-1 items-end shrink-0">';
    if (isPriority) {
      html += '<button class="btn-read font-mono text-xs px-3 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-brand-good transition-all active:scale-95" data-id="' + notif.id + '">✓ Read</button>';
    } else {
      html += '<button class="btn-x w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-xs text-slate-300 hover:text-white transition-all active:scale-90" data-id="' + notif.id + '">✕</button>';
    }
    html += '</div>';

    card.innerHTML = html;

    setupCardInteractions(card, notif);
    listArea.appendChild(card);
  }

  updateUI();
}

function setupCardInteractions(card, notif) {
  var startX = 0, startY = 0, dx = 0, dy = 0, isDragging = false;

  card.addEventListener('pointerdown', function(e) {
    if (e.target.closest('.btn-x') || e.target.closest('.btn-read')) return;
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
    card.style.transition = 'none';
  });

  var onPointerMove = function(e) {
    if (!isDragging) return;
    dx = e.clientX - startX;
    dy = e.clientY - startY;
    var rot = dx * 0.08;
    card.style.transform = 'translateX(' + dx + 'px) rotate(' + rot + 'deg)';
    card.style.opacity = Math.max(0.2, 1 - Math.abs(dx) / 300);
  };

  var onPointerUp = function(e) {
    if (!isDragging) return;
    isDragging = false;
    card.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease';

    if (Math.abs(dx) > 100 && notif.type !== 'priority') {
      var dir = dx > 0 ? 'right' : 'left';
      dismissCard(card, dir);
    } else if (Math.abs(dx) > 100 && notif.type === 'priority') {
      card.style.transform = '';
      card.style.opacity = '1';
      card.classList.add('shake');
      playPriority();
      setTimeout(function() { card.classList.remove('shake'); }, 400);
    } else {
      card.style.transform = '';
      card.style.opacity = '1';
    }
    dx = 0;
    dy = 0;
  };

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

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
}

function showEmptyState() {
  listArea.innerHTML = '';
  var div = document.createElement('div');
  div.className = 'flex flex-col items-center justify-center text-center p-8 min-h-[400px] gap-3 animate-fade-in';
  div.innerHTML = '<div class="text-5xl animate-bounce">🧹</div><h3 class="font-display text-xl font-bold text-white">Inbox Zero!</h3><p class="text-xs text-slate-400 max-w-[240px]">All clutter cleared cleanly top-to-bottom. Ready for another round?</p><button class="mt-2 bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-indigo-500 hover:to-brand-purple text-white font-display text-sm font-semibold py-2.5 px-5 rounded-xl shadow-lg transition-all active:scale-95" onclick="TidyQuest.newBatch()">🔄 New Batch</button>';
  listArea.appendChild(div);
}

function dismissCard(card, direction) {
  if (!gameActive || isProcessing) return;
  var targetId = card.dataset.id;

  var targetIndex = -1;
  for (var i = 0; i < notifications.length; i++) {
    if (notifications[i].id === targetId) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return;

  var notif = notifications[targetIndex];
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

  notifications.splice(targetIndex, 1);

  setTimeout(function() {
    isProcessing = false;
    renderNotifications();

    if (notifications.length === 0) {
      setTimeout(showVictory, 300);
    }
  }, 300);
}

function handlePriorityRead(card) {
  if (!gameActive || isProcessing) return;
  var targetId = card.dataset.id;

  var targetIndex = -1;
  for (var i = 0; i < notifications.length; i++) {
    if (notifications[i].id === targetId) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return;

  isProcessing = true;
  prioritySaved++;
  playPriority();

  card.classList.add('leaving-up');

  notifications.splice(targetIndex, 1);

  setTimeout(function() {
    isProcessing = false;
    renderNotifications();

    if (notifications.length === 0) {
      setTimeout(showVictory, 300);
    }
  }, 300);
}

function spawnParticles(card) {
  var rect = card.getBoundingClientRect();
  var containerRect = listArea.getBoundingClientRect();

  var cx = rect.left - containerRect.left + rect.width / 2;
  var cy = rect.top - containerRect.top + rect.height / 2;

  var colors = ['#FF7A45', '#7C5CFF', '#3DDC97', '#FFD166', '#FF5D7A'];

  for (var i = 0; i < 12; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    var size = 4 + Math.random() * 6;
    var angle = Math.random() * 2 * Math.PI;
    var dist = 40 + Math.random() * 80;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
    listArea.appendChild(p);
    setTimeout(function(el) { el.remove(); }, 600, p);
  }
}

function showFloatingScore(card, points) {
  var rect = card.getBoundingClientRect();
  var containerRect = listArea.getBoundingClientRect();

  var el = document.createElement('div');
  el.className = 'pop-score';
  el.textContent = '+' + points;
  el.style.left = (rect.left - containerRect.left + rect.width / 2 - 15) + 'px';
  el.style.top = (rect.top - containerRect.top) + 'px';
  el.style.color = points > 30 ? '#FFD166' : '#3DDC97';
  listArea.appendChild(el);
  setTimeout(function() { el.remove(); }, 700);
}

function updateUI() {
  scoreVal.textContent = score;
  comboFlash.textContent = '×' + combo;
  streakVal.textContent = streak;
  countPill.textContent = notifications.length + ' waiting';

  if (combo > 3) {
    comboFlash.style.color = '#FF7A45';
  } else {
    comboFlash.style.color = '';
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
    var isMe = e.me;
    html += '<div class="flex items-center justify-between py-2 text-xs sm:text-sm ' + (isMe ? 'text-brand-good font-semibold' : 'text-slate-300') + '">';
    html += '<span class="font-mono w-6 text-slate-500">#' + (i + 1) + '</span>';
    html += '<span class="flex-1 truncate">' + (isMe ? '⭐ ' + e.name : e.name) + '</span>';
    html += '<span class="font-mono text-slate-400">' + e.score + ' pts</span>';
    html += '</div>';
  }
  lb.innerHTML = html;
}

function shareScore() {
  var text = '🧹 I cleared all notifications in TidyQuest with a ' + bestCombo + 'x combo and scored ' + score + ' points! Can you beat me? #TidyQuest';
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
