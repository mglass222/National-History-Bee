// History Page module - full history table display (distinct from history.js session sidebar)
import { state, DIFFICULTY_NAMES } from './state.js';
import { updateStats } from './questions.js';
import { refreshDashboard } from './dashboard.js';

// Forward declarations for cross-module dependencies
export const deps = {
    updateHistoryDisplay: null
};

export function getDifficultyName(key) {
    return DIFFICULTY_NAMES[key] || 'Unknown';
}

export function renderHistoryPageTable(data) {
    const wrapper = document.getElementById('historyTableWrapper');
    const isMobile = window.innerWidth <= 480;

    if (data.length === 0) {
        wrapper.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No questions match your filters.</p>';
        return;
    }

    // Abbreviation helper for mobile
    function abbreviate(text, maxLen) {
        if (!isMobile || !text || text === 'N/A') return text;
        return text.length > maxLen ? text.substring(0, maxLen) : text;
    }

    let tableHTML = `
        <table class="history-table" id="historyTable">
            <thead>
                <tr>
                    <th style="min-width: ${isMobile ? '30px' : '30px'};">${isMobile ? 'ID' : 'Question ID'}<div class="resizer"></div></th>
                    <th style="min-width: ${isMobile ? '25px' : '25px'};">${isMobile ? '' : 'Status'}<div class="resizer"></div></th>
                    <th style="min-width: ${isMobile ? '25px' : '30px'};">${isMobile ? 'Diff' : 'Difficulty'}<div class="resizer"></div></th>
                    <th style="min-width: ${isMobile ? '30px' : '30px'};">${isMobile ? 'Reg' : 'Region'}<div class="resizer"></div></th>
                    <th style="min-width: ${isMobile ? '30px' : '30px'};">${isMobile ? 'Time' : 'Time Period'}<div class="resizer"></div></th>
                    <th style="min-width: ${isMobile ? '25px' : '30px'};">Type<div class="resizer"></div></th>
                    <th style="min-width: ${isMobile ? '30px' : '30px'};">Date</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(entry => {
        const dateObj = new Date(entry.timestamp);
        const date = isMobile
            ? `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
            : dateObj.toLocaleDateString();
        const difficulty = isMobile
            ? entry.id.charAt(0)
            : getDifficultyName(entry.id.charAt(0));
        const statusIcon = entry.status === 'correct' ? '✓' : (entry.status === 'incorrect' ? '✗' : '—');

        // Get category information from metadata
        const meta = state.questionMetadata[entry.id];
        const region = meta ? (meta.regions[0] || 'N/A') : 'N/A';
        const timePeriod = meta ? (meta.time_periods[0] || 'N/A') : 'N/A';
        const answerType = meta ? (meta.answer_type || 'N/A') : 'N/A';

        tableHTML += `
            <tr class="${entry.status}" onclick="openQuestionDetail('${entry.id}')">
                <td style="white-space: nowrap;">${entry.id}</td>
                <td>
                    <span class="status-badge ${entry.status}">${statusIcon}</span>
                </td>
                <td>${difficulty}</td>
                <td>${abbreviate(region, 7)}</td>
                <td>${abbreviate(timePeriod, 7)}</td>
                <td>${abbreviate(answerType, 4)}</td>
                <td>${date}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    wrapper.innerHTML = tableHTML;

    // Initialize column resizing after table is rendered
    initColumnResizing();
}

// Column resizing functionality
export function initColumnResizing() {
    const table = document.getElementById('historyTable');
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

export function openQuestionDetail(questionId) {
    const entry = state.questionHistory.find(e => e.id === questionId);
    if (!entry) return;

    // Get category information
    const meta = state.questionMetadata[questionId];
    const region = meta ? meta.regions.join(', ') : 'N/A';
    const timePeriod = meta ? meta.time_periods.join(', ') : 'N/A';
    const answerType = meta ? meta.answer_type : 'N/A';
    const themes = meta ? meta.subject_themes.join(', ') : 'N/A';

    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Question ${questionId}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 20px;
                    line-height: 1.6;
                }
                h1 { color: #4a90e2; }
                .question { font-size: 1.1em; margin: 20px 0; }
                .answer { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .categories { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .label { font-weight: 600; color: #666; margin-bottom: 10px; }
                .category-item { margin: 8px 0; }
                .category-label { font-weight: 600; color: #1976d2; display: inline-block; width: 120px; }
            </style>
        </head>
        <body>
            <h1>Question ${questionId}</h1>
            <div class="label">Question:</div>
            <div class="question">${entry.question}</div>
            <div class="label">Answer:</div>
            <div class="answer">${entry.answer}</div>
            <div class="label">Categories:</div>
            <div class="categories">
                <div class="category-item"><span class="category-label">Region:</span> ${region}</div>
                <div class="category-item"><span class="category-label">Time Period:</span> ${timePeriod}</div>
                <div class="category-item"><span class="category-label">Answer Type:</span> ${answerType}</div>
                <div class="category-item"><span class="category-label">Themes:</span> ${themes}</div>
            </div>
        </body>
        </html>
    `);
    newWindow.document.close();
}

