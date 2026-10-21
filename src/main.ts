import type { CycleLog, PhaseKey } from './types';
import { PHASES } from './types';
import { loadLogs, saveLogs, loadTheme, saveTheme } from './storage';
import { exportData as exportToFile, importData as importFromFile } from './fileio';

// === State ===
let logs: CycleLog[] = [];
let currentPhaseKey: PhaseKey = 'MENSTRUAL';
let currentYear = new Date().getFullYear();
let mobMonth = new Date().getMonth();
let mobYear = new Date().getFullYear();

// === Helpers ===
const $ = (id: string): HTMLElement => document.getElementById(id)!;
const $input = (id: string): HTMLInputElement => document.getElementById(id) as HTMLInputElement;
const $select = (id: string): HTMLSelectElement => document.getElementById(id) as HTMLSelectElement;

function showToast(msg: string, isErr = false): void {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = msg;
  t.style.background = isErr ? '#c72a4f' : '#1b2b4e';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Ongoing';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

// === Persistence ===
async function save(): Promise<void> {
  await saveLogs(logs);
  updateUI();
  initYearSelector();
  if ($('view-calendar').classList.contains('active')) renderCalendar();
}

// === Calendar / periods ===
function getPeriodDaySet(): Set<string> {
  const s = new Set<string>();
  logs.forEach(l => {
    const end = l.end
    ? new Date(l.end + 'T00:00:00')
    : l.trackedEnd
    ? new Date(l.trackedEnd + 'T00:00:00')
    : new Date(l.start + 'T00:00:00');
    const cur = new Date(l.start + 'T00:00:00');
    while (cur <= end) {
      s.add(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return s;
}

function getActivePeriod(): CycleLog | undefined {
  return logs.find(l => !l.end);
}

function deleteEntry(id: number): void {
  logs = logs.filter(l => l.id !== id);
  void save();
  showToast('Removed');
}

function deletePeriodByStartDate(startDate: string): boolean {
  const index = logs.findIndex(l => l.start === startDate);
  if (index === -1) return false;
  logs.splice(index, 1);
  void save();
  showToast(`🗑️ Period starting ${formatDate(startDate)} deleted.`);
  return true;
}

function reactivatePeriodByEndDate(endDate: string): boolean {
  const period = logs.find(l => l.end === endDate);
  if (!period) return false;
  period.end = null;
  period.trackedEnd = endDate;
  void save();
  showToast(`↩️ Period reactivated (end date ${formatDate(endDate)} removed).`);
  return true;
}

function handleDayTap(dateStr: string): void {
  if (logs.some(l => l.start === dateStr)) {
    deletePeriodByStartDate(dateStr);
    return;
  }
  if (logs.some(l => l.end === dateStr)) {
    reactivatePeriodByEndDate(dateStr);
    return;
  }
  const active = getActivePeriod();
  if (!active) {
    logs.unshift({ id: Date.now(), start: dateStr, end: null, trackedEnd: dateStr });
    void save();
    showToast(`✨ Period started on ${formatDate(dateStr)} — tap later/earlier days to adjust.`);
    return;
  }
  const startDate = active.start;
  const currentLast = active.trackedEnd || active.start;

  if (dateStr < startDate) {
    showToast('Cannot track before period start', true);
    return;
  }

  if (dateStr === currentLast) {
    if (active.end === dateStr) {
      active.end = null;
      active.trackedEnd = dateStr;
      void save();
      showToast(`↩️ Period active again (ended on ${formatDate(dateStr)} removed).`);
    } else {
      active.end = dateStr;
      delete active.trackedEnd;
      void save();
      showToast(`✅ Period ended on ${formatDate(dateStr)}. Tap this day again to reactivate.`);
    }
    return;
  }

  if (dateStr > currentLast) {
    if (active.end) {
      showToast('Period is already ended. Tap its start date to delete, or tap the end date to reactivate.', true);
      return;
    }
    active.trackedEnd = dateStr;
    void save();
    showToast(`📆 Extended to ${formatDate(dateStr)}.`);
    return;
  }

  if (dateStr > startDate && dateStr < currentLast) {
    if (active.end) {
      showToast('Cannot modify an ended period. Tap end date to reactivate first.', true);
      return;
    }
    active.trackedEnd = dateStr;
    void save();
    showToast(`✂️ Shortened period to ${formatDate(dateStr)}. Tap this day again to end.`);
    return;
  }

  showToast('Invalid action', true);
}

// === Mobile calendar ===
function renderMobileCalendar(): void {
  const grid = $('mobCalGrid');
  const title = $('mobCalTitle');
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  title.textContent = `${monthNames[mobMonth]} ${mobYear}`;
  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const periodDays = getPeriodDaySet();
  const active = getActivePeriod();
  const lastTracked = active && !active.end ? active.trackedEnd ?? null : null;
  const today = new Date().toISOString().split('T')[0];

  let html = days.map(d => `<div class="mob-cal-header">${d}</div>`).join('');
  const firstDay = new Date(mobYear, mobMonth, 1).getDay();
  const daysInMonth = new Date(mobYear, mobMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) html += `<div class="mob-cal-day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${mobYear}-${String(mobMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isStart = logs.some(l => l.start === dateStr);
    const isEnd = logs.some(l => l.end === dateStr);
    const inPeriod = periodDays.has(dateStr);

    let cls = 'mob-cal-day';
    if (isStart) cls += ' active-start';
    else if (isEnd) cls += ' active-end';
    else if (inPeriod) cls += ' active-period';
    if (lastTracked === dateStr) cls += ' last-tracked';
    if (dateStr === today && !isStart && !isEnd) cls += ' today-marker';

    html += `<div class="${cls}" onclick="handleDayTap('${dateStr}')">${d}</div>`;
  }
  grid.innerHTML = html;

  const yearSelect = $select('yearSelect');
  if (yearSelect && parseInt(yearSelect.value) !== mobYear) {
    let exists = false;
    for (let i = 0; i < yearSelect.options.length; i++) {
      if (parseInt(yearSelect.options[i].value) === mobYear) { exists = true; break; }
    }
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = String(mobYear);
      opt.text = String(mobYear);
      yearSelect.appendChild(opt);
    }
    yearSelect.value = String(mobYear);
    currentYear = mobYear;
  }
}

function shiftMonth(dir: number): void {
  mobMonth += dir;
  if (mobMonth > 11) { mobMonth = 0; mobYear++; }
  if (mobMonth < 0) { mobMonth = 11; mobYear--; }
  renderMobileCalendar();
}

// === Desktop heatmap ===
function initYearSelector(): void {
  const sel = $select('yearSelect');
  if (!sel) return;
  sel.innerHTML = '';
  const yearsSet = new Set<number>();
  logs.forEach(l => {
    if (l.start) yearsSet.add(new Date(l.start + 'T00:00:00').getFullYear());
    if (l.end) yearsSet.add(new Date(l.end + 'T00:00:00').getFullYear());
  });
    yearsSet.add(currentYear);
    yearsSet.add(mobYear);
    [...yearsSet].sort((a, b) => b - a).forEach(y => {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.text = String(y);
      if (y === currentYear || y === mobYear) opt.selected = true;
      sel.appendChild(opt);
    });
    const selectedVal = parseInt(sel.value, 10);
    if (!isNaN(selectedVal)) {
      mobYear = selectedVal;
      currentYear = selectedVal;
    }
}

function renderCalendar(): void {
  const yearSelect = $select('yearSelect');
  if (yearSelect && yearSelect.value) {
    const selectedYear = parseInt(yearSelect.value, 10);
    if (!isNaN(selectedYear) && selectedYear !== mobYear) {
      mobYear = selectedYear;
      currentYear = selectedYear;
      if (mobMonth < 0) mobMonth = 0;
      if (mobMonth > 11) mobMonth = 11;
    }
  }

  renderMobileCalendar();

  const grid = $('calendarGrid');
  grid.innerHTML = '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let header = `<div class="cal-row"><div class="cal-cell"></div>`;
  for (let d = 1; d <= 31; d++) header += `<div class="cal-cell" style="background:transparent;">${d}</div>`;
  header += `</div>`;
  grid.innerHTML = header;

  const periodDays = new Set<string>();
  logs.forEach(l => {
    if (l.end) {
      let cur = new Date(l.start + 'T00:00:00');
      const endd = new Date(l.end + 'T00:00:00');
      while (cur <= endd) {
        periodDays.add(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } else if (l.start) {
      const startDate = new Date(l.start + 'T00:00:00');
      const endRange = l.trackedEnd ? new Date(l.trackedEnd + 'T00:00:00') : new Date(l.start + 'T00:00:00');
      const cur = new Date(startDate);
      while (cur <= endRange) {
        periodDays.add(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }
  });

  const active = getActivePeriod();
  const lastTracked = active && !active.end ? active.trackedEnd : null;

  months.forEach((m, idx) => {
    let row = `<div class="cal-row"><div class="cal-cell">${m}</div>`;
    const daysInMonth = new Date(currentYear, idx + 1, 0).getDate();
    for (let d = 1; d <= 31; d++) {
      if (d > daysInMonth) {
        row += `<div class="cal-cell"></div>`;
      } else {
        const dateStr = `${currentYear}-${String(idx + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        let addClass = 'cal-cell day-cell';
        const isStart = logs.some(l => l.start === dateStr);
        const isEnd = logs.some(l => l.end === dateStr);
        const inPeriod = periodDays.has(dateStr);
        if (isStart) addClass += ' active-start';
        if (isEnd && !isStart) addClass += ' active-end';
        if (inPeriod && !isStart && !isEnd) addClass += ' active-period';
        if (lastTracked === dateStr) addClass += ' last-tracked';
        row += `<div class="${addClass}" onclick="handleDayTap('${dateStr}')"></div>`;
      }
    }
    row += `</div>`;
    grid.innerHTML += row;
  });
}

// === Main UI update ===
function updateUI(): void {
  const tbody = $('historyLog');
  tbody.innerHTML = '';

  if (!logs.length) {
    $('avgCycle').innerText = '28 Days';
    $('avgDuration').innerText = '5 Days';
    $('countdownDisplay').innerText = '📆 Add first log';
    $('phaseName').innerText = 'Log your period start';
    $('nextPeriodDate').innerText = '—';
    $('nextEndDate').innerText = '—';
    $('updateBtn').style.display = 'none';
    return;
  }

  const gaps: number[] = [];
  const durations: number[] = [];
  const sorted = [...logs].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    if (log.start && log.end) {
      const dur = daysBetween(new Date(log.end), new Date(log.start)) + 1;
      durations.push(dur);
    }
    if (i < sorted.length - 1 && sorted[i + 1].start) {
      const d1 = new Date(sorted[i].start + 'T00:00:00');
      const d2 = new Date(sorted[i + 1].start + 'T00:00:00');
      const gap = daysBetween(d1, d2);
      if (gap >= 14 && gap <= 60) gaps.push(gap);
    }
  }

  let avgC = 28;
  if (gaps.length === 1) {
    avgC = gaps[0];
  } else if (gaps.length >= 2) {
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const stdDev = Math.sqrt(gaps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / gaps.length);
    if (stdDev > 4.5) {
      const recent = gaps.slice(0, 3).sort((a, b) => a - b);
      avgC = recent[Math.floor(recent.length / 2)];
    } else {
      const delta = gaps[0] - gaps[1];
      avgC = Math.round(gaps[0] + delta * 0.25);
    }
  }

  const avgD = durations.length
  ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
  : 5;

  $('avgCycle').innerText = avgC + ' Days';
  $('avgDuration').innerText = avgD + ' Days';

  const last = sorted[0];
  const lastStart = new Date(last.start + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activePeriod = !last.end;
  const cycleDay = daysBetween(today, lastStart) + 1;

  let periodDayLength = 1;
  if (activePeriod) {
    const trackEnd = last.trackedEnd ? new Date(last.trackedEnd + 'T00:00:00') : lastStart;
    periodDayLength = daysBetween(trackEnd, lastStart) + 1;
  }

  const nextStart = new Date(lastStart);
  nextStart.setDate(lastStart.getDate() + avgC);

  if (activePeriod) currentPhaseKey = 'MENSTRUAL';
  else if (today >= nextStart) currentPhaseKey = 'LATE';
  else {
    if (cycleDay <= Math.floor(avgC - 16)) currentPhaseKey = 'FOLLICULAR';
    else if (cycleDay <= Math.floor(avgC - 12)) currentPhaseKey = 'OVULATORY';
    else currentPhaseKey = 'LUTEAL';
  }

  const p = PHASES[currentPhaseKey];
  $('phaseIcon').innerText = p.icon;
  $('phaseIcon').style.setProperty('--phase-glow', p.color);
  $('phaseName').innerText = p.name;
  $('hormoneMarker').innerHTML = p.hormone + ' ⓘ';
  $('hormoneMarker').style.setProperty('--phase-glow', p.color);

  if (activePeriod) {
    $('countdownDisplay').innerText = `Day ${periodDayLength} of period`;
    $('startPredLabel').innerText = 'Current start';
    $('nextPeriodDate').innerText = formatDate(last.start);
    const estEnd = new Date(lastStart);
    estEnd.setDate(lastStart.getDate() + (avgD - 1));
    $('nextEndDate').innerText = formatDate(estEnd.toISOString().split('T')[0]);
  } else {
    $('startPredLabel').innerText = 'Expected next';
    $('nextPeriodDate').innerText = formatDate(nextStart.toISOString().split('T')[0]);
    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextStart.getDate() + (avgD - 1));
    $('nextEndDate').innerText = formatDate(nextEnd.toISOString().split('T')[0]);

    const diffDays = daysBetween(nextStart, today);
    if (diffDays < 0) $('countdownDisplay').innerText = `${Math.abs(diffDays)} Days Late`;
    else if (diffDays === 0) $('countdownDisplay').innerText = 'Due today';
    else $('countdownDisplay').innerText = `Next in ${diffDays} Days`;
  }

  // Timeline
  const timelineDiv = $('phaseTimeline');
  timelineDiv.innerHTML = '';
  type TimelineKey = PhaseKey | 'NEXT';
  const points: { label: string; key: TimelineKey; date: Date }[] = [
    { label: 'Menstrual', key: 'MENSTRUAL', date: new Date(lastStart) },
    { label: 'Follicular', key: 'FOLLICULAR', date: new Date(lastStart.getTime() + avgD * 86400000) },
    { label: 'Ovulation', key: 'OVULATORY', date: new Date(lastStart.getTime() + Math.max(avgC - 14, 6) * 86400000) },
    { label: 'Luteal', key: 'LUTEAL', date: new Date(lastStart.getTime() + Math.max(avgC - 10, 12) * 86400000) },
    { label: 'Next Cycle', key: 'NEXT', date: new Date(lastStart.getTime() + avgC * 86400000) },
  ];

  const phaseOrder: TimelineKey[] = ['MENSTRUAL','FOLLICULAR','OVULATORY','LUTEAL','NEXT'];
  const activeKey: TimelineKey = currentPhaseKey === 'LATE' ? 'NEXT' : currentPhaseKey;
  const activeIdx = phaseOrder.indexOf(activeKey);

  const phaseBounds: Record<TimelineKey, [number, number]> = {
    MENSTRUAL: [0, avgD],
    FOLLICULAR: [avgD, avgC - 14],
    OVULATORY: [avgC - 14, avgC - 10],
    LUTEAL: [avgC - 10, avgC],
    LATE: [avgC, avgC + 5],
    NEXT: [avgC, avgC + 5],
  };
  const [phStart, phEnd] = phaseBounds[activeKey] || [0, 1];
  const phaseProgress = Math.min(100, Math.max(0, Math.round(((cycleDay - phStart) / (phEnd - phStart)) * 100)));

  points.forEach((pt, i) => {
    const isActive = pt.key === activeKey;
    const isPassed = i < activeIdx;
    const dotColor = PHASES[pt.key === 'NEXT' ? 'MENSTRUAL' : pt.key].color;
    const progressStyle = isActive ? `--phase-progress:${phaseProgress}%;` : '';
    timelineDiv.innerHTML += `<div class="tl-point ${isActive ? 'active' : isPassed ? 'passed' : ''}" style="--phase-dot:${dotColor};${progressStyle}"><div class="tl-dot"></div><div class="tl-label">${pt.label}</div><div class="tl-date">${formatDate(pt.date.toISOString().split('T')[0])}</div></div>`;
  });

  $('updateBtn').style.display = (!logs[0]?.end && logs.length) ? 'block' : 'none';

  logs.forEach(log => {
    const durDays = log.end
    ? daysBetween(new Date(log.end), new Date(log.start)) + 1
    : log.trackedEnd
    ? daysBetween(new Date(log.trackedEnd), new Date(log.start)) + 1
    : 'Ongoing';
    const row = `<tr><td>${formatDate(log.start)} — ${formatDate(log.end)}</td><td>${durDays}</td><td><span style="color:${log.end ? '#aac9ff' : '#ff86a8'};">${log.end ? 'Finished' : 'Active'}</span></td><td><button class="delete-badge" onclick="deleteEntry(${log.id})">✕ Remove</button></td></tr>`;
    tbody.innerHTML += row;
  });

  // Confidence
  const cycleCount = gaps.length;
  let confidenceLevel = { text: 'Low', emoji: '🔴' };
  let cv = 0;
  if (cycleCount >= 2) {
    const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const stdGap = Math.sqrt(gaps.reduce((a, b) => a + Math.pow(b - meanGap, 2), 0) / gaps.length);
    cv = stdGap / meanGap;
  }
  if (cycleCount === 0) confidenceLevel = { text: 'Insufficient data', emoji: '⚪' };
  else if (cycleCount < 3) confidenceLevel = { text: 'Low', emoji: '🔴' };
  else if (cycleCount >= 5 && cv < 0.07) confidenceLevel = { text: 'High', emoji: '🟢' };
  else if (cycleCount >= 3 && cv < 0.12) confidenceLevel = { text: 'Medium', emoji: '🟡' };
  else confidenceLevel = { text: 'Low (variable cycles)', emoji: '🔴' };

  const earlyDate = new Date(nextStart);
  const lateDate = new Date(nextStart);
  earlyDate.setDate(nextStart.getDate() - 4);
  lateDate.setDate(nextStart.getDate() + 2);
  const rangeString = `${formatShort(earlyDate)} – ${formatShort(lateDate)}`;

  const metaDiv = $('predictionMeta');
  if (metaDiv) {
    const confidenceMsg = `<div class="confidence-row">
    <span class="confidence-badge">📊 Confidence: ${confidenceLevel.emoji} ${confidenceLevel.text}</span>
    <span class="range-text">🎯 Expected range: ${rangeString}</span>
    </div>`;
    let extraNote = `<div class="disclaimer-note">
    <span>⚠️</span> <strong>Not a miracle worker:</strong> predictions are estimates based on your logged cycles. Based on personal usage, the actual period often starts 2–4 days before or after the date shown. The more data you log, the more reliable the prediction becomes.
    </div>`;
    if (cycleCount === 0) {
      extraNote = `<div class="disclaimer-note"><span>📘</span> Log at least 2–3 cycles to see meaningful predictions. Your body is unique — give it time!</div>`;
    }
    metaDiv.innerHTML = confidenceMsg + extraNote;
    metaDiv.style.setProperty('--phase-glow', p.color);
  }
}

// === Forms ===
function logEntry(): void {
  const start = $input('startInput').value;
  if (!start) { showToast('Pick a start date', true); return; }
  const existingIdx = logs.findIndex(l => l.start === start);
  if (existingIdx !== -1) {
    logs.splice(existingIdx, 1);
    void save();
    showToast('Entry removed');
  } else {
    const endVal = $input('endInput').value || null;
    const newLog: CycleLog = { id: Date.now(), start, end: endVal };
    if (!endVal) newLog.trackedEnd = start;
    logs.unshift(newLog);
    void save();
    showToast('Cycle logged');
  }
  $input('startInput').value = '';
  $input('endInput').value = '';
}

function updateLatest(): void {
  const end = $input('endInput').value;
  if (!end) { showToast('Pick end date', true); return; }
  const active = getActivePeriod();
  if (active) {
    active.end = end;
    delete active.trackedEnd;
    void save();
    $input('endInput').value = '';
    showToast('Period ended');
  } else {
    showToast('No active period', true);
  }
}

// === Import / export ===
async function exportData(): Promise<void> {
  if (!logs.length) { showToast('No cycles logged yet', true); return; }
  try {
    await exportToFile(logs);
    showToast('Backup saved');
  } catch {
    showToast('Export failed', true);
  }
}

async function handleImport(): Promise<void> {
  try {
    const imported = await importFromFile();
    if (!imported) return;
    logs = imported;
    logs.forEach(l => {
      if (l.end === undefined) l.end = null;
      if (!l.end && l.start && !l.trackedEnd) l.trackedEnd = l.start;
    });
      await save();
      showToast('Import success');
  } catch {
    showToast('Invalid backup', true);
  }
}

// === Theme / insights / phases ===
async function toggleTheme(): Promise<void> {
  const isLight = document.body.classList.toggle('light');
  $('themeBtn').textContent = isLight ? '🌙' : '☀️';
  await saveTheme(isLight ? 'light' : 'dark');
}

function toggleEduCard(btn: HTMLElement): void {
  const body = btn.nextElementSibling as HTMLElement;
  const chevron = btn.querySelector('.edu-chevron') as HTMLElement;
  body.classList.toggle('collapsed');
  chevron.classList.toggle('collapsed');
}

function renderAllPhases(): void {
  const container = $('allPhasesContainer');
  let html = '';
  for (const key of ['MENSTRUAL','FOLLICULAR','OVULATORY','LUTEAL','LATE'] as PhaseKey[]) {
    const p = PHASES[key];
    html += `<div class="phase-detail-card" style="border-left-color: ${p.color};"><h4><span style="color:${p.color};">${p.name}</span> · ${p.hormone}</h4><div><strong>🧠 Mood & Mind:</strong> ${p.mood}</div><div><strong>⚡ Energy Levels:</strong> ${p.energy}</div><div><strong>💆 Skin & Body:</strong> ${p.body}</div><div><strong>🎯 Best For:</strong> ${p.activity}</div><div><strong>🍽️ Foods That Help:</strong> ${p.food}</div></div>`;
  }
  container.innerHTML = html;
}

function toggleInsights(): void {
  const card = $('insightCard');
  if (card.style.display === 'block') card.style.display = 'none';
  else { renderAllPhases(); card.style.display = 'block'; }
}

function closeInsights(): void {
  $('insightCard').style.display = 'none';
}

// === Dev tools ===
function toggleTerminal(): void {
  const t = $('jsonTerminal');
  t.classList.toggle('open');
  if (t.classList.contains('open')) $input('jsonArea').value = JSON.stringify(logs, null, 2);
}

function applyJson(): void {
  try {
    const area = document.getElementById('jsonArea') as HTMLTextAreaElement;
    const parsed = JSON.parse(area.value);
    if (!Array.isArray(parsed)) throw new Error();
    logs = parsed as CycleLog[];
    logs.forEach(l => {
      if (l.end === undefined) l.end = null;
      if (!l.end && l.start && !l.trackedEnd) l.trackedEnd = l.start;
    });
      void save();
      toggleTerminal();
      showToast('JSON applied');
  } catch {
    alert('Invalid JSON');
  }
}

function clearAllData(): void {
  if (confirm('Delete everything?')) {
    logs = [];
    void save();
    showToast('Reset complete');
  }
}

function loadDemo(): void {
  if (logs.length && !confirm('This will replace your current data with demo data. Continue?')) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };
  logs = [
    { id: 1001, start: daysAgo(84), end: daysAgo(79) },
    { id: 1002, start: daysAgo(56), end: daysAgo(51) },
    { id: 1003, start: daysAgo(28), end: daysAgo(23) },
    { id: 1004, start: daysAgo(3), end: null, trackedEnd: daysAgo(0) },
  ];
  void save();
  showToast('✨ Demo data loaded — explore the dashboard & calendar!');
}

// === Print summary ===
function printSummary(): void {
  if (!logs.length) { showToast('No cycles logged yet', true); return; }
  const sorted = [...logs].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  let totalGap = 0, gapCount = 0, totalDur = 0, durCount = 0;
  for (let i = 0; i < sorted.length; i++) {
    const l = sorted[i];
    if (l.start && l.end) {
      totalDur += daysBetween(new Date(l.end), new Date(l.start)) + 1;
      durCount++;
    }
    if (i < sorted.length - 1 && sorted[i + 1].end) {
      const g = daysBetween(new Date(sorted[i].start), new Date(sorted[i + 1].start));
      if (g > 0) { totalGap += g; gapCount++; }
    }
  }
  const avgC = gapCount ? Math.round(totalGap / gapCount) : 28;
  const avgD = durCount ? Math.round(totalDur / durCount) : 5;
  const last = sorted[0];
  const nextStart = new Date(last.start + 'T00:00:00');
  nextStart.setDate(nextStart.getDate() + avgC);
  const rows = sorted.map(l => {
    const dur = l.end
    ? daysBetween(new Date(l.end), new Date(l.start)) + 1
    : l.trackedEnd
    ? daysBetween(new Date(l.trackedEnd), new Date(l.start)) + 1
    : '—';
    return `<tr><td>${formatDate(l.start)}</td><td>${formatDate(l.end)}</td><td>${dur} days</td><td>${l.end ? 'Complete' : 'Active'}</td></tr>`;
  }).join('');
  $('printSummary').innerHTML = `
  <div class="ps-title">🌙 Cycle Tracker Summary</div>
  <div class="ps-subtitle">Generated ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
  <div class="ps-stats">
  <div class="ps-stat"><label>Cycles tracked</label><span>${sorted.length}</span></div>
  <div class="ps-stat"><label>Avg cycle length</label><span>${avgC} days</span></div>
  <div class="ps-stat"><label>Avg period length</label><span>${avgD} days</span></div>
  <div class="ps-stat"><label>Next predicted</label><span>${formatDate(nextStart.toISOString().split('T')[0])}</span></div>
  </div>
  <table class="ps-table">
  <thead><tr><th>Start</th><th>End</th><th>Length</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody>
  </table>
  <div class="ps-footer">Cycle Tracker · cycle data is stored locally on your device · not medical advice</div>`;
  window.print();
}

// === View switching ===
function switchView(view: string): void {
  document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
  $('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', (b.getAttribute('onclick') || '').includes(`'${view}'`));
  });
  if (view === 'calendar') renderCalendar();
  history.replaceState(null, '', view === 'dashboard' ? location.pathname : '#' + view);
}

