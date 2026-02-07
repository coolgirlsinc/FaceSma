import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* 🔥 Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyAq0TW99q5QXU6AyrCO4m7pu-N4zPDlsQE",
  authDomain: "ratemerigaimage.firebaseapp.com",
  databaseURL: "https://ratemerigaimage-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "ratemerigaimage",
  storageBucket: "ratemerigaimage.appspot.com",
  messagingSenderId: "438635126104",
  appId: "1:438635126104:web:5723fb25ff663c5bcf192d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* 🧠 LOCAL STATE */
let people = [];
let currentPair = [];
let hasInitialPair = false;

/* 📅 TODAY RANGE */
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);
const todayTimestamp = startOfToday.getTime();

/* =========================
   📤 UPLOAD
========================= */
window.upload = function () {
  const file = photoInput.files[0];
  const text = textInput.value.trim();
  const consent = document.getElementById("consent").checked;

  if (!file || !text || !consent) {
    alert("Fill all fields and agree");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    push(ref(db, "people"), {
      img: e.target.result,
      text,
      votes: 0,
      createdAt: Date.now()
    });

    photoInput.value = "";
    textInput.value = "";
    consent.checked = false;
  };

  reader.readAsDataURL(file);
};

/* =========================
   📥 REALTIME DATA (NO UI SIDE EFFECTS)
========================= */
onValue(ref(db, "people"), snapshot => {
  people = [];
  snapshot.forEach(child => {
    people.push({ id: child.key, ...child.val() });
  });

  updateTopAll();
  updateTopToday();

  // 🔑 создаём пару ТОЛЬКО один раз
  if (!hasInitialPair && people.length >= 2) {
    renderPair();
    hasInitialPair = true;
  }
});

/* =========================
   🎲 LOCAL PAIR ONLY
========================= */
function renderPair() {
  if (people.length < 2) return;

  let a, b;
  do {
    a = people[Math.floor(Math.random() * people.length)];
    b = people[Math.floor(Math.random() * people.length)];
  } while (a.id === b.id);

  currentPair = [a, b];

  img1.src = a.img;
  img2.src = b.img;
  text1.textContent = a.text;
  text2.textContent = b.text;
  rating1.textContent = "Votes: " + a.votes;
  rating2.textContent = "Votes: " + b.votes;
}

/* =========================
   🗳 VOTE (LOCAL ACTION)
========================= */
window.vote = function (index) {
  const winner = currentPair[index];

  update(ref(db, "people/" + winner.id), {
    votes: (winner.votes || 0) + 1
  });

  // 🔒 локально обновляем
  winner.votes++;
  renderPair();
};

/* =========================
   🏆 TOP ALL TIME
========================= */
function updateTopAll() {
  top5.innerHTML = "";

  [...people]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)
    .forEach((p, i) => {
      top5.innerHTML += `
        <div class="top-item">
          <img src="${p.img}">
          <span>${i + 1}. ${p.text} — ${p.votes} votes</span>
        </div>
      `;
    });
}

/* =========================
   🔥 TOP TODAY (BY UPLOAD DATE)
========================= */
function updateTopToday() {
  topToday.innerHTML = "";

  [...people]
    .filter(p => p.createdAt >= todayTimestamp)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)
    .forEach((p, i) => {
      topToday.innerHTML += `
        <div class="top-item">
          <img src="${p.img}">
          <span>${i + 1}. ${p.text} — ${p.votes} votes</span>
        </div>
      `;
    });
}
