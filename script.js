import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  update,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* 🔥 Firebase config */
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
let lastSideById = {};

/* =========================
   📤 UPLOAD
========================= */
function upload() {
  const file = photoInput.files[0];
  const text = textInput.value.trim();
  const consent = document.getElementById("consent").checked;

  if (!file || !text || !consent) {
    alert("Fill all fields and agree");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const imgData = e.target.result;

    const newRef = push(ref(db, "people"), {
      img: imgData,
      text,
      votes: 0,
      createdAt: Date.now()
    });

    showShareBox(newRef.key);
  };

  reader.readAsDataURL(file);
}

/* =========================
   🔗 SHARE BOX
========================= */
function showShareBox(userId) {
  const link = `${window.location.origin}/?ref=${userId}`;

  const box = document.createElement("div");
  box.className = "share-box";
  box.innerHTML = `
    <h3>You are now in the rating pool.</h3>
    <p>Share this link with friends to see how you rank.</p>
    <input id="shareLink" value="${link}" readonly>
    <button onclick="copyLink()">Copy Link</button>
  `;

  document.querySelector(".upload").appendChild(box);
}

function copyLink() {
  const input = document.getElementById("shareLink");
  input.select();
  document.execCommand("copy");
  alert("Link copied!");
}

/* =========================
   📥 LOAD PEOPLE (ONCE)
========================= */
async function loadPeopleOnce() {
  const snapshot = await get(ref(db, "people"));
  people = [];

  snapshot.forEach(child => {
    people.push({ id: child.key, ...child.val() });
  });

  renderPair();
  updateTop5();
}

loadPeopleOnce();

/* =========================
   🏆 LIVE TOP 5 ONLY
========================= */
onValue(ref(db, "people"), snapshot => {
  people = [];
  snapshot.forEach(child => {
    people.push({ id: child.key, ...child.val() });
  });
  updateTop5(); // ❗ без renderPair
});

/* =========================
   🎲 PAIRS (LOCAL)
========================= */
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function getRandomPair() {
  if (people.length < 2) return null;
  const s = shuffle([...people]);
  return [s[0], s[1]];
}

function renderPair() {
  const pair = getRandomPair();
  if (!pair) return;

  let [left, right] = pair;

  // строгая смена сторон
  if (lastSideById[left.id] === "left") {
    [left, right] = [right, left];
  }

  lastSideById[left.id] = "left";
  lastSideById[right.id] = "right";

  img1.src = left.img;
  img2.src = right.img;
  text1.textContent = left.text;
  text2.textContent = right.text;

  currentPair = [left, right];
}

/* =========================
   🗳 VOTE
========================= */
function vote(index) {
  const winner = currentPair[index];

  update(ref(db, "people/" + winner.id), {
    votes: (winner.votes || 0) + 1
  });

  winner.votes++; // локально
  renderPair();   // ❗ только для этого пользователя
}

/* =========================
   🏆 TOP 5
========================= */
function updateTop5() {
  const top = document.getElementById("top5");
  top.innerHTML = "";

  [...people]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)
    .forEach((p, i) => {
      top.innerHTML += `
        <div class="top-item">
          <img src="${p.img}">
          <span>${i + 1}. ${p.text} — ${p.votes} votes</span>
        </div>
      `;
    });
}

/* =========================
   🌍 EXPOSE
========================= */
window.upload = upload;
window.vote = vote;
window.copyLink = copyLink;
