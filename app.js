// Değişkenler ve Elemanlar
let people = [];
let expenses = [];
let payments = [];

const personForm = document.getElementById("personForm");
const personInput = document.getElementById("personName");
const personList = document.getElementById("personList");
const personWarning = document.getElementById("personWarning");

const form = document.getElementById("expenseForm");
const list = document.getElementById("expenseList");
const clearBtn = document.getElementById("clearBtn");
const expenseTitle = document.getElementById("expenseTitle");

// Kişi silme modalı elemanları
const showDeleteModalBtn = document.getElementById("showDeleteModalBtn");
const deleteModal = document.getElementById("deleteModal");
const deletePersonSelect = document.getElementById("deletePersonSelect");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

// Borç/Ödeme sekmesi elemanları
const paymentForm = document.getElementById("paymentForm");
const paymentList = document.getElementById("paymentList");
const debtSummary = document.getElementById("debtSummary");

// SPA Sekme Geçişi
function showPage(pageId) {
  document.getElementById("personPage").style.display = pageId === "personPage" ? "block" : "none";
  document.getElementById("spendPage").style.display = pageId === "spendPage" ? "block" : "none";
  document.getElementById("debtPage").style.display = pageId === "debtPage" ? "block" : "none";
  document.getElementById("healthPage").style.display = pageId === "healthPage" ? "block" : "none";
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(btn => {
    if (
      (btn.textContent.includes("Kişi") && pageId === "personPage") ||
      (btn.textContent.includes("Harcama") && pageId === "spendPage") ||
      (btn.textContent.includes("Borç") && pageId === "debtPage") ||
      (btn.textContent.includes("Sağlık") && pageId === "healthPage")
    ) btn.classList.add("active");
  });
  if (pageId === "healthPage") renderCategoryAnalysis();
  if (pageId === "spendPage") updateUI();
  if (pageId === "debtPage") {
    updatePaymentsUI();
    calculateDebts();
  }
}

// LocalStorage'dan yükle
window.addEventListener("load", () => {
  const storedPeople = localStorage.getItem("people");
  if (storedPeople) people = JSON.parse(storedPeople);
  const storedExpenses = localStorage.getItem("expenses");
  if (storedExpenses) expenses = JSON.parse(storedExpenses);
  const storedPayments = localStorage.getItem("payments");
  if (storedPayments) payments = JSON.parse(storedPayments);
  updatePersonUI();
  checkPersonRequirement();
  updateUI();
  updatePaymentsUI();
  calculateDebts();
  showPage("personPage");
});

// Kişi Ekle
personForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = personInput.value.trim();
  if (!name || people.map(n=>n.toLowerCase()).includes(name.toLowerCase())) return;
  people.push(name);
  localStorage.setItem("people", JSON.stringify(people));
  personInput.value = "";
  updatePersonUI();
  checkPersonRequirement();
});

// Kişi Listesini Güncelle
function updatePersonUI() {
  personList.innerHTML = "";
  people.forEach(p => {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = p;
    nameSpan.className = "person-name";
    li.appendChild(nameSpan);
    personList.appendChild(li);
  });
  updatePersonSelectOptions();
}

// Tüm Select kutularını güncelle
function updatePersonSelectOptions() {
  const selects = [
    document.getElementById("payer"),
    document.getElementById("paidBy"),
    document.getElementById("paidTo")
  ];
  selects.forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Seçin</option>';
    people.forEach(p => {
      const option = document.createElement("option");
      option.value = p;
      option.textContent = p;
      select.appendChild(option);
    });
  });
}

// En az 2 kişi şartı
function checkPersonRequirement() {
  const forms = [form, paymentForm];
  if (people.length < 2) {
    forms.forEach(f =>
      f.querySelectorAll("input, select, button").forEach(el => (el.disabled = true))
    );
    personWarning.style.display = "block";
  } else {
    forms.forEach(f =>
      f.querySelectorAll("input, select, button").forEach(el => (el.disabled = false))
    );
    personWarning.style.display = "none";
  }
}

// Harcama Ekle
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const desc = document.getElementById("desc").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const payer = document.getElementById("payer").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value || new Date().toISOString().split("T")[0];
  if (!desc || isNaN(amount) || amount <= 0 || !payer || !category) {
    alert("Lütfen tüm alanları doğru girin.");
    return;
  }
  const expense = { id: Date.now(), desc, amount, payer, date, category };
  expenses.push(expense);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  form.reset();
  document.getElementById("category").selectedIndex = 0;
  updateUI();
  calculateDebts();
});

