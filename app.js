/* =========================================================
   GLOBAL DATA + STORAGE
========================================================= */

let athletes = [];
let coaches = [];
let selectedAthlete = null;



/* =========================================================
   UNIVERSAL SAFE DATE CONVERTER
========================================================= */
function convertDate(rawDate) {
  if (!rawDate) return "";

  if (rawDate.includes("-")) {
    const [y, m, d] = rawDate.split("-");
    return `${y}-${m}-${d}`;
  }

  if (rawDate.includes("/")) {
    const [d, m, y] = rawDate.split("/");
    return `${y}-${m}-${d}`;
  }

  return "";
}


/* =========================================================
   DATE FORMATTER (GLOBAL — ensures ISO for input fields)
========================================================= */
function formatDobForInput(dob) {
  if (!dob) return "";
  if (dob.includes("-")) return dob;
  const [day, month, year] = dob.split("/");
  return `${year}-${month}-${day}`;
}

function saveData() {
  localStorage.setItem("athletes", JSON.stringify(athletes));
  localStorage.setItem("coaches", JSON.stringify(coaches));
}

function loadData() {
  const storedAthletes = JSON.parse(localStorage.getItem("athletes") || "[]");

  athletes = storedAthletes.map(a => ({
    id: a.id,
    name: a.name,
    ageGroup: getScottishAthleticsAgeGroup(a.dob),
    emergency: a.emergency || "",
    relationship: a.relationship || "",
    dob: a.dob || "",
    sessions: a.sessions || {},
    pbs: a.pbs || []
  }));

  const storedCoaches = JSON.parse(localStorage.getItem("coaches") || "[]");
  coaches = storedCoaches;
}

/* =========================================================
   COACH PAGE – SAVE COACH
========================================================= */

document.getElementById("saveCoachButton").addEventListener("click", () => {

  const name = document.getElementById("coachName").value.trim();
  const phone = document.getElementById("coachPhone").value.trim();
  const email = document.getElementById("coachEmail").value.trim();
  const discipline = document.getElementById("coachDiscipline").value.trim();
  const notes = document.getElementById("coachNotes").value.trim();

  if (!name) {
    alert("Please enter a coach name.");
    return;
  }

  const newCoach = { 
    name, 
    phone, 
    email, 
    discipline, 
    notes 
  };

  coaches.push(newCoach);
  saveData();

  updateHomePage();   // updates athletes + coaches

  // Clear fields
  document.getElementById("coachName").value = "";
  document.getElementById("coachPhone").value = "";
  document.getElementById("coachEmail").value = "";
  document.getElementById("coachDiscipline").value = "";
  document.getElementById("coachNotes").value = "";

  alert("Coach saved!");
});


/* =========================================================
   COACH PAGE – DELETE COACH
========================================================= */

document.getElementById("deleteCoachButton").addEventListener("click", () => {

  const name = document.getElementById("coachName").value.trim();

  if (!name) {
    alert("Enter the coach name you want to delete.");
    return;
  }

  const index = coaches.findIndex(c => c.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    alert("Coach not found.");
    return;
  }

  if (!confirm(`Delete coach "${name}"?`)) return;

  coaches.splice(index, 1);
  saveData();

  updateHomePage();   // updates athletes + coaches

  alert("Coach deleted!");
});
/* =========================================================
   HOME PAGE – ATHLETES + COACHES (FULLY FIXED)
========================================================= */

function updateHomePage() {

  const athleteList = document.getElementById("homeAthleteList");
  athleteList.innerHTML = "";

  athletes.forEach(athlete => {
    const card = document.createElement("div");
    card.className = "card home-athlete";
    card.dataset.id = athlete.id;

    const header = document.createElement("div");
    header.className = "home-header";
    header.innerText = athlete.name;

    header.onclick = () => expandCard(card, athlete);

    card.appendChild(header);
    athleteList.appendChild(card);
  });

  updateCoachList();   // correct location
}


/* =========================================================
   EXPAND ATHLETE CARD
========================================================= */
function expandCard(card, athlete) {

  if (card.classList.contains("expanded")) {
    collapseCard(card);
    return;
  }

  card.classList.add("expanded");

  const dobUK = convertDOBToUKFormat(athlete.dob);
  const dobNorm = normaliseDob(dobUK);

  card.innerHTML = `
    <div class="home-header">${athlete.name}</div>

    <label>Emergency Contact:
      <input type="text" id="editEmergency-${athlete.id}" value="${athlete.emergency || ""}">
    </label>

    <label>Relationship:
      <input type="text" id="editRelationship-${athlete.id}" value="${athlete.relationship || ""}">
    </label>

    <label>Date of Birth:
      <input type="date" id="editDob-${athlete.id}" value="${formatDobForInput(athlete.dob)}">
    </label>

    <p><strong>Age Group:</strong> ${getScottishAthleticsAgeGroup(dobNorm)}</p>

    <p><strong>Training Days:</strong>
      <span class="homeTrainingDays"></span>
    </p>

    <p><strong>Age Group Change:</strong>
      <span class="homeAgeGroupCountdown"></span>
    </p>

    <p><strong>Next Age Group:</strong>
      <span class="homeNextAgeGroup"></span>
    </p>

    <button class="save-btn">Save Changes</button>
    <button class="close-btn">Close</button>
  `;

  // reattach header click
  card.querySelector(".home-header").onclick = () => expandCard(card, athlete);

  // save button
  card.querySelector(".save-btn").onclick = () => {
    saveAthleteEdits(athlete.id);
    updateHomePage();
  };

  // close button
  card.querySelector(".close-btn").onclick = () => collapseCard(card);

  // dynamic fields
  const trainingDays = getTrainingDaysByAge(dobNorm);
  card.querySelector(".homeTrainingDays").innerText =
    trainingDays.length ? trainingDays.join(", ") : "N/A";

  const countdown = getDaysUntilAgeGroupChange();
  card.querySelector(".homeAgeGroupCountdown").innerText =
    countdown === 0 ? "Changes today!" : `${countdown} days`;

  card.querySelector(".homeNextAgeGroup").innerText =
    getNextAgeGroup(dobNorm);

}   // ⭐ THIS BRACE WAS MISSING

/* =========================================================
   COLLAPSE ATHLETE CARD
========================================================= */
function collapseCard(card) {
  card.classList.remove("expanded");

  const id = Number(card.dataset.id);
  const athlete = athletes.find(a => a.id === id);

  card.innerHTML = `<div class="home-header">${athlete.name}</div>`;
  card.querySelector(".home-header").onclick = () => expandCard(card, athlete);
}


/* =========================================================
   HOME PAGE – COACH LIST
========================================================= */

function updateCoachList() {
  const list = document.getElementById("homeCoachList");

  list.innerHTML = coaches
    .map((c, index) => `
      <div class="card home-coach" data-index="${index}">
        <div class="coach-header">${c.name}</div>
        <div class="coach-details">
          <p><strong>Phone:</strong> ${c.phone || "—"}</p>
          <p><strong>Email:</strong> ${c.email || "—"}</p>
          <p><strong>Discipline:</strong> ${c.discipline || "—"}</p>
        </div>
      </div>
    `)
    .join("");

  document.querySelectorAll(".home-coach").forEach(card => {
    const header = card.querySelector(".coach-header");

    header.onclick = () => {
      const index = Number(card.dataset.index);
      const coach = coaches[index];

      if (card.classList.contains("expanded")) {
        collapseCoachCard(card, coach);
        return;
      }

      card.classList.add("expanded");

      card.innerHTML = `
        <div class="coach-header">${coach.name}</div>

        <label>Name:
          <input type="text" id="editCoachName${index}" value="${coach.name}">
        </label>

        <label>Phone:
          <input type="text" id="editCoachPhone${index}" value="${coach.phone || ""}">
        </label>

        <label>Email:
          <input type="email" id="editCoachEmail${index}" value="${coach.email || ""}">
        </label>

        <label>Discipline:
          <input type="text" id="editCoachDiscipline${index}" value="${coach.discipline || ""}">
        </label>

        <button onclick="saveCoach(${index})">Save</button>
        <button onclick="deleteCoach(${index})" style="background:#b30000;color:white;">Delete</button>
        <button onclick="collapseCoachCard(this.closest('.home-coach'), coaches[this.closest('.home-coach').dataset.index])">Close</button>
      `;
    };
  });
}

function collapseCoachCard(card, coach) {
  card.classList.remove("expanded");

  card.innerHTML = `
    <div class="coach-header">${coach.name}</div>
    <div class="coach-details">
      <p><strong>Phone:</strong> ${coach.phone || "—"}</p>
      <p><strong>Email:</strong> ${coach.email || "—"}</p>
      <p><strong>Discipline:</strong> ${coach.discipline || "—"}</p>
    </div>
  `;
}

function saveCoach(index) {
  coaches[index].name = document.getElementById(`editCoachName${index}`).value;
  coaches[index].phone = document.getElementById(`editCoachPhone${index}`).value;
  coaches[index].email = document.getElementById(`editCoachEmail${index}`).value;
  coaches[index].discipline = document.getElementById(`editCoachDiscipline${index}`).value;

  saveData();
  updateHomePage();
}

