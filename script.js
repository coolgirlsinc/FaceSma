import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  update
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

/* 🔌 Init */
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* 🧠 State */
let people = [];
let currentPair = [];

/* 🗳 Local memory */
let votedIds = JSON.parse(localStorage.getItem("votedIds") || "[]");
let lastSideById = JSON.parse(localStorage.getItem("lastSideById") || "{}");

/* 📤 Upload */
function upload() {
  const file = photoInput.files[0];
  const text = textInput.value.trim();
  const consent = document.getElementById("consent").checked;

  if (!file || !text || !consent) {
    alert("Fill all fields and agree");
    return;
  }

  const img = new Image();
  const reader = new FileReader();

  reader.onload = e => (img.src = e.target.result);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const MAX_WIDTH = 300;
    const scale = MAX_WIDTH / img.width;

    canvas.width = MAX_WIDTH;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL("image/webp", 0.5);

    const newRef = push(ref(db, "people"), {
      img: compressed,
      text,
      votes: 0,
      createdAt: Date.now()
    });

    // 🔥 VIRAL HOOK
    showShareBox(newRef.key);
  };

  reader.readAsDataURL(file);
}

/* 🔗 Share box (FAKE ranking for now) */
function showShareBox(userId) {
  const link = `${window.location.origin}/?ref=${userId}`;

  const box = document.createElement("div");
  box.className = "share-box";
  box.innerHTML = `
    <h3>You are now in the rating pool.</h3>
    <p>Share this link with friends to see how you rank.</p>
    <input type="text" id="shareLink" value="${link}" readonly>
    <br>
    <button onclick="copyLink()">Copy Link</button>
  `;

  document.querySelector(".upload").appendChild(box);
}

/* 📋 Copy */
function copyLink() {
  const input = document.getElementById("shareLink");
  input.select();
  document.execCommand("copy");
  alert("Link copied!");
}

/* 📥 Load people */
onValue(ref(db, "people"), snapshot => {
  people = [];
  snapshot.forEach(child => {
    people.push({ id: child.key, ...child.val() });
  });

  showPair();
  updateTop5();
});

/* 🔀 Shuffle */
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/* 🎯 Pair logic */
function getNextPair() {
  let available = people.filter(p => !votedIds.includes(p.id));
  if (available.length < 2) available = [...people];
  if (available.length < 2) return null;

  const shuffled = shuffle([...available]);
  return [shuffled[0], shuffled[1]];
}

/* 🖼 Show pair (strict side alternation) */
function showPair() {
  const pair = getNextPair();
  if (!pair) return;

  let left = pair[0];
  let right = pair[1];

  if (lastSideById[left.id] === "left") {
    [left, right] = [right, left];
  }

  currentPair = [left, right];

  lastSideById[left.id] = "left";
  lastSideById[right.id] = "right";
  localStorage.setItem("lastSideById", JSON.stringify(lastSideById));

  img1.src = left.img;
  img2.src = right.img;
  text1.textContent = left.text;
  text2.textContent = right.text;
}

/* 🗳 Vote */
function vote(index) {
  const winner = currentPair[index];

  votedIds.push(currentPair[0].id, currentPair[1].id);
  votedIds = [...new Set(votedIds)];
  localStorage.setItem("votedIds", JSON.stringify(votedIds));

  update(ref(db, "people/" + winner.id), {
    votes: (winner.votes || 0) + 1
  });

  showPair();
  updateTop5();
}

/* 🏆 Top 5 */
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

/* 🌍 Expose */
window.upload = upload;
window.vote = vote;
window.copyLink = copyLink;
