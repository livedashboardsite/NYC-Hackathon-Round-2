(function () {
  "use strict";

  // App catalog with realistic icons
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

  // Standard clutter notifications (Swipe Away)
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

  // High-value notifications (3x Points - Swipe Away)
  var GOLD_LINES = [
    "🌟 Bonus Reward Unlocked! Claim 500 Coins.",
    "🎁 You received a mystery gift box!",
    "🎉 Triple points active for the next hour!",
    "⭐ Rare achievement completed: Fast Sweeper!"
  ];

  // Urgent notifications (MUST tap "Read" — swiping breaks combo!)
  var PRIORITY_LINES = [
    "🚨 Security Alert: New login from unknown device.",
    "⚠️ Flight schedule change: Gate updated to B12.",
    "💼 Urgent meeting rescheduled to 2:00 PM.",
    "🔒 Two-factor authentication code: 492-018"
  ];

  // Helper function to pick a random item from an array
  function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Generator function for notifications
  function generateRandomNotification() {
    var appInfo = getRandomItem(APP_POOL);
    var randVal = Math.random();
    var type = "normal";
    var message = "";

    if (randVal < 0.20) {
      type = "priority"; // 20% chance
      message = getRandomItem(PRIORITY_LINES);
    } else if (randVal < 0.35) {
      type = "gold";     // 15% chance
      message = getRandomItem(GOLD_LINES);
    } else {
      type = "normal";   // 65% chance
      message = getRandomItem(NORMAL_LINES);
    }

    return {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      app: appInfo.app,
      icon: appInfo.icon,
      text: message,
      type: type,
      time: "Just now"
    };
  }

  // Example usage:
  console.log("Generated Notification:", generateRandomNotification());

})();