function deleteCoach(index) {
  if (!confirm("Delete this coach?")) return;

  coaches.splice(index, 1);
  saveData();

  updateHomePage();
}


/* =========================================================
   AUTO‑LOAD HOME PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", updateHomePage);

/* =========================================================
   AUTO‑GENERATE YEAR SELECTOR
========================================================= */
function populateYearSelector() {
  const select = document.getElementById("yearSelect");
  const currentYear = new Date().getFullYear();

  let options = `<option value="">All Years</option>`;

  // Generate last 10 years including current year
  for (let y = currentYear; y >= currentYear - 10; y--) {
    options += `<option value="${y}">${y}</option>`;
  }

  select.innerHTML = options;
}

// Run on page load
populateYearSelector();


/* =========================================================
   ATHLETE PAGE
========================================================= */

function loadAthleteList() {
  const list = document.getElementById("athleteList");

  list.innerHTML = athletes.map(a =>
    `<div class="athlete-item" data-id="${a.id}">
       <span class="athlete-name">${a.name}</span>
       <button class="select-btn" data-id="${a.id}">Select</button>
       <button class="delete-btn" data-id="${a.id}">🗑️</button>
     </div>`
  ).join("");

  document.querySelectorAll(".select-btn").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      selectAthlete(id);
    };
  });

document.querySelectorAll(".delete-btn").forEach(btn => {
  btn.onclick = () => {
    const id = Number(btn.dataset.id);

    athletes = athletes.filter(a => a.id !== id);

    if (selectedAthlete && selectedAthlete.id === id) {
      selectedAthlete = null;
    }

    saveData();
    updateHomePage();
    renderHomeAthleteList();   // ⭐ REQUIRED FIX
    loadAthleteList();
    updateTrainingDropdown();
    updatePBTable();
  };
});

}

// -------------------------------
// COMPETITION GRAPH
// -------------------------------
let competitionYearlyChart = null;

/* =========================================================
   UNIFIED EVENT COLOUR MAP (matches Athlete Page)
========================================================= */
const eventColours = {
  "200m": "#ff0000",
  "400m": "#ff8800",
  "800m": "#ffaa00",
  "1500m": "#00aa00",
  "mile": "#0088ff",
  "3k": "#aa00ff",
  "5k": "#ff00aa",
  "other": "#0077cc"
};

/* =========================================================
   NORMALISE EVENT NAMES (ensures colours match)
========================================================= */
function normalizeEventName(event) {
  event = event.toLowerCase();

  if (event.includes("200")) return "200m";
  if (event.includes("400")) return "400m";
  if (event.includes("800")) return "800m";
  if (event.includes("1500")) return "1500m";
  if (event.includes("mile")) return "mile";
  if (event.includes("3k") || event.includes("3000")) return "3k";
  if (event.includes("5k") || event.includes("5000")) return "5k";

  return "other";
}

/* =========================================================
   FORMAT RACE TIME (mm:ss.xx)
========================================================= */
function formatRaceTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const secsFormatted = secs.toFixed(2).padStart(5, "0");
  return `${mins}:${secsFormatted}`;
}

/* =========================================================
   FORMAT DATE (ISO → UK dd/mm/yyyy)
========================================================= */
function formatDateUK(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
/* =========================================================
   FORMAT TIME (convert 2.13 → 2:13)
========================================================= */
function formatTimeDisplay(t) {
  // If already formatted (contains ":"), return as-is
  if (t.includes(":")) return t;

  // Convert "2.13" → "2:13"
  if (t.includes(".")) {
    const [mins, secs] = t.split(".");
    return `${mins}:${secs.padStart(2, "0")}`;
  }

  return t;
}
/* =========================================================
   CONVERT "m:ss" → total seconds
========================================================= */
function timeToSeconds(t) {
  t = String(t);

  if (t.includes(":")) {
    const [m, s] = t.split(":");
    return Number(m) * 60 + Number(s);
  }

  if (t.includes(".")) {
    const [m, s] = t.split(".");
    return Number(m) * 60 + Number(s);
  }

  return Number(t);
}

/* =========================================================
   TREND LINE CALCULATOR
========================================================= */
function getTrendLine(data) {
  const n = data.length;
  if (n < 2) return [];

  const xs = data.map((_, i) => i);
  const ys = data;

  const sumX = xs.reduce((a,b)=>a+b,0);
  const sumY = ys.reduce((a,b)=>a+b,0);
  const sumXY = xs.reduce((a,b,i)=>a + b*ys[i],0);
  const sumXX = xs.reduce((a,b)=>a + b*b,0);

  const slope = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX);
  const intercept = (sumY - slope*sumX) / n;

  return xs.map(x => slope*x + intercept);
}

/* =========================================================
   MAIN COMPETITION GRAPH FUNCTION
========================================================= */
function updateCompetitionYearlyTracker(a) {
  const ctx = document.getElementById("competitionTimesChart").getContext("2d");
  const selectedYear = document.getElementById("yearSelect").value;

const results = a.competitionResults
  .filter(r => {
    const parts = r.date.split("/");   // dd/mm/yyyy
    const year = parts[2];             // yyyy

    return !selectedYear || year == selectedYear;
  })
  .sort((a, b) => {
    // Convert dd/mm/yyyy → yyyy-mm-dd for sorting
    const [dA, mA, yA] = a.date.split("/");
    const [dB, mB, yB] = b.date.split("/");
    return new Date(`${yA}-${mA}-${dA}`) - new Date(`${yB}-${mB}-${dB}`);
  });


  // Group results by event
  const grouped = {};
  results.forEach(r => {
    const event = normalizeEventName(r.event);
    if (!grouped[event]) grouped[event] = [];
    grouped[event].push(r);
  });

  // Build datasets WITH trend lines
  const datasets = [];

  Object.keys(grouped).forEach(event => {
    const eventResults = grouped[event];

    // ⭐ invert times so faster = upward trend
   const times = eventResults.map(r => -timeToSeconds(r.time));


    // Main event line
    datasets.push({
      label: event,
      data: times,
      borderColor: eventColours[event],
      backgroundColor: "rgba(0,0,0,0)",
      borderWidth: 3,
      tension: 0.3,
      pointRadius: 5
    });

    // Trend line
    const trend = getTrendLine(times);

    datasets.push({
      label: event + " Trend",
      data: trend,
      borderColor: eventColours[event],
      borderWidth: 2,
      borderDash: [6, 6],
      pointRadius: 0,
      tension: 0
    });
  });

  if (competitionYearlyChart) competitionYearlyChart.destroy();

  competitionYearlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: results.map(r => formatDateUK(r.date)),
      datasets: datasets
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: {
          title: { display: true, text: "Time" },
          ticks: {
            // ⭐ convert negative values back to positive for display
            callback: value => formatRaceTime(Math.abs(value))
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const r = results[ctx.dataIndex];
              return `${normalizeEventName(r.event)}: ${formatTimeDisplay(r.time)}`;

            }
          }
        }
      }
    }
  });
}

/* =========================================================
   DATE CONVERSION (GLOBAL)
========================================================= */
function convertDate(rawDate) {
  const [dd, mm, yyyy] = rawDate.split("/");
  return `${dd}/${mm}/${yyyy}`;  // keep UK format
}

/* =========================================================
   ADD COMPETITION RESULT
========================================================= */
function addCompetitionResult() {
  if (!selectedAthlete) {
    alert("Select an athlete first.");
    return;
  }

  const event = document.getElementById("compEvent").value.trim();
  const rawDate = document.getElementById("compDate").value;
  const timeStr = String(document.getElementById("compTime").value).trim();
  const venue = document.getElementById("compVenue").value.trim();

  if (!event || !rawDate || !timeStr || !venue) {
    alert("Please enter event, date, time and venue.");
    return;
  }

  const date = convertDate(rawDate);
  const formattedTime = formatTimeDisplay(timeStr);

  selectedAthlete.competitionResults.push({
    event,
    date,
    time: formattedTime,
    venue
  });

  saveData();
  updatePBFromCompetitionResults(selectedAthlete);
  updateCompetitionYearlyTracker(selectedAthlete);
  selectAthlete(selectedAthlete.id);

  document.getElementById("compEvent").value = "";
  document.getElementById("compDate").value = "";
  document.getElementById("compTime").value = "";
  document.getElementById("compVenue").value = "";
}

/* =========================================================
   DATE FORMAT HELPERS
========================================================= */
function convertDOBToISO(raw) {
  // Converts DD/MM/YYYY → YYYY-MM-DD for <input type="date">
  if (!raw || !raw.includes("/")) return raw;
  const [d, m, y] = raw.split("/");
  return `${y}-${m}-${d}`;
}

function convertDOBToUKFormat(raw) {
  // Converts YYYY-MM-DD → DD/MM/YYYY for storage + age calculations
  if (!raw || !raw.includes("-")) return raw;
  const [y, m, d] = raw.split("-");
  return `${d}/${m}/${y}`;
}


