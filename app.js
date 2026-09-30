const DEFAULT_ACTIVITIES = [
  "Work", "Exercise", "Cooking", "Eating", "Reading", "Learning",
  "Family", "Relaxing", "Phone", "TV", "Sleep", "Other"
];

const entriesKey = "minuteLog.entries";
const activitiesKey = "minuteLog.activities";

let entries = JSON.parse(localStorage.getItem(entriesKey) || "[]");
let activities = JSON.parse(localStorage.getItem(activitiesKey) || "null") || DEFAULT_ACTIVITIES;

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(entriesKey, JSON.stringify(entries));
  localStorage.setItem(activitiesKey, JSON.stringify(activities));
}

function pad(n) { return String(n).padStart(2, "0"); }

function formatTime(date) {
  return date.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
}

function dateKey(date = new Date()) {
  const y = date.getFullYear(), m = pad(date.getMonth()+1), d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

function renderClock() {
  const now = new Date();
  $("currentTime").textContent = formatTime(now);
  $("today").textContent = now.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric"});
}

function todayEntries() {
  const today = dateKey();
  return entries.filter(e => e.date === today).sort((a,b) => b.timestamp - a.timestamp);
}

function renderButtons() {
  $("activityButtons").innerHTML = activities.map((name, i) =>
    `<button class="activity" data-index="${i}">${escapeHtml(name)}</button>`
  ).join("");
  document.querySelectorAll(".activity").forEach(btn => {
    btn.addEventListener("click", () => logActivity(activities[Number(btn.dataset.index)]));
  });
}

function renderTimeline() {
  const list = todayEntries();
  if (!list.length) {
    $("timeline").innerHTML = `<div class="empty">No activities logged yet.<br>Tap an activity above to begin.</div>`;
    return;
  }
  $("timeline").innerHTML = list.map(e => `
    <div class="entry">
      <div class="entry-main">
        <span class="dot"></span>
        <span class="entry-time">${escapeHtml(e.time)}</span>
        <span class="entry-name">${escapeHtml(e.name)}</span>
      </div>
      <button class="delete" data-id="${e.id}" aria-label="Delete">×</button>
    </div>
  `).join("");
  document.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", () => {
      entries = entries.filter(e => e.id !== btn.dataset.id);
      save(); renderTimeline();
    });
  });
}

function logActivity(name) {
  const now = new Date();
  entries.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: dateKey(now),
    timestamp: now.getTime(),
    time: formatTime(now),
    name
  });
  save();
  renderTimeline();
  if (navigator.vibrate) navigator.vibrate(12);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

$("moreBtn").addEventListener("click", () => {
  $("activityInput").value = "";
  $("activityDialog").showModal();
  setTimeout(() => $("activityInput").focus(), 50);
});

$("activityForm").addEventListener("submit", (event) => {
  if (event.submitter?.value !== "save") return;
  const name = $("activityInput").value.trim();
  if (!name) { event.preventDefault(); return; }
  if (!activities.includes(name)) activities.push(name);
  save();
  logActivity(name);
  renderButtons();
});

$("settingsBtn").addEventListener("click", () => $("settingsDialog").showModal());

$("clearBtn").addEventListener("click", () => {
  if (confirm("Clear all of today's entries?")) {
    const today = dateKey();
    entries = entries.filter(e => e.date !== today);
    save(); renderTimeline();
  }
});

renderClock();
renderButtons();
renderTimeline();
setInterval(renderClock, 1000);