// === Expose functions used by inline onclick handlers ===
Object.assign(window, {
  switchView, loadDemo, exportData, toggleTheme, printSummary,
    clearAllData, toggleInsights, closeInsights, logEntry, updateLatest,
    deleteEntry, handleDayTap, shiftMonth, renderCalendar, applyJson,
    toggleTerminal, toggleEduCard,
});

// === Init ===
async function init(): Promise<void> {
  logs = await loadLogs();
  logs.forEach(l => {
    if (!l.end && l.start && !l.trackedEnd) l.trackedEnd = l.start;
  });

    const theme = await loadTheme();
    if (theme === 'light') {
      document.body.classList.add('light');
      $('themeBtn').textContent = '🌙';
    }

    // Wire up import button (replaces the old file input)
    $('importBtnTrigger').addEventListener('click', () => void handleImport());

    // Wire up dev terminal
    $('devZone').addEventListener('click', toggleTerminal);

    initYearSelector();
    updateUI();
    renderMobileCalendar();

    const yrSelect = $select('yearSelect');
    if (yrSelect && yrSelect.value) {
      mobYear = parseInt(yrSelect.value, 10);
      currentYear = mobYear;
      renderMobileCalendar();
    }

    const startHash = location.hash.slice(1);
    if (['calendar', 'information'].includes(startHash)) switchView(startHash);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init());
} else {
  void init();
}