/* =========================================================
   SELECT ATHLETE
========================================================= */
function selectAthlete(id) {
  selectedAthlete = athletes.find(a => a.id === id);
  selectedAthlete.competitionResults ||= [];

  // ⭐ Normalise DOB once
  const dobNorm = normaliseDob(selectedAthlete.dob);

  // Set dropdown
  document.getElementById("athleteSelect").value = id;

  // Name
  document.getElementById("athleteName").value = selectedAthlete.name;

  // DOB → convert to ISO for date picker
  document.getElementById("athleteDOB").value =
    convertDOBToISO(selectedAthlete.dob);

  // Current age group
  document.getElementById("ageGroupDisplay").innerText =
    getScottishAthleticsAgeGroup(dobNorm);

  // ⭐ NEXT AGE GROUP (1 Oct)
  document.getElementById("nextAgeGroup").innerText =
    getNextAgeGroup(dobNorm);

  // ⭐ MOVEMENT (Stays / Moves Up)
  document.getElementById("ageGroupMovement").innerText =
    getAgeGroupMovement(selectedAthlete);

  // ⭐ TRAINING DAYS (ATHLETE PAGE)
  updateTrainingDaysDisplay(dobNorm);

  // PB + competition updates
  updatePBTable();
  updateCompetitionYearlyTracker(selectedAthlete);
  updatePBFromCompetitionResults(selectedAthlete);

  // Age on next Oct 1 (training page)
  document.getElementById("trainingAthleteAge").innerText =
    getAgeOnNextOct1(dobNorm);

  updateAthleteCompetitionList(selectedAthlete);

  // Countdowns
  updateAgeGroupCountdown();
  updateTrainingPageCountdown();

  // ⭐ FIX HOME PAGE TRAINING DAYS + AGE GROUP CHANGE
  renderHomeAthleteList();
}

/* =========================================================
   TRAINING DAYS DISPLAY (ATHLETE PAGE)
========================================================= */
function updateTrainingDaysDisplay(dob) {
  const dobNorm = normaliseDob(dob);
  const days = getTrainingDaysByAge(dobNorm);

  document.getElementById("athleteTrainingDays").innerText =
    days.length ? days.join(", ") : "N/A";
}

/* =========================================================
   COMPETITION LIST + DELETE BUTTONS
========================================================= */
function updateAthleteCompetitionList(a) {
  const list = document.getElementById("competitionList");

  const results = a.competitionResults;

  if (!results.length) {
    list.innerHTML = `<div class="empty">No competition results recorded</div>`;
    return;
  }

  list.innerHTML = results.map((r, index) => `
    <div class="comp-item">
     <span>${formatDateUK(r.date)} — ${normalizeEventName(r.event)} — ${formatTimeDisplay(r.time)} — ${r.venue}</span>


      <button class="delete-comp-btn" data-index="${index}">🗑️</button>
    </div>
  `).join("");

  // ⭐ Delete handler
  document.querySelectorAll(".delete-comp-btn").forEach(btn => {
  btn.onclick = () => {
    const i = Number(btn.dataset.index);

    a.competitionResults.splice(i, 1);
    saveData();

    updateAthleteCompetitionList(a);
    updateCompetitionYearlyTracker(a);

    // ⭐ STEP 4 — Auto-update PBs after deleting a result
    updatePBFromCompetitionResults(a);
  };
});

}

/* =========================================================
   TRAINING PAGE DAYS
========================================================= */
function updateTrainingPageDays(dob) {
  const days = getTrainingDaysByAge(dob);
  document.getElementById("trainingPageDays").innerText =
    days.length ? days.join(", ") : "N/A";
}



/* =========================================================
   ATHLETE LIST
========================================================= */
function loadAthleteList() {
  const list = document.getElementById("athleteList");

  list.innerHTML = athletes.map(a =>
    `<div class="athlete-item" data-id="${a.id}">
       <span class="athlete-name">${a.name}</span>
       <button class="select-btn" data-id="${a.id}">Select</button>
       <button class="delete-btn" data-id="${a.id}">🗑️</button>
     </div>`
  ).join("");

  // SELECT ATHLETE
  document.querySelectorAll(".select-btn").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      selectAthlete(id);
    };
  });

 // DELETE ATHLETE
document.querySelectorAll(".delete-btn").forEach(btn => {
  btn.onclick = () => {
    const id = Number(btn.dataset.id);

    athletes = athletes.filter(a => a.id !== id);

    if (selectedAthlete && selectedAthlete.id === id) {
      selectedAthlete = null;
    }

    saveData();
    updateHomePage();
    renderHomeAthleteList();   // ⭐ REQUIRED FIX
    loadAthleteList();
    updateTrainingDropdown();
    updatePBTable();
  };
});

}


/* =========================================================
   ATHLETE DROPDOWN SELECTION
========================================================= */
document.getElementById("athleteSelect").onchange = () => {
  const id = Number(document.getElementById("athleteSelect").value);
  selectAthlete(id);
};



/* =========================================================
   DOB FORMAT HELPERS
========================================================= */
function convertDOBToISO(raw) {
  if (!raw || !raw.includes("/")) return raw;
  const [d, m, y] = raw.split("/");
  return `${y}-${m}-${d}`;
}

function convertDOBToUKFormat(raw) {
  if (!raw || !raw.includes("-")) return raw;
  const [y, m, d] = raw.split("-");
  return `${d}/${m}/${y}`;
}


/* =========================================================
   SCOTTISH ATHLETICS AGE GROUP SYSTEM (COMPETITION AGE)
   Age groups based on age on 1 January of the competition year
========================================================= */

// Convert DD/MM/YYYY → YYYY-MM-DD
function normaliseDob(dob) {
  if (dob.includes("/")) {
    const [d, m, y] = dob.split("/");
    return `${y}-${m}-${d}`;
  }
  return dob;
}

// Determine competition year
// Before 1 Oct → compYear = this year
// On/after 1 Oct → compYear = next year
function getCompetitionYear() {
  const today = new Date();
  const year = today.getFullYear();
  const oct1 = new Date(year, 9, 1);
  return today < oct1 ? year : year + 1;
}

// Next competition year
function getNextCompetitionYear() {
  return getCompetitionYear() + 1;
}

/* =========================================================
   CURRENT AGE GROUP (competition age)
========================================================= */
function getScottishAthleticsAgeGroup(dob) {
  dob = normaliseDob(dob);
  const birthYear = parseInt(dob.split("-")[0], 10);

  const compYear = getCompetitionYear();
  const compAge = compYear - birthYear; // age on 1 Jan of compYear

  if (compAge <= 11) return "U12";
  if (compAge <= 13) return "U14";
  if (compAge <= 15) return "U16";
  if (compAge <= 17) return "U18";
  if (compAge <= 19) return "U20";
  return "SEN";
}

/* =========================================================
   NEXT AGE GROUP (next competition age)
========================================================= */
function getNextAgeGroup(dob) {
  dob = normaliseDob(dob);
  const birthYear = parseInt(dob.split("-")[0], 10);

  const nextCompYear = getNextCompetitionYear();
  const nextCompAge = nextCompYear - birthYear;

  if (nextCompAge <= 11) return "U12";
  if (nextCompAge <= 13) return "U14";
  if (nextCompAge <= 15) return "U16";
  if (nextCompAge <= 17) return "U18";
  if (nextCompAge <= 19) return "U20";
  return "SEN";
}

/* =========================================================
   MOVEMENT
========================================================= */
function getAgeGroupMovement(athlete) {
  const current = getScottishAthleticsAgeGroup(athlete.dob);
  const next = getNextAgeGroup(athlete.dob);

  if (current === next) {
    return `Stays in ${current}`;
  }
  return `Moves from ${current} → ${next}`;
}

/* =========================================================
   TRAINING DAYS BASED ON COMPETITION AGE
========================================================= */
function getTrainingDaysByAge(dob) {
  const ageGroup = getScottishAthleticsAgeGroup(dob);

  if (ageGroup === "U12") return ["Mon", "Wed"];
  if (ageGroup === "U14") return ["Mon", "Wed"];
  if (ageGroup === "U16") return ["Mon", "Wed", "Sat"];
  if (ageGroup === "U18") return ["Mon", "Wed", "Sat", "Sun"];
  if (ageGroup === "U20" || ageGroup === "SEN")
    return ["Mon", "Tue", "Wed", "Thu", "Sat", "Sun"];

  return [];
}


/* =========================================================
   COUNTDOWN TO NEXT 1 OCTOBER
========================================================= */
function getNextOct1Date() {
  const today = new Date();
  const year = today.getFullYear();
  const thisOct1 = new Date(year, 9, 1);
  return today < thisOct1 ? thisOct1 : new Date(year + 1, 9, 1);
}

function getDaysUntilAgeGroupChange() {
  const today = new Date();
  const nextOct1 = getNextOct1Date();
  return Math.ceil((nextOct1 - today) / (1000 * 60 * 60 * 24));
}

