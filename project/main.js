const API_KEY = '26dfb90d3a7a475f8e65fe62c04f4632';
const SCHOOL_CODE = '7530633';
const OFFICE_CODE = 'J10';

let lostItems = [];
let isAdmin = false;

function formatDate(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';

  if (tabId === 'meal-tab') fetchMealData('today');
  if (tabId === 'timetable-tab') fetchTimetableBySelection();
}

function fetchMealData(type = 'today') {
  let targetDate = new Date();
  if (type === 'tomorrow') targetDate.setDate(targetDate.getDate() + 1);
  else if (type instanceof Date) targetDate = type;

  const dateString = formatDate(targetDate);
  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${dateString}&Type=json`;

  document.getElementById("meal-container").innerText = "불러오는 중...";

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const mealInfo = data?.mealServiceDietInfo?.[1]?.row?.[0]?.DDISH_NM;
      const menu = mealInfo ? mealInfo.replace(/<br\/>/g, '\n') : "급식 정보 없음";
      document.getElementById("meal-container").innerText = menu;
    })
    .catch(err => {
      console.error("급식 API 에러:", err);
      document.getElementById("meal-container").innerText = "급식 정보를 불러올 수 없습니다.";
    });
}

function fetchMealBySelectedDate() {
  const dateInput = document.getElementById("meal-date").value;
  if (!dateInput) return alert("날짜를 선택해주세요.");
  fetchMealData(new Date(dateInput));
}

function fetchTimetable(date = new Date(), grade = '3', className = '2') {
  const dateString = formatDate(date);
  const url = `https://open.neis.go.kr/hub/hisTimetable?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&ALL_TI_YMD=${dateString}&GRADE=${grade}&CLASS_NM=${className}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const timetable = data?.hisTimetable?.[1]?.row;
      const container = document.getElementById("timetable-container");
      container.innerHTML = '';

      if (!timetable || timetable.length === 0) {
        container.innerText = "시간표 정보가 없습니다.";
        return;
      }

      const table = document.createElement('table');
      table.innerHTML = "<tr><th>교시</th><th>과목</th></tr>";
      timetable.forEach(item => {
        table.innerHTML += `<tr><td>${item.PERIO}</td><td>${item.ITRT_CNTNT}</td></tr>`;
      });
      container.appendChild(table);
    })
    .catch(err => {
      console.error("시간표 API 에러:", err);
      document.getElementById("timetable-container").innerText = "시간표 정보를 불러올 수 없습니다.";
    });
}

function fetchTimetableBySelection() {
  const grade = document.getElementById("grade").value;
  const classNum = document.getElementById("class").value;
  fetchTimetable(new Date(), grade, classNum);
}

function toggleAdmin() {
  const input = document.getElementById("admin-pass");
  if (input.style.display === 'none') {
    input.style.display = 'inline-block';
  } else {
    const pw = input.value.trim();
    if (pw === 'admin123') {
      isAdmin = true;
      input.style.display = 'none';
      input.value = '';
      alert("관리자 모드 활성화됨");
      renderLostItems();
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  }
}

function renderLostItems() {
  const list = document.getElementById('lost-items-list');
  list.innerHTML = '';
  const today = new Date().toISOString().slice(0, 10);
  const todayItems = lostItems.filter(item => item.date === today);

  if (todayItems.length === 0) {
    list.innerHTML = '<li>등록된 분실물이 없습니다.</li>';
    return;
  }

  todayItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.name}</strong> - ${item.location}<br/>
      특징: ${item.desc}<br/>
      <img src="${item.image}" alt="분실물 이미지" style="width:100px;"/><br/>
      연락처: ${item.contact}
    `;
    if (isAdmin) {
      const btn = document.createElement('button');
      btn.textContent = '삭제';
      btn.className = 'delete-btn';
      btn.onclick = () => {
        if (confirm("정말 삭제하시겠습니까?")) {
          lostItems.splice(index, 1);
          renderLostItems();
        }
      };
      li.appendChild(btn);
    }
    list.appendChild(li);
  });
}

function initializeLostModule() {
  const form = document.getElementById('lost-item-form');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = form['item-name'].value.trim();
    const location = form['item-location'].value.trim();
    const desc = form['item-desc'].value.trim();
    const contact = form['contact-info'].value.trim();
    const file = form['item-image'].files[0];

    if (!file) return alert("이미지를 첨부해주세요.");

    const reader = new FileReader();
    reader.onload = () => {
      lostItems.push({ name, location, desc, contact, image: reader.result, date: new Date().toISOString().slice(0, 10) });
      renderLostItems();
      form.reset();
    };
    reader.readAsDataURL(file);
  });
}

function initializeBoard() {
  const form = document.getElementById("post-form");
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const title = document.getElementById("post-title").value.trim();
    const content = document.getElementById("post-content").value.trim();
    if (title && content) {
      const postHTML = `
        <div class="post">
          <h3>${title}</h3>
          <p>${content}</p>
          <div class="comments">
            <input type="text" placeholder="댓글 입력" class="comment-input" />
            <button class="comment-btn">댓글 달기</button>
            <ul class="comment-list"></ul>
          </div>
        </div>`;
      document.getElementById("post-list").innerHTML += postHTML;
      form.reset();
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('comment-btn')) {
      const input = e.target.previousElementSibling;
      const list = e.target.nextElementSibling;
      const text = input.value.trim();
      if (text) {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
        input.value = '';
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeLostModule();
  initializeBoard();
  document.getElementById('meal-date').valueAsDate = new Date();
  showTab('lost-tab');
});
