import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

let people = [];
let queue = [];      // 🔥 очередь без повторов
let currentPair = [];

/* 📤 Upload + compression */
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

  reader.onload = e => img.src = e.target.result;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const MAX_WIDTH = 500;
    const scale = MAX_WIDTH / img.width;

    canvas.width = MAX_WIDTH;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL("image/jpeg", 0.6);

    push(ref(db, "people"), { img: compressed, text, votes: 0 });
  };

  reader.readAsDataURL(file);
  textInput.value = "";
  photoInput.value = "";
  consent.checked = false;
}

/* 📥 Load people */
onValue(ref(db, "people"), snapshot => {
  people = [];
  snapshot.forEach(child => {
    people.push({ id: child.key, ...child.val() });
  });
  resetQueue();
  renderAll();
});

/* 🔀 Перемешать массив */
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

/* 🔄 Создать новую очередь */
function resetQueue() {
  queue = shuffle([...people]);
}

/* 🎲 Взять следующую уникальную пару */
function getNextPair() {
  if (queue.length < 2) {
    resetQueue(); // когда закончились — начинаем новый круг
  }
  return [queue.shift(), queue.shift()];
}

/* 🖼 Показать пару */
function showPair() {
  if (people.length < 2) return;

  currentPair = getNextPair();

  img1.src = currentPair[0].img;
  img2.src = currentPair[1].img;
  text1.textContent = currentPair[0].text;
  text2.textContent = currentPair[1].text;
  rating1.textContent = "Votes: " + currentPair[0].votes;
  rating2.textContent = "Votes: " + currentPair[1].votes;
}

/* 👍 Vote */
function vote(index) {
  const winner = currentPair[index];
  update(ref(db, "people/" + winner.id), {
    votes: winner.votes + 1
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

function renderAll() {
  showPair();
  updateTop5();
}

window.upload = upload;
window.vote = vote;