/* =========================================================
   AUTO-DETECT PB FROM COMPETITION RESULTS
========================================================= */
function updatePBFromCompetitionResults(a) {

  // Ensure PBs exist
  a.personalBests ||= {};

  // Loop through all competition results
  a.competitionResults.forEach(r => {
    const event = normalizeEventName(r.event);
    const time = r.time;

    // If no PB exists yet for this event → set it
    if (!a.personalBests[event]) {
      a.personalBests[event] = time;
      return;
    }

    // If this result is faster → update PB
    if (time < a.personalBests[event]) {
      a.personalBests[event] = time;
    }
  });

  // Refresh PB table
  updatePBTable();
}

/* =========================================================
   ADD NEW PB (PROFILE PAGE)
========================================================= */
function saveNewPB() {
  if (!selectedAthlete) {
    alert("No athlete selected.");
    return;
  }

  const eventRaw = document.getElementById("pbEvent").value.trim();
  const time = document.getElementById("pbTime").value.trim();
  const rawDate = document.getElementById("pbDate").value.trim();
  const venue = document.getElementById("pbVenue").value.trim();

  if (!eventRaw || !time || !rawDate) {
    alert("Please fill in event, time and date.");
    return;
  }

  const event = normalizeEventName(eventRaw);
  const date = convertDate(rawDate);   // ⭐ FIXED

  if (!date) {
    alert("Invalid date format");
    return;
  }

  selectedAthlete.pbs ||= [];
  selectedAthlete.pbs.push({ event, time, date, venue });

  saveData();
  updatePBTable();
}



/* =========================================================
   SAVE ATHLETE (NEW ATHLETE) — FINAL 2026 SA VERSION
========================================================= */
document.getElementById("saveAthleteButton").onclick = () => {
  const name = document.getElementById("athleteName").value.trim();
  const rawDob = document.getElementById("athleteDOB").value.trim(); // YYYY-MM-DD

  if (!name) {
    alert("Enter a name");
    return;
  }

  if (!rawDob) {
    alert("Enter date of birth");
    return;
  }

  // ⭐ Convert YYYY-MM-DD → DD/MM/YYYY for storage + SA rules
  const dob = convertDOBToUKFormat(rawDob);

  // ⭐ Scottish Athletics age group (YEAR-OF-BIRTH system)
  const ageGroup = getScottishAthleticsAgeGroup(dob);

  const athlete = {
    id: Date.now(),
    name,
    dob,               // stored in UK format
    ageGroup,
    emergency: "",
    relationship: "",
    sessions: {},
    pbs: [],
    competitionResults: []
  };

  athletes.push(athlete);
  selectedAthlete = athlete;

  saveData();

  // ⭐ Update all pages
  updateHomePage();
  renderHomeAthleteList();   // ⭐ REQUIRED FIX
  loadAthleteList();
  updateTrainingDropdown();
  updatePBTable();

  // ⭐ Reset form
  document.getElementById("athleteSelect").value = athlete.id;
  document.getElementById("athleteName").value = "";
  document.getElementById("athleteDOB").value = "";
  document.getElementById("ageGroupDisplay").innerText = "";
};

/* =========================================================
   SAVE ATHLETE EDITS (HOME PAGE) — FINAL 2026 SA VERSION
========================================================= */
function saveAthleteEdits(id) {
  const athlete = athletes.find(a => a.id === id);
  if (!athlete) return;

  // Basic fields
  athlete.emergency = document.getElementById(`editEmergency-${id}`).value;
  athlete.relationship = document.getElementById(`editRelationship-${id}`).value;

  // Raw DOB from input (always YYYY-MM-DD)
  const rawDob = document.getElementById(`editDob-${id}`).value;

  // ⭐ Convert YYYY-MM-DD → DD/MM/YYYY for storage + SA rules
  athlete.dob = convertDOBToUKFormat(rawDob);

  // ⭐ Recalculate age group using YEAR-OF-BIRTH system
  athlete.ageGroup = getScottishAthleticsAgeGroup(athlete.dob);

  // Save + refresh UI
  saveData();
  updateHomePage();
  renderHomeAthleteList();   // ⭐ THIS LINE FIXES YOUR HOME PAGE
  loadAthleteList();
  updateTrainingDropdown();
  updatePBTable();
}

/* =========================================================
   DELETE ATHLETE (PROFILE CARD)
========================================================= */
const deleteProfileBtn = document.createElement("button");
deleteProfileBtn.innerText = "Delete Athlete";
deleteProfileBtn.className = "delete-btn";
document.querySelector("#athlete .card").appendChild(deleteProfileBtn);

deleteProfileBtn.onclick = () => {
  if (!selectedAthlete) return alert("No athlete selected");

  athletes = athletes.filter(a => a.id !== selectedAthlete.id);
  selectedAthlete = null;

  saveData();
  updateHomePage();
  renderHomeAthleteList();   // ⭐ REQUIRED FIX
  loadAthleteList();
  updateTrainingDropdown();
  updatePBTable();
};


/* =========================================================
   RENDER HOME ATHLETE LIST — SHOW TRAINING DAYS + AGE GROUP CHANGE
========================================================= */
function renderHomeAthleteList() {
  const list = document.getElementById("homeAthleteList");
  list.innerHTML = ""; // clear existing

  athletes.forEach(athlete => {

    // ⭐ ALWAYS normalise DOB first (critical fix)
    const dobNorm = normaliseDob(convertDOBToUKFormat(athlete.dob));

    const card = document.createElement("div");
    card.className = "athleteCard";
    card.dataset.id = athlete.id;

    card.innerHTML = `
      <h3 class="athleteName">${athlete.name}</h3>

      <p>Date of Birth: ${athlete.dob}</p>
      <p>Age Group: ${getScottishAthleticsAgeGroup(dobNorm)}</p>

      <p>Training Days: <span class="homeTrainingDays"></span></p>
      <p>Age Group Change: <span class="homeAgeGroupCountdown"></span></p>
      <p>Next Age Group: <span class="homeNextAgeGroup"></span></p>
    `;

    list.appendChild(card);

    // ⭐ TRAINING DAYS (now works)
    const trainingDays = getTrainingDaysByAge(dobNorm);
    card.querySelector(".homeTrainingDays").innerText =
      trainingDays.length ? trainingDays.join(", ") : "N/A";

    // ⭐ AGE GROUP CHANGE COUNTDOWN (now works)
    const countdown = getDaysUntilAgeGroupChange();
    card.querySelector(".homeAgeGroupCountdown").innerText =
      countdown === 0 ? "Changes today!" : `${countdown} days`;

    // ⭐ NEXT AGE GROUP (now works)
    card.querySelector(".homeNextAgeGroup").innerText =
      getNextAgeGroup(dobNorm);
  });
}

/* =========================================================
   PB SYSTEM (MODAL)
========================================================= */
document.getElementById("addPBButton").onclick = addPB;

function addPB() {
  if (!selectedAthlete) {
    alert("Select athlete first");
    return;
  }
  document.getElementById("pbModalBackdrop").style.display = "flex";
}

document.getElementById("pbCancel").onclick = () => {
  document.getElementById("pbModalBackdrop").style.display = "none";
};

document.getElementById("pbSave").onclick = () => {
  if (!selectedAthlete) {
    alert("No athlete selected");
    return;
  }

  const eventRaw = document.getElementById("pbEvent").value.trim();
  const time = document.getElementById("pbTime").value.trim();
  const rawDate = document.getElementById("pbDate").value.trim();
  const venue = document.getElementById("pbVenue").value.trim();

  if (!time || !rawDate) {
    alert("Please enter time and date");
    return;
  }

  const event = normalizeEventName(eventRaw);

  // ⭐ Correct date conversion
  const date = convertDate(rawDate);

  selectedAthlete.pbs.push({ event, time, date, venue });

  saveData();
  updatePBTable();

  document.getElementById("pbModalBackdrop").style.display = "none";
};


