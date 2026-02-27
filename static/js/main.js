// ── Chart instances ───────────────────────────────────────
let barChart   = null;
let donutChart = null;

// ── Form submit ───────────────────────────────────────────
document.getElementById('predictionForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('predictBtn');
  btn.classList.add('loading');
  btn.querySelector('.btn-text').textContent = 'Analysing…';

  const formData = {
    pregnancies:       document.getElementById('pregnancies').value,
    glucose:           document.getElementById('glucose').value,
    blood_pressure:    document.getElementById('blood_pressure').value,
    skin_thickness:    document.getElementById('skin_thickness').value,
    insulin:           document.getElementById('insulin').value,
    bmi:               document.getElementById('bmi').value,
    diabetes_pedigree: document.getElementById('diabetes_pedigree').value,
    age:               document.getElementById('age').value,
  };

  try {
    const res    = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await res.json();
    renderResults(result);
  } catch (err) {
    alert('Prediction failed. Make sure the Flask server is running.');
    console.error(err);
  } finally {
    btn.classList.remove('loading');
    btn.querySelector('.btn-text').textContent = 'Run Prediction';
  }
});

// ── Render results ────────────────────────────────────────
function renderResults(r) {
  // Show results panel
  document.getElementById('placeholder').style.display     = 'none';
  document.getElementById('resultsContent').style.display  = 'block';

  // ── Verdict ──────────────────────────────────────────────
  const isDiabetic = r.prediction_code === 1;
  document.getElementById('verdictIcon').textContent = isDiabetic ? '⚠️' : '✅';
  const vt = document.getElementById('verdictText');
  vt.textContent  = r.prediction;
  vt.className    = 'verdict-text ' + (isDiabetic ? 'diabetic' : 'non-diabetic');

  // Confidence bar — fill = diabetic probability
  const fill   = document.getElementById('confFill');
  const marker = document.getElementById('confMarker');
  const pct    = r.prob_diabetic;
  fill.style.width    = pct + '%';
  marker.style.left   = pct + '%';

  document.getElementById('confNonDiabetic').textContent = r.prob_non_diabetic + '%';
  document.getElementById('confDiabetic').textContent    = r.prob_diabetic + '%';

  // Verdict card border colour
  const vc = document.getElementById('verdictCard');
  vc.style.borderLeftColor = isDiabetic ? '#ef4444' : '#22c55e';

  // ── Risk ──────────────────────────────────────────────────
  const badge = document.getElementById('riskBadge');
  badge.textContent  = r.risk_level;
  badge.style.color  = r.risk_color;
  document.getElementById('riskRec').textContent = r.recommendation;

  // ── Charts ────────────────────────────────────────────────
  renderBarChart(r.model_probs);
  renderDonutChart(r.prob_diabetic, r.prob_non_diabetic);
}

// ── Bar chart ─────────────────────────────────────────────
function renderBarChart(modelProbs) {
  const labels = Object.keys(modelProbs);
  const values = Object.values(modelProbs);

  const colors = labels.map(l =>
    l === 'Voting Classifier'
      ? 'rgba(59,130,246,0.9)'
      : 'rgba(99,102,241,0.7)'
  );
  const borders = labels.map(l =>
    l === 'Voting Classifier' ? '#3b82f6' : '#6366f1'
  );

  if (barChart) barChart.destroy();

  const ctx = document.getElementById('barChart').getContext('2d');
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` Diabetic prob: ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        y: {
          min: 0, max: 100,
          ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => v + '%' },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        x: {
          ticks: { color: '#94a3b8', font: { size: 11 } },
          grid: { display: false },
        }
      }
    }
  });
}

// ── Donut chart ───────────────────────────────────────────
function renderDonutChart(diabetic, nonDiabetic) {
  if (donutChart) donutChart.destroy();

  document.getElementById('donutCenter').textContent = diabetic + '%';

  const ctx = document.getElementById('donutChart').getContext('2d');
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Diabetic', 'Non-Diabetic'],
      datasets: [{
        data: [diabetic, nonDiabetic],
        backgroundColor: ['rgba(239,68,68,0.85)', 'rgba(34,197,94,0.75)'],
        borderColor: ['#ef4444', '#22c55e'],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8', font: { size: 11 },
            padding: 12, usePointStyle: true,
          }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` }
        }
      }
    }
  });
}