// Gider Listesini Güncelle
function updateUI() {
  list.innerHTML = "";
  expenseTitle.style.display = expenses.length > 0 ? "block" : "none";
  expenses.forEach(item => {
    const perPerson = (item.amount / people.length).toFixed(2);
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.payer}</strong>
      <span style="margin-left:5px;">${categoryEmoji(item.category)} ${item.category}</span>
      → ${item.desc}: ${item.amount.toFixed(2)} TL 
      (kişi başı: ${perPerson} TL)
      <br><small>📅 ${item.date}</small>
    `;
    list.appendChild(li);
  });
  // Toplam harcama ve kişi başı ortalama
  const total = expenses.reduce((sum, x) => sum + x.amount, 0);
  const avg = people.length ? (total / people.length) : 0;
  document.getElementById("totalSpent").textContent = total.toFixed(2);
  document.getElementById("avgSpent").textContent = avg.toFixed(2);
}

// Kategori Emoji
function categoryEmoji(cat) {
  switch (cat) {
    case "Yiyecek": return "🍞";
    case "İçecek": return "🥤";
    case "Kira": return "🏠";
    case "Temizlik": return "🧼";
    case "Ulaşım": return "🚗";
    case "Eğlence": return "🎉";
    case "Fatura": return "💡";
    case "Diğer": return "📦";
    default: return "";
  }
}

// Tüm kayıtları sil
clearBtn.addEventListener("click", () => {
  if (confirm("Tüm kayıtlar silinsin mi?")) {
    people = [];
    expenses = [];
    payments = [];
    localStorage.clear();
    updatePersonUI();
    updateUI();
    updatePaymentsUI();
    debtSummary.innerHTML = "";
    checkPersonRequirement();
  }
});

// Kişi Silme Modalı ve İşlevi
function deletePerson(name) {
  people = people.filter(p => p !== name);
  localStorage.setItem("people", JSON.stringify(people));
  expenses = expenses.filter(exp => exp.payer !== name);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  payments = payments.filter(pay => pay.from !== name && pay.to !== name);
  localStorage.setItem("payments", JSON.stringify(payments));
  updatePersonUI();
  updatePersonSelectOptions();
  updateUI();
  updatePaymentsUI();
  calculateDebts();
  checkPersonRequirement();
}

// Modal eventleri
showDeleteModalBtn.addEventListener("click", () => {
  deletePersonSelect.innerHTML = "";
  people.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    deletePersonSelect.appendChild(opt);
  });
  deleteModal.style.display = "flex";
});
confirmDeleteBtn.addEventListener("click", () => {
  const name = deletePersonSelect.value;
  if (!name) return;
  if (confirm(`"${name}" adlı kişiyi ve tüm kayıtlarını silmek istediğinizden emin misiniz?`)) {
    deletePerson(name);
    deleteModal.style.display = "none";
  }
});
cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.style.display = "none";
});
deleteModal.addEventListener("click", (e) => {
  if (e.target === deleteModal) deleteModal.style.display = "none";
});

// === Borç & Ödeme ===
paymentForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const from = document.getElementById("paidBy").value;
  const to = document.getElementById("paidTo").value;
  const amount = parseFloat(document.getElementById("paymentAmount").value);
  const date = document.getElementById("paymentDate").value || new Date().toISOString().split("T")[0];
  if (!from || !to || from === to || isNaN(amount) || amount <= 0) {
    alert("Geçerli bir ödeme bilgisi girin.");
    return;
  }
  payments.push({ from, to, amount, date });
  localStorage.setItem("payments", JSON.stringify(payments));
  paymentForm.reset();
  updatePaymentsUI();
  calculateDebts();
});

function updatePaymentsUI() {
  paymentList.innerHTML = "";
  if (payments.length === 0) {
    paymentList.innerHTML = "<li>Henüz ödeme kaydı yok.</li>";
    return;
  }
  payments.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${p.from}</strong> → <strong>${p.to}</strong>: ${p.amount.toFixed(2)} TL <small>📅 ${p.date}</small>`;
    paymentList.appendChild(li);
  });
}