/* =========================================================
   UPDATE PB TABLE
========================================================= */
function updatePBTable() {
  const body = document.getElementById("pbBody");

  if (!selectedAthlete || !selectedAthlete.pbs) {
    body.innerHTML = "";
    return;
  }

  if (selectedAthlete.pbs.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; opacity:0.6;">
          No personal bests recorded
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = selectedAthlete.pbs.map((pb, index) => {
    const event = normalizeEventName(pb.event);
    const dateUK = formatDateUK(pb.date);
    const colour = eventColours[event];

    return `
      <tr style="color:${colour}">
        <td>${event}</td>
        <td>${pb.time}</td>
        <td>${dateUK}</td>
        <td>${pb.venue || ""}</td>
        <td>
          <button class="bin-btn" onclick="deletePB(${index})">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");
}

/* =========================================================
   DELETE PB
========================================================= */
function deletePB(index) {
  selectedAthlete.pbs.splice(index, 1);
  saveData();
  updatePBTable();
}

/* =========================================================
   TRAINING PAGE DROPDOWN
========================================================= */
function updateTrainingDropdown() {
  const dd = document.getElementById("athleteSelect");

  dd.innerHTML = `
    <option value="">Select athlete</option>
    ${athletes.map(a => `<option value="${a.id}">${a.name}</option>`).join("")}
  `;
}

/* =========================================================
   TRAINING PAGE
========================================================= */

const trainingDropdown = document.getElementById("athleteSelect");

trainingDropdown.addEventListener("change", updateTrainingPage);
document.getElementById("monthSelect").addEventListener("change", updateTrainingMonth);

function updateTrainingMonth() {
  if (!selectedAthlete) return;

  const month = Number(document.getElementById("monthSelect").value);

  // ⭐ Update calendar using selected athlete + selected month
  updateMonthCalendar(selectedAthlete, month);
}


function updateTrainingPage() {
  const id = Number(document.getElementById("athleteSelect").value);
  const a = athletes.find(x => x.id === id);

  if (!a) return;

  selectedAthlete = a;

  document.getElementById("trainingAthleteName").innerText = a.name;

  // Age group display is fine
  document.getElementById("trainingAthleteAge").innerText = a.ageGroup;

  // ⭐ FIXED — now uses DOB, not age group
  updateTrainingPageDays(a.dob);

  updateMonthCalendar(a);
}


/* =========================================================
   TRAINING CALENDAR — MONTH + DAY STORAGE + WEEKDAY HEADERS
========================================================= */
function updateMonthCalendar(a, forcedMonth = null) {
  selectedAthlete = a;

  const monthName = document.getElementById("calendarMonth");
  const grid = document.getElementById("monthGrid");
  const year = new Date().getFullYear();

  // Determine selected month
  const month = forcedMonth !== null
    ? forcedMonth
    : Number(document.getElementById("monthSelect").value);

  const monthNames = [
    "January","February","March",
    "April","May","June",
    "July","August","September",
    "October","November","December"
  ];

  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  monthName.innerText = monthNames[month];
  grid.innerHTML = "";

  // ⭐ Add weekday header row
  const headerRow = document.createElement("div");
  headerRow.classList.add("calendar-header-row");

  dayNames.forEach(d => {
    const h = document.createElement("div");
    h.classList.add("calendar-header");
    h.innerText = d;
    headerRow.appendChild(h);
  });

  grid.appendChild(headerRow);

  // Determine days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Determine weekday of the 1st (convert JS Sun=0 → Mon=0)
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  // Ensure month exists in athlete data
  if (!a.sessions) a.sessions = {};
  if (!a.sessions[month]) a.sessions[month] = {};

  // ⭐ Add blank boxes before day 1
  for (let i = 0; i < firstDayIndex; i++) {
    const blank = document.createElement("div");
    blank.classList.add("day-box", "blank-day");
    grid.appendChild(blank);
  }

 // ⭐ Add actual day boxes
for (let day = 1; day <= daysInMonth; day++) {
  const box = document.createElement("div");
  box.classList.add("day-box");

  // Calculate weekday name
  const weekdayIndex = (firstDayIndex + day - 1) % 7;
  const weekdayName = dayNames[weekdayIndex];

  // Weekday div
  const wd = document.createElement("div");
  wd.classList.add("weekday");
  wd.innerText = weekdayName;

  // Day number div
  const dn = document.createElement("div");
  dn.classList.add("day-number");
  dn.innerText = day;

  box.appendChild(wd);
  box.appendChild(dn);

  // Add session text if exists
  const session = a.sessions[month][day];
  if (session) {
    box.classList.add(`intensity-${session.intensity}`);

    const textDiv = document.createElement("div");
    textDiv.classList.add("day-text");
    textDiv.innerText = session.text;
    box.appendChild(textDiv);
  }

  box.onclick = () => openSessionEditor(day);
  grid.appendChild(box);
}

// ⭐ These belong AFTER the loop, INSIDE the function
updateIntensitySummary(a);
updateIntensityPercent(a);
updateYearIntensityGraph(a);

}   // closes updateMonthCalendar

/* =========================================================
   MONTH SELECT — AUTO UPDATE CALENDAR + GRAPH
========================================================= */
document.getElementById("monthSelect").onchange = () => {
  if (selectedAthlete) {
    updateMonthCalendar(selectedAthlete);
    updateYearIntensityGraph(selectedAthlete);
  }
};


/* =========================================================
   SESSION EDITOR
========================================================= */
function openSessionEditor(day) {
  selectedDay = day;
  document.getElementById("modalBackdrop").style.display = "flex";

  const month = Number(document.getElementById("monthSelect").value);

  const session =
    selectedAthlete.sessions?.[month]?.[day] ||
    { intensity: "rest", text: "" };

  document.getElementById("modalSession").value = session.text;
  document.getElementById("modalIntensity").value = session.intensity;
}


/* =========================================================
   SAVE SESSION
========================================================= */
document.getElementById("modalSave").onclick = () => {
  const text = document.getElementById("modalSession").value;
  const intensity = document.getElementById("modalIntensity").value;

  const year = new Date().getFullYear();
  const month = Number(document.getElementById("monthSelect").value);

  if (!selectedAthlete.sessions) selectedAthlete.sessions = {};
  if (!selectedAthlete.sessions[month]) selectedAthlete.sessions[month] = {};

  const dateString =
    `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  selectedAthlete.sessions[month][selectedDay] = {
    intensity,
    text,
    date: dateString
  };

  saveData();
  updateMonthCalendar(selectedAthlete);

  document.getElementById("modalBackdrop").style.display = "none";
};


/* =========================================================
   CLEAR SESSION
========================================================= */
document.getElementById("modalClear").onclick = () => {
  const month = Number(document.getElementById("monthSelect").value);

  if (selectedAthlete.sessions?.[month]) {
    delete selectedAthlete.sessions[month][selectedDay];
  }

  saveData();
  updateMonthCalendar(selectedAthlete);

  document.getElementById("modalBackdrop").style.display = "none";
};


/* =========================================================
   CANCEL EDITOR
========================================================= */
document.getElementById("modalCancel").onclick = () => {
  document.getElementById("modalBackdrop").style.display = "none";
};

/* =========================================================
   INTENSITY SUMMARY + PERCENT
========================================================= */

function updateIntensitySummary(a) {
  let rest = 0, low = 0, med = 0, high = 0, competition = 0;

  if (a.sessions) {
    for (let day in a.sessions) {
      const intensity = a.sessions[day].intensity;

      if (intensity === "rest") rest++;
      if (intensity === "low") low++;
      if (intensity === "med") med++;
      if (intensity === "high") high++;
      if (intensity === "competition") competition++;
    }
  }

  document.getElementById("sumRest").innerText = rest;
  document.getElementById("sumLow").innerText = low;
  document.getElementById("sumMed").innerText = med;
  document.getElementById("sumHigh").innerText = high;
  document.getElementById("sumCompetition").innerText = competition;
}

function updateIntensityPercent(a) {
  let rest = 0, low = 0, med = 0, high = 0, competition = 0;

  if (a.sessions) {
    for (let day in a.sessions) {
      const intensity = a.sessions[day].intensity;

      if (intensity === "rest") rest++;
      if (intensity === "low") low++;
      if (intensity === "med") med++;
      if (intensity === "high") high++;
      if (intensity === "competition") competition++;
    }
  }

  const total = rest + low + med + high + competition;

  const pct = count =>
    total === 0 ? "0%" : Math.round((count / total) * 100) + "%";

  document.getElementById("pctRest").innerText = pct(rest);
  document.getElementById("pctLow").innerText = pct(low);
  document.getElementById("pctMed").innerText = pct(med);
  document.getElementById("pctHigh").innerText = pct(high);
  document.getElementById("pctCompetition").innerText = pct(competition);
}

/* =========================================================
   YEARLY INTENSITY LINES GRAPH
========================================================= */

let yearIntensityChart = null;

function updateYearIntensityGraph(a) {
  if (!a.sessions) return;

  const monthlyData = {
    rest: Array(12).fill(0),
    low: Array(12).fill(0),
    med: Array(12).fill(0),
    high: Array(12).fill(0),
    competition: Array(12).fill(0)
  };

  // ✔ Correct loop for your data structure (object with numeric keys)
  for (const day in a.sessions) {

    const session = a.sessions[day];
    if (!session || !session.date) continue;

    const d = new Date(session.date);
    const monthIndex = d.getMonth(); // 0–11

    monthlyData[session.intensity][monthIndex]++;
  }

  if (yearIntensityChart) yearIntensityChart.destroy();

  const ctx = document.getElementById("yearIntensityChart").getContext("2d");

  yearIntensityChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "Jan","Feb","Mar",
        "Apr","May","Jun",
        "Jul","Aug","Sep",
        "Oct","Nov","Dec"
      ],
      datasets: [
        {
          label: "Rest",
          data: monthlyData.rest,
          borderColor: "#d9d9d9",
          backgroundColor: "transparent",
          tension: 0.3
        },
        {
          label: "Low",
          data: monthlyData.low,
          borderColor: "#b3e6b3",
          backgroundColor: "transparent",
          tension: 0.3
        },
        {
          label: "Medium",
          data: monthlyData.med,
          borderColor: "#ffe680",
          backgroundColor: "transparent",
          tension: 0.3
        },
        {
          label: "High",
          data: monthlyData.high,
          borderColor: "#ff9999",
          backgroundColor: "transparent",
          tension: 0.3
        },
        {
          label: "Competition",
          data: monthlyData.competition,
          borderColor: "#80b3ff",
          backgroundColor: "transparent",
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Sessions per Month" }
        }
      }
    }
  });
}


