let people = JSON.parse(localStorage.getItem("people")) || [];
let currentPair = [];
let lastPair = [];

/* 💾 save */
function save() {
  localStorage.setItem("people", JSON.stringify(people));
}

/* ⛔ блок Enter и Shift+Enter */
const textInput = document.getElementById("textInput");
textInput.addEventListener("keydown", e => {
  if (e.key === "Enter") e.preventDefault();
});

/* 📤 upload */
function upload() {
  const file = document.getElementById("photoInput").files[0];
  const text = textInput.value.trim();
  const consent = document.getElementById("consent").checked;

  if (!file || !text || !consent) {
    alert("Fill all fields and agree");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    people.push({
      id: crypto.randomUUID(),
      img: reader.result,
      text,
      votes: 0
    });

    save();
    resetPairs();
    renderAll();

    textInput.value = "";
    photoInput.value = "";
    consent.checked = false;
  };
  reader.readAsDataURL(file);
}

function resetPairs() {
  currentPair = [];
  lastPair = [];
}

function getRandomIndex(exclude = []) {
  let idx;
  let tries = 0;
  do {
    idx = Math.floor(Math.random() * people.length);
    tries++;
  } while (exclude.includes(idx) && tries < 100);
  return idx;
}

/* 🆚 show pair */
function showPair() {
  if (people.length < 2) return;

  let a, b;
  do {
    a = getRandomIndex(lastPair);
    b = getRandomIndex([a, ...lastPair]);
  } while (a === b);

  currentPair = [a, b];
  lastPair = [a, b];

  img1.src = people[a].img;
  img2.src = people[b].img;
  text1.textContent = people[a].text;
  text2.textContent = people[b].text;
  rating1.textContent = "Votes: " + people[a].votes;
  rating2.textContent = "Votes: " + people[b].votes;
}

/* 👍 vote */
function vote(winnerIndex) {
  if (!currentPair.length) return;

  people[currentPair[winnerIndex]].votes++;
  save();
  resetPairs();
  renderAll();
}

/* 🏆 top 5 */
function updateTop5() {
  const top = document.getElementById("top5");
  top.innerHTML = "";

  [...people]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)
    .forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "top-item";
      div.innerHTML = `
        <img src="${p.img}">
        <span>${i + 1}. ${p.text} — ${p.votes} votes</span>
      `;
      top.appendChild(div);
    });
}

function renderAll() {
  showPair();
  updateTop5();
}

/* INIT */
renderAll();