function calculateDebts() {
  const debts = {};
  people.forEach(p1 => {
    debts[p1] = {};
    people.forEach(p2 => {
      if (p1 !== p2) debts[p1][p2] = 0;
    });
  });
  expenses.forEach(exp => {
    const share = exp.amount / people.length;
    people.forEach(p => {
      if (p !== exp.payer) debts[p][exp.payer] += share;
    });
  });
  payments.forEach(pay => {
    if (debts[pay.from] && debts[pay.from][pay.to] !== undefined) {
      debts[pay.from][pay.to] -= pay.amount;
      if (debts[pay.from][pay.to] < 0) {
        const extra = -debts[pay.from][pay.to];
        debts[pay.from][pay.to] = 0;
        debts[pay.to][pay.from] += extra;
      }
    }
  });
  people.forEach(p1 => {
    people.forEach(p2 => {
      if (p1 !== p2) {
        const offset = Math.min(debts[p1][p2], debts[p2][p1]);
        debts[p1][p2] -= offset;
        debts[p2][p1] -= offset;
      }
    });
  });
  const summary = [];
  people.forEach(from => {
    people.forEach(to => {
      const amount = debts[from][to];
      if (from !== to && amount > 0.01) {
        summary.push(`${from} → ${to}: ${amount.toFixed(2)} TL`);
      }
    });
  });
  debtSummary.innerHTML =
    `<h3>🧾 Borç Özeti</h3>` +
    (summary.length ? summary.join("<br>") : "Kimsenin kimseden borcu veya alacağı yok.");
}

// === Finansal Sağlık Analiz & Grafikler ===
google.charts.load('current', {'packages':['corechart']});

function renderCategoryAnalysis() {
  // Kategorileri topla
  const catTotals = {};
  let total = 0;
  expenses.forEach(exp => {
    if (!catTotals[exp.category]) catTotals[exp.category] = 0;
    catTotals[exp.category] += exp.amount;
    total += exp.amount;
  });

  // Tabloyu yaz
  let html = "<table style='margin:auto;'><tr><th style='text-align:left'>Kategori</th><th style='text-align:right'>Tutar (TL)</th><th>%</th></tr>";
  Object.keys(catTotals).forEach(cat => {
    const percent = total ? (catTotals[cat] / total * 100).toFixed(1) : 0;
    html += `<tr><td>${categoryEmoji(cat)} ${cat}</td><td style='text-align:right'>${catTotals[cat].toFixed(2)}</td><td style='text-align:right'>${percent}%</td></tr>`;
  });
  html += "</table>";
  document.getElementById("categorySummary").innerHTML = html;

  // Google Charts ile pasta grafik
  google.charts.setOnLoadCallback(drawChart);
  function drawChart() {
    const dataArr = [['Kategori', 'Tutar']];
    Object.keys(catTotals).forEach(cat => {
      dataArr.push([cat, catTotals[cat]]);
    });
    const data = google.visualization.arrayToDataTable(dataArr);
    const options = {
      pieHole: 0.4,
      legend: { position: 'right' },
      chartArea: { width: '80%', height: '80%' }
    };
    const chart = new google.visualization.PieChart(document.getElementById('categoryChart'));
    chart.draw(data, options);
  }

  // --- Aylık Harcama Trend Grafiği ---
  drawTrendChart();
}

function drawTrendChart() {
  const monthlyTotals = {};
  expenses.forEach(exp => {
    const d = new Date(exp.date);
    if (isNaN(d)) return;
    const yearMonth = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
    if (!monthlyTotals[yearMonth]) monthlyTotals[yearMonth] = 0;
    monthlyTotals[yearMonth] += exp.amount;
  });
  const sortedMonths = Object.keys(monthlyTotals).sort();
  const dataArr = [['Ay', 'Toplam Harcama']];
  sortedMonths.forEach(m => dataArr.push([m, monthlyTotals[m]]));
  if (dataArr.length > 1) {
    const data = google.visualization.arrayToDataTable(dataArr);
    const options = {
      legend: { position: 'bottom' },
      chartArea: { width: '80%', height: '70%' },
      hAxis: { title: 'Ay' },
      vAxis: { title: 'TL' },
      pointSize: 5,
      colors: ['#048628'],
    };
    const chart = new google.visualization.LineChart(document.getElementById('trendChart'));
    chart.draw(data, options);
  } else {
    document.getElementById('trendChart').innerHTML = "<div style='text-align:center;color:#888'>Henüz aylık veri yok.</div>";
  }
}
