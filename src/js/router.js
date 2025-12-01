// Router module - navigation and route handling
import { state } from './state.js';
import { refreshDashboard, restoreDashboardStructure } from './dashboard.js';
import { renderHistoryTable, restoreHistoryStructure } from './history.js';
import { loadLeaderboard } from './leaderboard.js';
import { loadProfile, checkAndShowProfileWarning } from './profile.js';

// Forward declarations for cross-module dependencies
export const deps = {
    loadUserHistory: null
};

// Navigation
export function navigateTo(page) {
    window.location.hash = page;
}

// Hash-based Routing
export async function handleRouteChange() {
    const hash = window.location.hash.slice(1) || 'practice';
    const practiceContainer = document.getElementById('practiceContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const historyContainer = document.getElementById('historyContainer');
    const profileContainer = document.getElementById('profileContainer');
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    const navTabs = document.querySelectorAll('.nav-tab');

    // Update containers
    if (hash === 'dashboard') {
        practiceContainer.classList.remove('active');
        dashboardContainer.classList.add('active');
        historyContainer.classList.remove('active');
        profileContainer.classList.remove('active');
        leaderboardContainer.classList.remove('active');
        navTabs[0].classList.remove('active');
        navTabs[1].classList.add('active');
        navTabs[2].classList.remove('active');
        navTabs[3].classList.remove('active');
        navTabs[4].classList.remove('active');

        // Check if user is logged in and verified
        if (!state.currentUser || !state.currentUser.emailVerified) {
            dashboardContainer.innerHTML = `
                <div class="dashboard-header">
                    <h1 class="dashboard-title">Dashboard</h1>
                </div>
                <div class="dashboard-card">
                    <div class="card-body">
                        <div class="leaderboard-empty">Please log in and verify your email to view your dashboard</div>
                    </div>
                </div>
            `;
        } else {
            // Load history before refreshing dashboard to avoid race condition
            if (deps.loadUserHistory) {
                await deps.loadUserHistory();
            }
            refreshDashboard();
        }
    } else if (hash === 'history') {
        practiceContainer.classList.remove('active');
        dashboardContainer.classList.remove('active');
        historyContainer.classList.add('active');
        profileContainer.classList.remove('active');
        leaderboardContainer.classList.remove('active');
        navTabs[0].classList.remove('active');
        navTabs[1].classList.remove('active');
        navTabs[2].classList.add('active');
        navTabs[3].classList.remove('active');
        navTabs[4].classList.remove('active');

        // Check if user is logged in and verified
        if (!state.currentUser || !state.currentUser.emailVerified) {
            historyContainer.innerHTML = `
                <div class="dashboard-header">
                    <h1 class="dashboard-title">History</h1>
                </div>
                <div class="dashboard-card">
                    <div class="card-body">
                        <div class="leaderboard-empty">Please log in and verify your email to view your question history</div>
                    </div>
                </div>
            `;
        } else {
            // Make sure history structure exists (in case it was replaced by login message)
            let historyTableWrapper = document.getElementById('historyTableWrapper');
            if (!historyTableWrapper) {
                restoreHistoryStructure();
            }
            if (deps.loadUserHistory) {
                await deps.loadUserHistory();
            }
            renderHistoryTable(state.questionHistory);
        }
    } else if (hash === 'leaderboard') {
        practiceContainer.classList.remove('active');
        dashboardContainer.classList.remove('active');
        historyContainer.classList.remove('active');
        profileContainer.classList.remove('active');
        leaderboardContainer.classList.add('active');
        navTabs[0].classList.remove('active');
        navTabs[1].classList.remove('active');
        navTabs[2].classList.remove('active');
        navTabs[3].classList.add('active');
        navTabs[4].classList.remove('active');
        await loadLeaderboard();
    } else if (hash === 'profile') {
        practiceContainer.classList.remove('active');
        dashboardContainer.classList.remove('active');
        historyContainer.classList.remove('active');
        profileContainer.classList.add('active');
        leaderboardContainer.classList.remove('active');
        navTabs[0].classList.remove('active');
        navTabs[1].classList.remove('active');
        navTabs[2].classList.remove('active');
        navTabs[3].classList.remove('active');
        navTabs[4].classList.add('active');
        await loadProfile();
    } else {
        practiceContainer.classList.add('active');
        dashboardContainer.classList.remove('active');
        historyContainer.classList.remove('active');
        profileContainer.classList.remove('active');
        leaderboardContainer.classList.remove('active');
        navTabs[0].classList.add('active');
        navTabs[1].classList.remove('active');
        navTabs[2].classList.remove('active');
        navTabs[3].classList.remove('active');
        navTabs[4].classList.remove('active');
        // Check profile warning status when returning to practice tab
        checkAndShowProfileWarning();
    }
}