/* =========================================================
   COACH PAGE
========================================================= */

document.getElementById("generateNotesButton").onclick = () => {
  const notes = document.getElementById("coachNotes").value;

  if (!notes.trim()) {
    alert("Enter some notes");
    return;
  }

  alert("Coach Notes Generated:\n\n" + notes);
};

/* =========================================================
   NAVIGATION
========================================================= */

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "home") {
    updateHomePage();   // ONLY THIS
  }

  if (id === "coach") {
    // nothing special yet
  }

  if (id === "athlete") {
    loadAthleteList();
    updatePBTable();
  }

  if (id === "training") {
    updateTrainingDropdown();
  }

 if (id === "calculator") {
    initCalculator();   // ⭐ THIS FIXES THE 5K LOAD ISSUE
}

}

document.getElementById("navHome").onclick = () => showPage("home");
document.getElementById("navAthlete").onclick = () => showPage("athlete");
document.getElementById("navTraining").onclick = () => showPage("training");
document.getElementById("navDrills").onclick = () => showPage("drills");

document.getElementById("navCalculator").onclick = () => showPage("calculator");
document.getElementById("navCoach").onclick = () => showPage("coach");
document.getElementById("navStrength").onclick = () => showPage("strength");


/* =========================================================
   MASTER CALCULATOR — ALL EVENTS
========================================================= */
function calculatePaces(event, pb) {

  // Validate PB format mm:ss
  if (!pb || !pb.match(/^\d{1,2}:\d{2}$/)) return;

  // Convert PB → seconds
  const [mm, ss] = pb.split(":").map(Number);
  const totalSeconds = (mm * 60) + ss;

  // Time formatting helper
  const toTime = secs => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* =========================================================
        5K — ZONES + SPLITS
  ========================================================== */
  if (event === "5k") {

    const racePacePerKm = totalSeconds / 5;
    const tempoPerKm = racePacePerKm + 17;

    const tempo400_low = (tempoPerKm - 2) * 0.4;
    const tempo400_high = (tempoPerKm + 2) * 0.4;

    const zones = {
      recovery: {
        km_low: tempoPerKm + 60,
        km_high: tempoPerKm + 90,
        m400_low: (tempoPerKm + 60) * 0.4,
        m400_high: (tempoPerKm + 90) * 0.4
      },

      easy: {
        km_low: tempoPerKm + 30,
        km_high: tempoPerKm + 60,
        m400_low: (tempoPerKm + 30) * 0.4,
        m400_high: (tempoPerKm + 60) * 0.4
      },

      tempo: {
        km: tempoPerKm,
        m400_low: tempo400_low,
        m400_high: tempo400_high
      },

      threshold: {
        km_low: tempoPerKm - 10,
        km_high: tempoPerKm - 5,
        m400_low: (tempoPerKm - 10) * 0.4,
        m400_high: (tempoPerKm - 5) * 0.4
      },

      vo2: {
        km_low: tempoPerKm - 35,
        km_high: tempoPerKm - 25,
        m400_low: (tempoPerKm - 35) * 0.4,
        m400_high: (tempoPerKm - 25) * 0.4
      }
    };

    // Write zones
    document.getElementById("z1km").innerText =
      `${toTime(zones.recovery.km_low)} – ${toTime(zones.recovery.km_high)}`;
    document.getElementById("z1_400").innerText =
      `${toTime(zones.recovery.m400_low)} – ${toTime(zones.recovery.m400_high)}`;

    document.getElementById("z2km").innerText =
      `${toTime(zones.easy.km_low)} – ${toTime(zones.easy.km_high)}`;
    document.getElementById("z2_400").innerText =
      `${toTime(zones.easy.m400_low)} – ${toTime(zones.easy.m400_high)}`;

    document.getElementById("z3km").innerText = toTime(zones.tempo.km);
    document.getElementById("z3_400").innerText =
      `${toTime(zones.tempo.m400_low)} – ${toTime(zones.tempo.m400_high)}`;

    document.getElementById("z4km").innerText =
      `${toTime(zones.threshold.km_low)} – ${toTime(zones.threshold.km_high)}`;
    document.getElementById("z4_400").innerText =
      `${toTime(zones.threshold.m400_low)} – ${toTime(zones.threshold.m400_high)}`;

    document.getElementById("z5km").innerText =
      `${toTime(zones.vo2.km_low)} – ${toTime(zones.vo2.km_high)}`;
    document.getElementById("z5_400").innerText =
      `${toTime(zones.vo2.m400_low)} – ${toTime(zones.vo2.m400_high)}`;

    // Splits
    const pacePerMeter = racePacePerKm / 1000;
    [400, 800, 1000, 2000, 3000, 4000].forEach(dist => {
      const split = pacePerMeter * dist;
      const field = document.getElementById(`split_${dist}`);
      if (field) field.innerText = toTime(split);
    });
  }

  /* =========================================================
        1500m CALCULATOR
  ========================================================== */
  if (event === "1500m") {

    const rp_per_m = totalSeconds / 1500;

    const rpDistances = [300, 400, 500, 600, 800, 1000, 1200];
    rpDistances.forEach(dist => {
      const rp = rp_per_m * dist;
      const field = document.getElementById(`rp_${dist}`);
      if (field) field.innerText = toTime(rp);
    });

    const seDistances = [150, 200, 300, 400, 500, 600];
    const seAdjust = { 300: 2, 400: 3 };

    seDistances.forEach(dist => {
      const rp = rp_per_m * dist;
      const adj = seAdjust[dist] || 0;
      const field = document.getElementById(`se_${dist}`);
      if (field) field.innerText = toTime(rp - adj);
    });

    const asDistances = [400, 500, 600, 800, 1000, 1200, 1600];
    const asAdjust = { 800: 5, 1000: 8, 1200: 10 };

    asDistances.forEach(dist => {
      const rp = rp_per_m * dist;
      const adj = asAdjust[dist] || 0;
      const field = document.getElementById(`as_${dist}`);
      if (field) field.innerText = toTime(rp + adj);
    });

    const repsDistances = [100, 200, 300, 400, 500];
    const repsAdjust = { 100: 1, 200: 2, 300: 3, 400: 4, 500: 5 };

    repsDistances.forEach(dist => {
      const rp = rp_per_m * dist;
      const adj = repsAdjust[dist] || 0;
      const field = document.getElementById(`reps_${dist}`);
      if (field) field.innerText = toTime(rp - adj);
    });

    const intDistances = [400, 500, 600, 800, 1000];
    const intAdjust = { 400: 2, 500: 3, 600: 4, 800: 6, 1000: 8 };

    intDistances.forEach(dist => {
      const rp = rp_per_m * dist;
      const adj = intAdjust[dist] || 0;
      const field = document.getElementById(`int_${dist}`);
      if (field) field.innerText = toTime(rp + adj);
    });

    const vo2Distances = [400, 500, 600, 800, 1000, 1200];
    vo2Distances.forEach(dist => {
      const rp = rp_per_m * dist;
      const field = document.getElementById(`vo2_${dist}`);
      if (field) field.innerText = toTime(rp);
    });
  }

  /* =========================================================
        800m CALCULATOR
  ========================================================== */
  if (event === "800m") {

    const rp_per_m = totalSeconds / 800;

    const distances = [200, 300, 400, 500, 600];

    const seAdjust = { 200: 1, 300: 1.5, 400: 2.5, 500: 3.5, 600: 4.5 };
    const repAdjust = { 100: 2, 150: 2.5, 200: 3, 250: 3.5, 300: 4, 400: 6 };
    const intervalAdjust = { 200: 2, 300: 3, 400: 4, 500: 5, 600: 7, 800: 10 };
    const vo2Adjust = { 400: 6, 500: 8, 600: 10, 800: 14 };

    distances.forEach(dist => {
      const rp = rp_per_m * dist;

      const rpField = document.getElementById(`rp800_${dist}`);
      if (rpField) rpField.innerText = `${dist}m: ${toTime(rp)}`;

      const seField = document.getElementById(`se800_${dist}`);
      if (seField && seAdjust[dist]) seField.innerText = `${dist}m: ${toTime(rp - seAdjust[dist])}`;

      const repField = document.getElementById(`reps800_${dist}`);
      if (repField && repAdjust[dist]) repField.innerText = `${dist}m: ${toTime(rp - repAdjust[dist])}`;

      const intField = document.getElementById(`int800_${dist}`);
      if (intField && intervalAdjust[dist]) intField.innerText = `${dist}m: ${toTime(rp + intervalAdjust[dist])}`;

      const vo2Field = document.getElementById(`vo2800_${dist}`);
      if (vo2Field && vo2Adjust[dist]) vo2Field.innerText = `${dist}m: ${toTime(rp + vo2Adjust[dist])}`;
    });

    [100, 150, 250].forEach(dist => {
      const rp = rp_per_m * dist;
      const field = document.getElementById(`reps800_${dist}`);
      if (field) field.innerText = `${dist}m: ${toTime(rp - repAdjust[dist])}`;
    });

    const int200 = document.getElementById("int800_200");
    if (int200) int200.innerText = `200m: ${toTime(rp_per_m * 200 + intervalAdjust[200])}`;

    const int800 = document.getElementById("int800_800");
    if (int800) int800.innerText = `800m: ${toTime(rp_per_m * 800 + intervalAdjust[800])}`;

    const vo2800 = document.getElementById("vo2800_800");
    if (vo2800) vo2800.innerText = `800m: ${toTime(rp_per_m * 800 + vo2Adjust[800])}`;
  }

  /* =========================================================
        400m CALCULATOR
  ========================================================== */
  if (event === "400m") {

    const rp_per_m = totalSeconds / 400;

    const split = (dist, adj = 0) => toTime(rp_per_m * dist + adj);

    document.getElementById("rp400_100").innerText = split(100);
    document.getElementById("rp400_200").innerText = split(200);
    document.getElementById("rp400_300").innerText = split(300);

    document.getElementById("al400_30").innerText  = split(30,  -0.5);
    document.getElementById("al400_60").innerText  = split(60,  -0.8);
    document.getElementById("al400_100").innerText = split(100, -1.0);
    document.getElementById("al400_150").innerText = split(150, -1.5);

    document.getElementById("se400_150").innerText = split(150, -1.0);
    document.getElementById("se400_200").innerText = split(200, -1.5);
    document.getElementById("se400_300").innerText = split(300, -2.0);
    document.getElementById("se400_400").innerText = split(400, -2.5);

    document.getElementById("lt400_100").innerText = split(100, +1.0);
    document.getElementById("lt400_150").innerText = split(150, +1.5);
    document.getElementById("lt400_200").innerText = split(200, +2.0);
    document.getElementById("lt400_300").innerText = split(300, +3.0);

    document.getElementById("int400_200").innerText = split(200, +1.0);
    document.getElementById("int400_300").innerText = split(300, +1.5);
    document.getElementById("int400_400").innerText = split(400, +2.0);
    document.getElementById("int400_600").innerText = split(600, +3.0);

    document.getElementById("vo2400_300").innerText = split(300, +2.0);
    document.getElementById("vo2400_400").innerText = split(400, +3.0);
    document.getElementById("vo2400_600").innerText = split(600, +4.0);
    document.getElementById("vo2400_800").innerText = split(800, +14.0);
  }

} // END calculatePaces()


