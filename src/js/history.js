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
    const filter = document.getElementById('historyFilter')?.value || 'all';
    if (filter === 'all') return state.questionHistory;
    return state.questionHistory.filter(h => h.status === filter);
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
        <table class="history-table">
            <thead>
                <tr>
                    <th style="width: 55px;">ID</th>
                    <th style="width: 70px;">Status</th>
                    <th>Question</th>
                    <th style="width: 80px;">Region</th>
                    <th style="width: 130px;">Time</th>
                </tr>
            </thead>
            <tbody>
                ${reversed.map(entry => {
                    const meta = state.questionMetadata[entry.id] || {};
                    const region = meta.regions ? meta.regions[0] : '-';
                    const date = new Date(entry.timestamp);
                    const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    let statusClass = entry.status;
                    let statusIcon = entry.status === 'correct' ? '✓' : entry.status === 'incorrect' ? '✗' : '—';

                    return `
                        <tr onclick="openQuestionDetail('${entry.id}')" style="cursor: pointer;">
                            <td>${entry.id}</td>
                            <td><span class="status-badge ${statusClass}">${statusIcon} <span class="status-text">${entry.status}</span></span></td>
                            <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${entry.question.replace(/<[^>]*>/g, '').substring(0, 100)}...</td>
                            <td>${region}</td>
                            <td>${timeStr}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
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
            <h1>Question History</h1>
            <div class="dashboard-controls">
                <select id="historyFilter" onchange="filterHistory()">
                    <option value="all">All</option>
                    <option value="correct">Correct</option>
                    <option value="incorrect">Incorrect</option>
                    <option value="skipped">Skipped</option>
                </select>
                <button onclick="exportHistory()">Export CSV</button>
                <button onclick="clearHistory()" style="background: var(--error-red); color: white;">Clear History</button>
            </div>
        </div>
        <div id="historyTableWrapper"></div>
    `;
}
