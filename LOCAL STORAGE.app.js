/* LOCAL STORAGE */
let athletes = [];
let currentAthlete = null;

function saveToStorage() {
  localStorage.setItem("athletes", JSON.stringify(athletes));
}
function loadFromStorage() {
  const data = localStorage.getItem("athletes");
  if (data) athletes = JSON.parse(data);
}
loadFromStorage();

/* PAGE NAVIGATION */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (id === "training") updateTrainingPage();
}

/* TIME HELPERS */
function timeToSeconds(t) {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  return parts.length === 1 ? parts[0] : parts[0] * 60 + parts[1];
}
function secondsToTime(sec) {
  sec = Math.round(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ATHLETE SYSTEM */
document.getElementById("athleteAge").addEventListener("change", function () {
  const age = this.value;
  const map = {
    U12: ["Monday", "Wednesday"],
    U14: ["Monday", "Wednesday", "Saturday"],
    U16: ["Monday", "Wednesday", "Saturday", "Sunday"],
    U18: ["Monday", "Tuesday", "Wednesday", "Saturday", "Sunday"],
    U20: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday"]
  };
  document.getElementById("athleteTrainingDays").textContent = map[age].join(", ");
});

function sortPBs(pbs) {
  const order = ["200m", "400m", "800m", "1500m", "Mile", "3k", "5k"];
  return pbs.sort((a, b) => order.indexOf(a.event) - order.indexOf(b.event));
}

function addPB() {
  document.getElementById("pbBody").innerHTML += `
    <tr>
      <td>
        <select>
          <option>200m</option><option>400m</option><option>800m</option>
          <option>1500m</option><option>Mile</option><option>3k</option><option>5k</option>
        </select>
      </td>
      <td><input type="text"></td>
      <td><input type="text"></td>
      <td><input type="text"></td>
    </tr>`;
}

function saveAthlete() {
  const name = athleteName.value;
  const age = athleteAge.value;
  const days = athleteTrainingDays.textContent.split(",").map(d => d.trim());

  const pbs = [...document.querySelectorAll("#pbBody tr")].map(row => {
    const event = row.querySelector("select").value;
    const [time, date, venue] = [...row.querySelectorAll("input")].map(i => i.value);
    return { event, time, date, venue };
  });

  const sortedPBs = sortPBs(pbs);

  if (currentAthlete !== null) {
    const a = athletes.find(x => x.id === currentAthlete);
    Object.assign(a, { name, age, trainingDays: days, pbs: sortedPBs });
  } else {
    athletes.push({ id: Date.now(), name, age, trainingDays: days, pbs: sortedPBs });
  }

  saveToStorage();
  refreshAllAthleteUI();
  currentAthlete = null;
}

function deleteAthlete(id) {
  athletes = athletes.filter(a => a.id !== id);
  saveToStorage();
  refreshAllAthleteUI();
}

function updateAthleteList() {
  athleteList.innerHTML = athletes.map(a => `
    <div class="athlete-item">
      <span onclick="loadAthlete(${a.id})">${a.name} (${a.age})</span>
      <button onclick="deleteAthlete(${a.id})">Delete</button>
    </div>
  `).join("");
}

function updateDropdown(id) {
  const dd = document.getElementById(id);
  dd.innerHTML = `<option value="">-- Choose Athlete --</option>` +
    athletes.map(a => `<option value="${a.id}">${a.name} (${a.age})</option>`).join("");
}

function refreshAllAthleteUI() {
  updateAthleteList();
  updateDropdown("homeAthleteSelect");
  updateDropdown("trainingAthleteSelect");
  updateDropdown("navAthleteSelect");
  updateHomePage();
}

function loadAthlete(id) {
  currentAthlete = id;
  const a = athletes.find(x => x.id === id);

  athleteName.value = a.name;
  athleteAge.value = a.age;
  athleteTrainingDays.textContent = a.trainingDays.join(", ");

  pbBody.innerHTML = a.pbs.map(pb => `
    <tr>
      <td>
        <select>
          <option ${pb.event === "200m" ? "selected" : ""}>200m</option>
          <option ${pb.event === "400m" ? "selected" : ""}>400m</option>
          <option ${pb.event === "800m" ? "selected" : ""}>800m</option>
          <option ${pb.event === "1500m" ? "selected" : ""}>1500m</option>
          <option ${pb.event === "Mile" ? "selected" : ""}>Mile</option>
          <option ${pb.event === "3k" ? "selected" : ""}>3k</option>
          <option ${pb.event === "5k" ? "selected" : ""}>5k</option>
        </select>
      </td>
      <td><input type="text" value="${pb.time}"></td>
      <td><input type="text" value="${pb.date}"></td>
      <td><input type="text" value="${pb.venue}"></td>
    </tr>
  `).join("");

  refreshAllAthleteUI();
  updateTrainingPage();
}

/* TRAINING PAGE */
const monthPhaseMap = {
  Jan: "BUILD", Feb: "PRE COMPETITION", Mar: "PRE COMPETITION",
  Apr: "PRE COMPETITION", May: "COMPETITION", Jun: "COMPETITION",
  Jul: "PEAK", Aug: "PEAK", Sep: "TRANSITION",
  Oct: "BASE", Nov: "BASE", Dec: "BUILD"
};

const phaseColors = {
  BASE: "#4e79a7", BUILD: "#f28e2b", PRE_COMPETITION: "#e15759",
  COMPETITION: "#76b7b2", PEAK: "#59a14f", TRANSITION: "#edc948"
};

function updateTrainingPage() {
  const id = Number(trainingAthleteSelect.value);
  if (!id) return;

  const a = athletes.find(x => x.id === id);

  trainingAthleteName.textContent = a.name;
  trainingAthleteAge.textContent = "Age Group: " + a.age;

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  calendarMonth.textContent = monthName;

  const phase = monthPhaseMap[monthName.substring(0, 3)];
  const color = phaseColors[phase];

  monthBody.innerHTML = "";

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(now.getFullYear(), now.getMonth(), d);
    const weekday = dateObj.toLocaleString("default", { weekday: "long" });

    const isTrainingDay = a.trainingDays.includes(weekday);
    const session = isTrainingDay ? phase : "Rest";

    const highlight = d === now.getDate() ? "outline: 2px solid #ff4f4f;" : "";

    monthBody.innerHTML += `
      <tr style="background:${isTrainingDay ? color : '#141b3a'}; ${highlight}">
        <td>${weekday}</td>
        <td>${d}</td>
        <td>${isTrainingDay ? "Yes" : "No"}</td>
        <td>${session}</td>
      </tr>`;
  }
}

/* ---------------------------------------------------------
   CALCULATOR SECTION
--------------------------------------------------------- */

/* 1. Event breakdowns */
const eventBreakdowns = {
  "400": [100, 150, 200, 250, 300],
  "800": [200, 300, 400, 500, 600],
  "1500": [300, 400, 500, 600, 800, 1000],
  "5k": [300, 400, 500, 600, 800, 1000]
};

/* 2. Pace card helper */
function paceCard(title, time, cssClass) {
  return `
    <div class="pace-card ${cssClass}">
      <h3>${title}</h3>
      <p>${time}</p>
    </div>
  `;
}

/* 3. NEW Calculator */
function runPaceCalculator() {
  const event = document.getElementById("calcEvent").value;
  const pb = timeToSeconds(document.getElementById("calcPB").value || "0");

  const output = document.getElementById("paceOutput");
  output.innerHTML = "";

  if (!pb) {
    output.innerHTML = "<p>Please enter a valid PB.</p>";
    return;
  }

  /* ---------------------------------------------------------
     5K PB → Tempo Fast, Tempo Slow, Threshold
--------------------------------------------------------- */
  if (event === "5k") {
    const meters = 5000;
    const kmRacePace = pb / (meters / 1000);

    const tempoFast = kmRacePace + 15;
    const tempoSlow = kmRacePace + 20;
    const threshold = kmRacePace + 10;

    output.innerHTML += paceCard("Tempo Fast (per km)", secondsToTime(tempoFast), "pace-tempo");
    output.innerHTML += paceCard("Tempo Slow (per km)", secondsToTime(tempoSlow), "pace-tempo");
    output.innerHTML += paceCard("Threshold (per km)", secondsToTime(threshold), "pace-threshold");

    const factor400 = 400 / 1000;

    output.innerHTML += paceCard("Tempo Fast (400m)", secondsToTime(tempoFast * factor400), "pace-tempo");
    output.innerHTML += paceCard("Tempo Slow (400m)", secondsToTime(tempoSlow * factor400), "pace-tempo");
    output.innerHTML += paceCard("Threshold (400m)", secondsToTime(threshold * factor400), "pace-threshold");

    return;
  }

  /* ---------------------------------------------------------
     1500m PB → RP, VO2, Intervals, Reps
--------------------------------------------------------- */
  if (event === "1500") {
    const meters = 1500;
    const rp400 = pb / (meters / 400);

    const zones = {
      RP: rp400,
      VO2: rp400 * 0.98,
      Intervals: rp400 * 1.03,
      Reps: rp400 * 1.01
    };

    output.innerHTML += paceCard("Race Pace (400m)", secondsToTime(zones.RP), "pace-rp");
    output.innerHTML += paceCard("VO₂ Max (400m)", secondsToTime(zones.VO2), "pace-vo2");
    output.innerHTML += paceCard("Intervals (400m)", secondsToTime(zones.Intervals), "pace-intervals");
    output.innerHTML += paceCard("Reps (400m)", secondsToTime(zones.Reps), "pace-reps");

    eventBreakdowns["1500"].forEach(dist => {
      const factor = dist / 400;
      output.innerHTML += paceCard(`${dist}m Race Pace`, secondsToTime(zones.RP * factor), "pace-rp");
      output.innerHTML += paceCard(`${dist}m VO₂`, secondsToTime(zones.VO2 * factor), "pace-vo2");
      output.innerHTML += paceCard(`${dist}m Intervals`, secondsToTime(zones.Intervals * factor), "pace-intervals");
      output.innerHTML += paceCard(`${dist}m Reps`, secondsToTime(zones.Reps * factor), "pace-reps");
    });

    return;
  }

  /* ---------------------------------------------------------
     800m PB → RP, VO2, Intervals, Reps
--------------------------------------------------------- */
  if (event === "800") {
    const meters = 800;
    const rp400 = pb / (meters / 400);

    const zones = {
      RP: rp400,
      VO2: rp400 * 0.98,
      Intervals: rp400 * 1.03,
      Reps: rp400 * 1.01
    };

    output.innerHTML += paceCard("Race Pace (400m)", secondsToTime(zones.RP), "pace-rp");
    output.innerHTML += paceCard("VO₂ Max (400m)", secondsToTime(zones.VO2), "pace-vo2");
    output.innerHTML += paceCard("Intervals (400m)", secondsToTime(zones.Intervals), "pace-intervals");
    output.innerHTML += paceCard("Reps (400m)", secondsToTime(zones.Reps), "pace-reps");

    eventBreakdowns["800"].forEach(dist => {
      const factor = dist / 400;
      output.innerHTML += paceCard(`${dist}m Race Pace`, secondsToTime(zones.RP * factor), "pace-rp");
      output.innerHTML += paceCard(`${dist}m VO₂`, secondsToTime(zones.VO2 * factor), "pace-vo2");
      output.innerHTML += paceCard(`${dist}m Intervals`, secondsToTime(zones.Intervals * factor), "pace-intervals");
      output.innerHTML += paceCard(`${dist}m Reps`, secondsToTime(zones.Reps * factor), "pace-reps");
    });

    return;
  }

  /* ---------------------------------------------------------
     400m PB → RP, VO2, Reps
--------------------------------------------------------- */
  if (event === "400") {
    const rp400 = pb;

    const zones = {
      RP: rp400,
      VO2: rp400 * 0.98,
      Reps: rp400 * 1.01
    };

    output.innerHTML += paceCard("Race Pace (400m)", secondsToTime(zones.RP), "pace-rp");
    output.innerHTML += paceCard("VO₂ Max (400m)", secondsToTime(zones.VO2), "pace-vo2");
    output.innerHTML += paceCard("Reps (400m)", secondsToTime(zones.Reps), "pace-reps");

    eventBreakdowns["400"].forEach(dist => {
      const factor = dist / 400;
      output.innerHTML += paceCard(`${dist}m Race Pace`, secondsToTime(zones.RP * factor), "pace-rp");
      output.innerHTML += paceCard(`${dist}m VO₂`, secondsToTime(zones.VO2 * factor), "pace-vo2");
      output.innerHTML += paceCard(`${dist}m Reps`, secondsToTime(zones.Reps * factor), "pace-reps");
    });

    return;
  }
}