/* =========================================================
   BUTTON HANDLER — CALL THE MASTER FUNCTION
========================================================= */
document.getElementById("calcButton").onclick = () => {
  const event = document.getElementById("calcEvent").value;
  const pb = document.getElementById("calcPB").value;
 calculatePaces();
(event, pb);
};



/* =========================================================
   COLLAPSIBLE CARD TOGGLE
========================================================= */

function toggleCard(header) {
  const content = header.nextElementSibling;
  header.classList.toggle("open");
  content.classList.toggle("open");
}


/* =========================================================
   SHOW ONLY SELECTED PACE TYPE
========================================================= */

function filterPaceType() {
  const selected = document.getElementById("paceType").value;

  // Hide all blocks
  document.querySelectorAll(".zone-block").forEach(z => {
    z.style.display = "none";
  });

  // Show only blocks matching selected pace
  if (selected) {
    document.querySelectorAll(`.zone-block[data-pace="${selected}"]`)
      .forEach(z => {
        z.style.display = "block";
      });
  }
}

document.getElementById("paceType").addEventListener("change", filterPaceType);



/* =========================================================
   PACE TYPE DROPDOWN (EVENT-SPECIFIC OPTIONS)
========================================================= */

const paceOptions = {
  "5k": [
    { value: "rp", label: "Race Pace" },
    { value: "recovery", label: "Recovery Pace" },
    { value: "easy", label: "Easy Pace" },
    { value: "tempo", label: "Tempo Pace" },
    { value: "threshold", label: "Threshold Pace" },
    { value: "vo2", label: "VO₂ Max Pace" }
  ],

  "1500m": [
    { value: "rp", label: "Race Pace" },
    { value: "se", label: "Speed Endurance" },
    { value: "as", label: "Aerobic Support" },
    { value: "reps", label: "Reps" },
    { value: "int", label: "Intervals" },
    { value: "vo2", label: "VO₂ Max" }
  ],

  "800m": [
    { value: "rp", label: "Race Pace" },
    { value: "se", label: "Speed Endurance" },
    { value: "reps", label: "Reps (Speed Power)" },
    { value: "int", label: "Intervals (Aerobic Support)" },
    { value: "vo2", label: "VO₂ Max" }
  ],

  "400m": [
    { value: "rp", label: "Race Pace" },
    { value: "alactic", label: "Short Speed Alactic" },
    { value: "se", label: "Speed Endurance" },
    { value: "vo2", label: "VO₂ Max" }
  ]
};

/* =========================================================
   UPDATE DROPDOWN WHEN EVENT CHANGES
========================================================= */

function updatePaceDropdown() {
  const event = document.getElementById("calcEvent").value;
  const paceSelect = document.getElementById("paceType");

  paceSelect.innerHTML = "";

  if (event === "5k") {
    paceSelect.innerHTML = `
      <option value="">Select pace type…</option>
      <option value="rp">Race Pace</option>
      <option value="recovery">Recovery</option>
      <option value="easy">Easy</option>
      <option value="tempo">Tempo</option>
      <option value="threshold">Threshold</option>
      <option value="vo2">VO₂ Max</option>
    `;
  }

  else if (event === "400m") {
    paceSelect.innerHTML = `
      <option value="">Select pace type…</option>
      <option value="rp">Race Pace</option>
      <option value="alactic">Short Speed (Alactic)</option>
      <option value="se">Speed Endurance</option>
      <option value="vo2">VO₂ Max</option>
    `;
  }

  else {
    // Shared dropdown for 1500m + 800m
    paceSelect.innerHTML = `
      <option value="">Select pace type…</option>
      <option value="rp">Race Pace</option>
      <option value="se">Speed Endurance</option>
      <option value="as">Aerobic Support</option>
      <option value="reps">Reps</option>
      <option value="int">Intervals</option>
      <option value="vo2">VO₂ Max</option>
    `;
  }
}


/* =========================================================
   PAGE LOAD INITIALIZER — FIXES EMPTY PACE DROPDOWN
========================================================= */

window.addEventListener("DOMContentLoaded", () => {

  // Force everything to load as if event changed once
  updatePaceDropdown();
  filterPaceType();
  updateDescription();
  showCorrectZones(document.getElementById("calcEvent").value);
});




/* =========================================================
   FORCE 5K TO SHOW RACE PACE (EVENT CHANGE ONLY)
========================================================= */
document.getElementById("calcEvent").addEventListener("change", () => {

  // Update dropdown options for the selected event
  updatePaceDropdown();

  // Hide/show correct pace-type blocks
  filterPaceType();

  // Update description box
  updateDescription();
});








/* =========================================================
   SHOW CORRECT EVENT ZONES (5K / 1500 / 800 / 400)
========================================================= */

function showCorrectZones(event) {

  // Hide all zone containers
  document.getElementById("zones-5k").style.display = "none";
  document.getElementById("zones-1500").style.display = "none";
  document.getElementById("zones-800").style.display = "none";
  document.getElementById("zones-400").style.display = "none";

  // ⭐ Hide 5K splits ONLY when NOT 5K
  const splitsCard = document.getElementById("splits-5k").closest(".card");
  if (event !== "5k") {
    splitsCard.style.display = "none";
  }

  // ⭐ Show correct zone container + splits if 5K
  if (event === "5k") {

    document.getElementById("zones-5k").style.display = "block";

    splitsCard.style.display = "block";

    // Force card open so splits are visible
    const content = splitsCard.querySelector(".card-content");
    const arrow = splitsCard.querySelector(".arrow");

    content.style.display = "block";
    arrow.textContent = "▼";
  }

  if (event === "1500m") {
    document.getElementById("zones-1500").style.display = "block";
  }

  if (event === "800m") {
    document.getElementById("zones-800").style.display = "block";
  }

  if (event === "400m") {
    document.getElementById("zones-400").style.display = "block";
  }
}

/* =========================================================
   DYNAMIC ZONE DESCRIPTIONS
========================================================= */

