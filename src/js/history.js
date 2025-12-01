// History module - question history tracking and display
import { state } from './state.js';
import { updateStats } from './questions.js';

// Forward declarations
export const deps = {
    updatePointsAndLeaderboard: null
};

export async function addToHistory(question, status) {
    const currentQuestionSet = document.getElementById('questionSet').value;
    const historyEntry = {
        id: question.id,
        question: question.question,
        answer: question.answer,
        status: status,
        timestamp: Date.now(),
        questionSet: currentQuestionSet
    };

    state.questionHistory.push(historyEntry);
    state.sessionHistory.push(historyEntry);
    updateHistoryDisplay();

    if (state.currentUser && state.currentUser.emailVerified) {
        await saveHistoryItem(historyEntry);

        const difficulty = question.id.charAt(0);
        if (deps.updatePointsAndLeaderboard) {
            await deps.updatePointsAndLeaderboard(difficulty, status === 'correct');
        }
    }
}

export async function saveHistoryItem(historyEntry) {
    try {
        const { doc, setDoc } = window.firebaseDbFunctions;
        const historyDocRef = doc(
            window.firebaseDb,
            'users',
            state.currentUser.uid,
            'history',
            historyEntry.id + '_' + historyEntry.timestamp
        );
        await setDoc(historyDocRef, historyEntry);
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

export async function loadUserHistory() {
    if (!state.currentUser || !state.currentUser.emailVerified) return;

    try {
        const { collection, getDocs, query, orderBy } = window.firebaseDbFunctions;
        const historyCollectionRef = collection(
            window.firebaseDb,
            'users',
            state.currentUser.uid,
            'history'
        );
        const q = query(historyCollectionRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);

        state.questionHistory = [];
        querySnapshot.forEach((doc) => {
            state.questionHistory.push(doc.data());
        });

        updateHistoryDisplay();
        state.questionsPracticed = state.questionHistory.length;
        updateStats();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

export function updateHistoryDisplay() {
    const historyItems = document.getElementById('historyItems');
    if (!historyItems) return;

    if (state.sessionHistory.length === 0) {
        historyItems.innerHTML = '<span style="color: var(--text-tertiary); font-style: italic; font-size: 0.9em;">No questions practiced yet this session.</span>';
        return;
    }

    historyItems.innerHTML = '';

    state.sessionHistory.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.dataset.index = index;

        let icon = '';
        let iconClass = '';

        if (entry.status === 'correct') {
            icon = '✓';
            iconClass = 'correct';
        } else if (entry.status === 'incorrect') {
            icon = '✗';
            iconClass = 'incorrect';
        } else {
            icon = '—';
            iconClass = 'skipped';
        }

        item.innerHTML = `
            <span class="status-icon ${iconClass}">${icon}</span>
            <span>${entry.id}</span>
        `;

        item.addEventListener('mouseenter', (e) => showHistoryTooltip(e, entry));
        item.addEventListener('mouseleave', hideHistoryTooltip);
        item.addEventListener('mousemove', updateTooltipPosition);

        historyItems.appendChild(item);
    });
}

export function showHistoryTooltip(event, entry) {
    const tooltip = document.getElementById('historyTooltip');
    const tooltipQuestion = document.getElementById('tooltipQuestion');
    const tooltipAnswer = document.getElementById('tooltipAnswer');

    tooltipQuestion.innerHTML = entry.question;
    tooltipAnswer.innerHTML = entry.answer;

    tooltip.classList.add('show');
    state.currentTooltipEvent = event;
    updateTooltipPosition(event);
}

export function hideHistoryTooltip() {
    const tooltip = document.getElementById('historyTooltip');
    tooltip.classList.remove('show');
    state.currentTooltipEvent = null;
}

export function updateTooltipPosition(event) {
    const tooltip = document.getElementById('historyTooltip');
    if (!tooltip.classList.contains('show')) return;

    const x = event.clientX;
    const y = event.clientY;
    const offset = 15;

    const tooltipRect = tooltip.getBoundingClientRect();
    let left = x + offset;
    let top = y + offset;

    if (left + tooltipRect.width > window.innerWidth) {
        left = x - tooltipRect.width - offset;
    }

    if (top + tooltipRect.height > window.innerHeight) {
        top = y - tooltipRect.height - offset;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

export function getFilteredHistory() {
    const statusFilter = document.getElementById('historyFilter')?.value || 'all';
    const regionFilter = document.getElementById('historyRegionFilter')?.value || 'all';
    const timePeriodFilter = document.getElementById('historyTimePeriodFilter')?.value || 'all';
    const typeFilter = document.getElementById('historyTypeFilter')?.value || 'all';

    return state.questionHistory.filter(entry => {
        // Status filter
        if (statusFilter !== 'all' && entry.status !== statusFilter) return false;

        // Get metadata for category filters
        const meta = state.questionMetadata[entry.id];
        if (!meta) return statusFilter === 'all' || entry.status === statusFilter;

        // Region filter
        if (regionFilter !== 'all') {
            if (!meta.regions || !meta.regions.includes(regionFilter)) return false;
        }

        // Time period filter
        if (timePeriodFilter !== 'all') {
            if (!meta.time_periods || !meta.time_periods.includes(timePeriodFilter)) return false;
        }

        // Type filter
        if (typeFilter !== 'all') {
            if (meta.answer_type !== typeFilter) return false;
        }

        return true;
    });
}

export function filterHistory() {
    const tableWrapper = document.getElementById('historyTableWrapper');
    if (!tableWrapper) return;

    const filtered = getFilteredHistory();
    renderHistoryTable(filtered);
}

export function renderHistoryTable(data) {
    const wrapper = document.getElementById('historyTableWrapper');
    if (!wrapper) return;

    if (data.length === 0) {
        wrapper.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No history to display.</p>';
        return;
    }

    const reversed = [...data].reverse();

    wrapper.innerHTML = `
        <table class="history-table" id="sessionHistoryTable">
            <thead>
                <tr>
                    <th style="min-width: 30px; width: 70px;">ID<div class="resizer"></div></th>
                    <th style="min-width: 25px; width: 85px;">Status<div class="resizer"></div></th>
                    <th style="min-width: 30px; width: 500px;">Question<div class="resizer"></div></th>
                    <th style="min-width: 30px; width: 100px;">Region<div class="resizer"></div></th>
                    <th style="min-width: 30px; width: 120px;">Time Period<div class="resizer"></div></th>
                    <th style="min-width: 30px; width: 80px;">Type<div class="resizer"></div></th>
                    <th style="min-width: 50px; width: 140px;">Attempted</th>
                </tr>
            </thead>
            <tbody>
                ${reversed.map(entry => {
                    const meta = state.questionMetadata[entry.id] || {};
                    const region = meta.regions ? meta.regions[0] : '-';
                    const timePeriod = meta.time_periods ? meta.time_periods[0] : '-';
                    const answerType = meta.answer_type || '-';
                    const date = new Date(entry.timestamp);
                    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    let statusClass = entry.status;
                    let statusIcon = entry.status === 'correct' ? '✓' : entry.status === 'incorrect' ? '✗' : '—';

                    return `
                        <tr onclick="openQuestionDetail('${entry.id}')" style="cursor: pointer;">
                            <td style="white-space: nowrap;">${entry.id}</td>
                            <td><span class="status-badge ${statusClass}">${statusIcon}</span></td>
                            <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${entry.question.replace(/<[^>]*>/g, '').substring(0, 100)}...</td>
                            <td>${region}</td>
                            <td>${timePeriod}</td>
                            <td>${answerType}</td>
                            <td>${dateStr}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Initialize column resizing
    initSessionHistoryResizing();
}

// Column resizing for session history table
function initSessionHistoryResizing() {
    const table = document.getElementById('sessionHistoryTable');
    if (!table) return;

    const resizers = table.querySelectorAll('.resizer');
    const allThs = table.querySelectorAll('thead th');
    let currentTh = null;
    let startX = 0;
    let startWidth = 0;

    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', (e) => {
            // Lock all column widths to their current rendered size
            allThs.forEach(th => {
                th.style.width = th.getBoundingClientRect().width + 'px';
            });

            currentTh = resizer.parentElement;
            startX = e.pageX;
            startWidth = currentTh.getBoundingClientRect().width;

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            e.preventDefault();
        });
    });

    function handleMouseMove(e) {
        if (!currentTh) return;

        const width = startWidth + (e.pageX - startX);
        const minWidth = parseInt(currentTh.style.minWidth) || 30;

        if (width >= minWidth) {
            currentTh.style.width = width + 'px';
        }
    }

    function handleMouseUp() {
        currentTh = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
}

export function exportHistory() {
    const data = getFilteredHistory();
    if (data.length === 0) {
        alert('No history to export');
        return;
    }

    const csv = [
        ['ID', 'Status', 'Question', 'Answer', 'Timestamp', 'Question Set'].join(','),
        ...data.map(entry => [
            entry.id,
            entry.status,
            `"${entry.question.replace(/<[^>]*>/g, '').replace(/"/g, '""')}"`,
            `"${entry.answer.replace(/<[^>]*>/g, '').replace(/"/g, '""')}"`,
            new Date(entry.timestamp).toISOString(),
            entry.questionSet || 'nat_hist_bee'
        ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hbreader-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export async function clearHistory() {
    if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) {
        return;
    }

    if (state.currentUser && state.currentUser.emailVerified) {
        try {
            const { collection, getDocs, deleteDoc } = window.firebaseDbFunctions;
            const historyRef = collection(window.firebaseDb, 'users', state.currentUser.uid, 'history');
            const snapshot = await getDocs(historyRef);

            for (const doc of snapshot.docs) {
                await deleteDoc(doc.ref);
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('Error clearing history from server');
            return;
        }
    }

    state.questionHistory = [];
    state.sessionHistory = [];
    state.questionsPracticed = 0;
    updateHistoryDisplay();
    updateStats();

    const wrapper = document.getElementById('historyTableWrapper');
    if (wrapper) {
        wrapper.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No history to display.</p>';
    }
}

export function restoreHistoryStructure() {
    const container = document.getElementById('historyContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="dashboard-header">
            <h1>History</h1>
        </div>
        <div class="history-filters">
            <div class="history-filter-row">
                <select id="historyFilter" class="history-filter-select" onchange="filterHistory()">
                    <option value="all">Status</option>
                    <option value="correct">Correct</option>
                    <option value="incorrect">Incorrect</option>
                    <option value="skipped">Skipped</option>
                </select>
                <select id="historyRegionFilter" class="history-filter-select" onchange="filterHistory()">
                    <option value="all">All Regions</option>
                    <option value="United States">United States</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia">Asia</option>
                    <option value="Latin America & Caribbean">Latin America & Caribbean</option>
                    <option value="Americas (Pre-Columbian)">Americas (Pre-Columbian)</option>
                    <option value="Africa">Africa</option>
                    <option value="Middle East & North Africa">Middle East & North Africa</option>
                    <option value="Global/Multi-Regional">Global/Multi-Regional</option>
                </select>
                <select id="historyTimePeriodFilter" class="history-filter-select" onchange="filterHistory()">
                    <option value="all">All Time Periods</option>
                    <option value="Ancient World (pre-500 CE)">Ancient World (pre-500 CE)</option>
                    <option value="Medieval Era (500-1450)">Medieval Era (500-1450)</option>
                    <option value="Early Modern (1450-1750)">Early Modern (1450-1750)</option>
                    <option value="Age of Revolutions (1750-1850)">Age of Revolutions (1750-1850)</option>
                    <option value="Industrial & Imperial Age (1850-1914)">Industrial & Imperial Age (1850-1914)</option>
                    <option value="World Wars & Interwar (1914-1945)">World Wars & Interwar (1914-1945)</option>
                    <option value="Contemporary Era (1945-present)">Contemporary Era (1945-present)</option>
                </select>
                <select id="historyTypeFilter" class="history-filter-select" onchange="filterHistory()">
                    <option value="all">All Types</option>
                    <option value="People & Biography">People & Biography</option>
                    <option value="Events (Wars, Battles, Revolutions)">Events (Wars, Battles, Revolutions)</option>
                    <option value="Political History & Diplomacy">Political History & Diplomacy</option>
                    <option value="Economic History & Trade">Economic History & Trade</option>
                    <option value="Social History & Daily Life">Social History & Daily Life</option>
                    <option value="Cultural History (Art, Literature, Music)">Cultural History (Art, Literature, Music)</option>
                    <option value="Religion & Mythology">Religion & Mythology</option>
                    <option value="Science, Technology & Innovation">Science, Technology & Innovation</option>
                    <option value="Geography & Environment">Geography & Environment</option>
                    <option value="Places, Cities & Civilizations">Places, Cities & Civilizations</option>
                    <option value="Groups, Organizations & Institutions">Groups, Organizations & Institutions</option>
                    <option value="Documents, Laws & Treaties">Documents, Laws & Treaties</option>
                    <option value="Ideas, Ideologies & Philosophies">Ideas, Ideologies & Philosophies</option>
                </select>
            </div>
        </div>
        <div id="historyTableWrapper"></div>
    `;
}