// History filtering
export function filterHistoryPage() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    const questionSetFilter = document.getElementById('historyQuestionSetFilter')?.value || 'all';
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = state.questionHistory.filter(entry => {
        const matchesSearch = entry.id.toLowerCase().includes(searchTerm);
        const matchesQuestionSet = questionSetFilter === 'all' || entry.questionSet === questionSetFilter;
        const matchesDifficulty = difficultyFilter === 'all' || entry.id.charAt(0) === difficultyFilter;
        const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

        return matchesSearch && matchesQuestionSet && matchesDifficulty && matchesStatus;
    });

    renderHistoryPageTable(filtered);
}

// Export history to CSV
export function exportHistoryPage() {
    if (state.questionHistory.length === 0) {
        alert('No history to export!');
        return;
    }

    let csv = 'Question ID,Status,Difficulty,Region,Time Period,Type,Date,Question,Answer\n';

    state.questionHistory.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        const difficulty = getDifficultyName(entry.id.charAt(0));
        const question = entry.question.replace(/"/g, '""').replace(/<[^>]*>/g, '');
        const answer = entry.answer.replace(/"/g, '""').replace(/<[^>]*>/g, '');

        // Get category information
        const meta = state.questionMetadata[entry.id];
        const region = meta ? (meta.regions.join('; ') || 'N/A') : 'N/A';
        const timePeriod = meta ? (meta.time_periods.join('; ') || 'N/A') : 'N/A';
        const answerType = meta ? (meta.answer_type || 'N/A') : 'N/A';

        csv += `"${entry.id}","${entry.status}","${difficulty}","${region}","${timePeriod}","${answerType}","${date}","${question}","${answer}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hbreader-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Clear all history
export async function clearHistoryPage() {
    if (!confirm('Are you sure you want to clear all your question history? This cannot be undone.')) {
        return;
    }

    state.questionHistory = [];
    state.sessionHistory = [];
    if (deps.updateHistoryDisplay) {
        deps.updateHistoryDisplay();
    }
    state.questionsPracticed = 0;
    updateStats();

    // Clear from Firestore if logged in
    if (state.currentUser) {
        try {
            const { collection, getDocs, deleteDoc, doc } = window.firebaseDbFunctions;
            const historyCollectionRef = collection(
                window.firebaseDb,
                'users',
                state.currentUser.uid,
                'history'
            );
            const querySnapshot = await getDocs(historyCollectionRef);

            const deletePromises = [];
            querySnapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(docSnapshot.ref));
            });

            await Promise.all(deletePromises);
            alert('History cleared successfully!');
            refreshDashboard();
            renderHistoryPageTable(state.questionHistory);
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('Error clearing history from cloud. Please try again.');
        }
    } else {
        alert('History cleared!');
        refreshDashboard();
        renderHistoryPageTable(state.questionHistory);
    }
}

export function restoreHistoryPageStructure() {
    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = `
        <div class="dashboard-header">
            <h1 class="dashboard-title">Question History</h1>
            <p class="dashboard-subtitle">Review your practice history and track your progress</p>
        </div>

        <div class="history-table-container">
            <div class="history-controls">
                <input type="text" class="history-search" id="historySearch" placeholder="Search by Question ID...">
                <select class="history-filter" id="historyQuestionSetFilter">
                    <option value="all">All Question Sets</option>
                    <option value="nat_hist_bee">National History Bee</option>
                    <option value="us_hist_bee">US History Bee</option>
                </select>
                <select class="history-filter" id="difficultyFilter">
                    <option value="all">All Difficulties</option>
                    <option value="P">Preliminary</option>
                    <option value="Q">Quarterfinals</option>
                    <option value="S">Semifinals</option>
                    <option value="F">Finals</option>
                </select>
                <select class="history-filter" id="statusFilter">
                    <option value="all">All Status</option>
                    <option value="correct">Correct</option>
                    <option value="incorrect">Incorrect</option>
                    <option value="skipped">Skipped</option>
                </select>
            </div>

            <div id="historyTableWrapper">
                <!-- Table will be generated by JS -->
            </div>

            <div class="dashboard-actions">
                <button class="btn-export" onclick="exportHistoryPage()">Export History (CSV)</button>
            </div>
        </div>
    `;

    // Re-attach event listeners for search and filters
    document.getElementById('historySearch').addEventListener('input', filterHistoryPage);
    document.getElementById('historyQuestionSetFilter').addEventListener('change', filterHistoryPage);
    document.getElementById('difficultyFilter').addEventListener('change', filterHistoryPage);
    document.getElementById('statusFilter').addEventListener('change', filterHistoryPage);
}

// Initialize history page event listeners
export function initHistoryPageEventListeners() {
    const historySearch = document.getElementById('historySearch');
    const historyQuestionSetFilter = document.getElementById('historyQuestionSetFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (historySearch) historySearch.addEventListener('input', filterHistoryPage);
    if (historyQuestionSetFilter) historyQuestionSetFilter.addEventListener('change', filterHistoryPage);
    if (difficultyFilter) difficultyFilter.addEventListener('change', filterHistoryPage);
    if (statusFilter) statusFilter.addEventListener('change', filterHistoryPage);
}