const paceDescriptions = {
  "5k": {
    recovery: "Very easy running that promotes blood flow and helps you bounce back. Typically continuous running for 10–40 minutes at a relaxed, gentle effort.",
    easy: "Comfortable aerobic running that builds endurance. Usually steady continuous runs for 20–60 minutes, smooth and conversational.",
    tempo: "Continuous running from 5–20 minutes at a controlled effort, about 15–20 seconds slower than 5k per‑km pace. Run just below lactate threshold — smooth, steady, and sustainably hard.",
    threshold: "Hard aerobic running near lactate threshold. Typical sessions use 800–1600m reps, 3–5 total, with 1:1 recovery to keep the effort controlled but challenging.",
    vo2: "Fast intervals at your aerobic ceiling — breathing hard, pushing limits. Typical 5k VO₂ sessions use 400–1000m reps, 4–6 total, with 1:2 recovery to maintain quality."
  },

  /* =========================================================
        UPDATED 1500m DESCRIPTIONS — MATCH NEW SPLITS
  ========================================================= */
  "1500m": {
    rp: "Race‑pace rhythm for 1500m. Smooth early, controlled through the middle, and lifting over the final 300m. Typical reps: 300–1200m with 1:3 recovery.",

    se: "Speed Endurance develops the ability to hold form under rising fatigue. Faster than race pace but repeatable. Distances: 150–600m with 1:1–1:2 recovery.",

    as: "Aerobic Support builds strength for the middle laps and supports late‑race rhythm. Controlled, smooth running. Distances: 400–1600m with 1:1–1:2 recovery.",

    reps: "Short, fast repetitions for speed and mechanics. Relaxed but quick, full posture and stride control. Distances: 100–500m with 1:2–1:3 recovery.",

    int: "Intervals provide controlled aerobic support slightly slower than RP. Helps maintain rhythm and efficiency. Distances: 400–1000m with 1:1–1:2 recovery.",

    vo2: "VO₂ Max work at your aerobic ceiling. Hard but sustainable rhythm. Distances: 400–1200m with 1:1 recovery."
  },

  "800m": {
    rp: "Your true 800m race rhythm — smooth early, then fully committed. Teaches you how the race feels and how to hold form when the legs tighten.",
    se: "Faster than race pace with short recovery. Extends your ability to stay fast under rising lactate. Typical 800m SE sessions use 200–400m reps, 4–6 total, with 1:2 to 1:4 recovery.",
    reps: "Short, fast reps with full recovery. Pure speed development — relaxed mechanics, long stride, sharp acceleration. Typical 800m rep sessions use 100–400m reps, 4–8 total, with full recovery (1:6 or more).",
    int: "Controlled aerobic reps slower than RP. Builds second‑lap strength with smoother rhythm and better oxygen delivery. Typical 800m interval sessions use 200–800m reps, 4–6 total, with 1:2 to 1:3 recovery.",
    vo2: "VO₂ Max work boosts your top‑end aerobic engine. Fast enough to push oxygen uptake, but controlled so you can finish the whole session strong. Typical 800m VO₂ sessions use 400–800m reps, 4–6 total, with 1:3 to 1:4 recovery."
  },

  "400m": {
    rp: "A controlled sprint: smooth first 50–60m, fast relaxed running to 200m, hold rhythm through the third 100m, finish with posture and arm drive as fatigue rises. Reps: 100–300m, Recovery: 1:5+.",
    alactic: "Pure speed and acceleration — sharp, snappy, and relaxed. Focus on tall posture and crisp mechanics without fatigue. Reps: 30–150m, Recovery: 1:8+.",
    se: "Fast running under rising fatigue. Teaches you to hold form and rhythm when the legs tighten. Reps: 150–400m, Recovery: 1:2.",
    lactic: "High‑intensity running that builds the ability to handle heavy lactate. Maintain posture and arm drive as the burn increases. Reps: 100–300m, Recovery: 1:3–1:5.",
    int: "Smooth, fast aerobic support work. Controlled rhythm running that strengthens late‑race pace. Reps: 200–600m, Recovery: 1:2–1:3.",
    vo2: "Fast, sustained running at your aerobic ceiling. Helps sprinters stay strong and efficient under fatigue. Reps: 300–800m, Recovery: 1:2–1:3."
  }
};

/* =========================================================
   DESCRIPTION UPDATER
========================================================= */

function updateDescription() {
  const event = document.getElementById("calcEvent").value;
  const pace = document.getElementById("paceType").value;
  const box = document.getElementById("paceDescription");

  if (!event || !pace || !paceDescriptions[event][pace]) {
    box.style.display = "none";
    box.innerText = "";
    return;
  }

  box.innerText = paceDescriptions[event][pace];
  box.style.display = "block";
}

document.getElementById("paceType").addEventListener("change", updateDescription);
document.getElementById("calcEvent").addEventListener("change", updateDescription);


/* =========================================================
   SHOW ONLY RP ON CALCULATE
========================================================= */

function showRacePaceOnly() {
  document.querySelectorAll(".zone-block").forEach(z => {
    if (z.dataset.pace === "rp") {
      z.style.display = "block";
    } else {
      z.style.display = "none";
    }
  });
}

/* =========================================================
   SHOW ONLY SELECTED PACE TYPE
========================================================= */

function filterPaceType() {
  const selected = document.getElementById("paceType").value;
  const event = document.getElementById("calcEvent").value;

  // Map event → correct container IDs
  const containers = {
    "5k": ["zones-5k", "splits-5k"],
    "1500m": ["zones-1500"],
    "800m": ["zones-800"],
    "400m": ["zones-400"]
  };

  const activeContainers = containers[event];

  // Hide all blocks ONLY inside active event containers
  activeContainers.forEach(id => {
    document.querySelectorAll(`#${id} .zone-block`).forEach(z => {
      z.style.display = "none";
    });
  });

  // Show only blocks matching selected pace type
  if (selected) {
    activeContainers.forEach(id => {
      document.querySelectorAll(`#${id} .zone-block[data-pace="${selected}"]`)
        .forEach(z => {
          z.style.display = "block";
        });
    });
  }
}




/* =========================================================
   CALCULATE BUTTON — FINAL VERSION
========================================================= */
document.getElementById("calcButton").addEventListener("click", () => {

  const event = document.getElementById("calcEvent").value;
  const pb = document.getElementById("calcPB").value.trim();

  // 1️⃣ Run calculations
  calculatePaces(event, pb);

  // 2️⃣ Update 1500m labels
  if (event === "1500m") updatePaceLabels1500();

  // 3️⃣ Show correct zone card
  showCorrectZones(event);

  // 4️⃣ Force RP for 5K (if you still want this)
  if (event === "5k") {
    document.getElementById("paceType").value = "rp";
  }

  // 5️⃣ Filter pace-type blocks
  filterPaceType();

  // 6️⃣ Update description
  updateDescription();
});


/* =========================================================
   EVENT CHANGE — UPDATE DROPDOWN
========================================================= */
document.getElementById("calcEvent").addEventListener("change", () => {
  updatePaceDropdown();   // rebuild options for new event
  filterPaceType();       // refresh visible blocks
});



function getScottishAthleticsAgeGroup(dob) {
  if (!dob) return "—";

  // Convert DD/MM/YYYY → YYYY-MM-DD
  if (dob.includes("/")) {
    const [day, month, year] = dob.split("/");
    dob = `${year}-${month}-${day}`;
  }

  const birthDate = new Date(dob);
  if (isNaN(birthDate)) return "—";

  const today = new Date();

  // Determine the competition year:
  // If today is BEFORE 1 Oct → compYear = current year
  // If today is ON/AFTER 1 Oct → compYear = next year
  let compYear = today.getFullYear();
  const oct1 = new Date(compYear, 9, 1); // 1 Oct

  if (today >= oct1) {
    compYear += 1;
  }

  // Age on 1 October of the competition year
  const ageOnOct1 = compYear - birthDate.getFullYear();

  if (ageOnOct1 < 12) return "U12";
  if (ageOnOct1 < 14) return "U14";
  if (ageOnOct1 < 16) return "U16";
  if (ageOnOct1 < 18) return "U18";
  if (ageOnOct1 < 20) return "U20";
  return "Sen";
}
/* =========================================================
   FINAL EVENT LISTENER — PLACE AT BOTTOM OF FILE
========================================================= */

document.getElementById("calcEvent").addEventListener("change", () => {
  const event = document.getElementById("calcEvent").value;

  // Force RP as default for 5k
  if (event === "5k") {
    document.getElementById("paceType").value = "rp";
  }

  updatePaceDropdown();
  filterPaceType();
  updateDescription();
  showCorrectZones(event);
});


/* =========================================================
   PAGE LOAD INITIALIZER — FIXES EMPTY 5K DROPDOWN
========================================================= */

window.onload = () => {
  const eventSelect = document.getElementById("calcEvent");
  const paceSelect  = document.getElementById("paceType");

  // Default for 5k
  if (eventSelect.value === "5k") {
    paceSelect.value = "rp";
  }

  updatePaceDropdown();
  filterPaceType();
  updateDescription();
  showCorrectZones(eventSelect.value);
};

/* =========================================================
   INITIAL LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  loadData();          
  updateHomePage();    
  renderHomeAthleteList();   // ⭐ REQUIRED ON PAGE LOAD
  loadAthleteList();   
  updateTrainingDropdown();
  updatePBTable();
  showPage("home");    
});

document.getElementById("calcButton").addEventListener("click", () => {
  console.log("Calculate button clicked");
  calculate5kZones();
});
/* =========================================================
   RUN CALCULATOR INIT WHEN CALCULATOR PAGE IS SHOWN
========================================================= */

function initCalculator() {
  const eventSelect = document.getElementById("calcEvent");
  const paceSelect  = document.getElementById("paceType");

  if (!eventSelect || !paceSelect) return; // calculator not visible yet

  // Default for 5k
  if (eventSelect.value === "5k") {
    paceSelect.value = "rp";
  }

  updatePaceDropdown();
  filterPaceType();
  updateDescription();
  showCorrectZones(eventSelect.value);
}
