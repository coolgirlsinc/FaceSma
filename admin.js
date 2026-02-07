import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const ADMIN_PASSWORD = "1234";

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

const loginBox = document.getElementById("login");
const panel = document.getElementById("panel");
const list = document.getElementById("list");
let peopleData = {};

document.getElementById("loginBtn").onclick = () => {
  if (document.getElementById("password").value !== ADMIN_PASSWORD) {
    alert("Wrong password");
    return;
  }
  loginBox.style.display = "none";
  panel.style.display = "block";
  loadData();
  loadGeoData(); // 🔥 НОВОЕ - гео трекинг
};

function loadData() {
  onValue(ref(db, "people"), snapshot => {
    list.innerHTML = "";
    peopleData = {};

    if (!snapshot.exists()) {
      list.innerHTML = "<h3>📸 Photos</h3><p>No uploads</p>";
      return;
    }

    // 🔥 Заголовок для фото
    const photoHeader = document.createElement('h3');
    photoHeader.textContent = '📸 Photos (' + snapshot.numChildren() + ')';
    list.appendChild(photoHeader);

    snapshot.forEach(child => {
      const p = child.val();
      const id = child.key;
      peopleData[id] = p;

      const div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        <img src="${p.img}">
        <div class="info">
          <b>${p.text}</b><br>
          Votes: ${p.votes || 0}<br>
          ${new Date(p.createdAt).toLocaleString()}
        </div>
        <button class="delete">❌ Delete</button>
      `;

      div.querySelector(".delete").onclick = () => {
        if (!confirm("Delete this photo?")) return;
        remove(ref(db, "people/" + id));
      };

      list.appendChild(div);
    });
  });
}

// 🔥 НОВОЕ - Загрузка СКРЫТЫХ GEO данных
function loadGeoData() {
  onValue(ref(db, "admin/geo"), snapshot => {
    if (!snapshot.exists()) return;

    const geoHeader = document.createElement('h3');
    geoHeader.innerHTML = '🕵️ Geo Tracking (' + snapshot.numChildren() + ' records)';
    geoHeader.style.marginTop = '40px';
    list.appendChild(geoHeader);

    const geoContainer = document.createElement('div');
    geoContainer.id = 'geo-list';

    snapshot.forEach(child => {
      const g = child.val();
      const div = document.createElement("div");
      div.className = "item geo-item";
      
      div.innerHTML = `
        <div class="info">
          <b>${g.action?.toUpperCase()}</b><br>
          💻 <span class="ip">${g.ip}</span><br>
          📍 ${g.city || 'N/A'}, ${g.country || 'N/A'}<br>
          🕒 ${new Date(g.timestamp).toLocaleString()}<br>
          <small>${g.region || ''}</small>
        </div>
      `;
      
      geoContainer.appendChild(div);
    });
    
    list.appendChild(geoContainer);
  });
}

document.getElementById("deleteByText").onclick = () => {
  const text = document.getElementById("searchText").value.trim().toLowerCase();
  if (!text) {
    alert("Enter text to delete");
    return;
  }

  const idsToDelete = Object.entries(peopleData)
    .filter(([id, p]) => p.text.toLowerCase() === text)
    .map(([id]) => id);

  if (idsToDelete.length === 0) {
    alert("No photos found with this text");
    return;
  }

  if (!confirm(`Delete ${idsToDelete.length} photo(s) with text "${text}"?`)) return;

  idsToDelete.forEach(id => remove(ref(db, "people/" + id)));
};