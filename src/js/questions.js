// Questions module - loading and stats
import { state } from './state.js';
import { loadMetadata, updateSelectedTypesDisplay, updateFilterDisplay, updateRegionFilterState } from './filters.js';

export async function loadQuestions(questionSet = 'nat_hist_bee') {
    try {
        const response = await fetch(`src/assets/${questionSet}_questions.json`);
        state.questions = await response.json();
        await loadMetadata(questionSet);
        updateStats();
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

export function updateStats() {
    const statsEl = document.getElementById('stats');
    if (statsEl) statsEl.textContent = `${state.questionsPracticed} questions practiced`;
}

export function getSpeedLabel(speed) {
    if (speed <= 25) return 'Very Fast';
    if (speed <= 40) return 'Fast';
    if (speed <= 60) return 'Medium';
    if (speed <= 80) return 'Slow';
    return 'Very Slow';
}

export function updateDifficultyDisplay() {
    const category = document.getElementById('category').value;
    const difficultyNames = {
        'preliminary': 'Preliminary',
        'quarterfinals': 'Quarterfinals',
        'semifinals': 'Semifinals',
        'finals': 'Finals'
    };
    document.getElementById('difficultyValue').textContent = difficultyNames[category] || category;
}

export async function onQuestionSetChange() {
    const questionSet = document.getElementById('questionSet').value;

    state.activeFilters = {
        region: 'all',
        timePeriod: 'all',
        answerTypes: []
    };
    document.getElementById('regionFilter').value = 'all';
    document.getElementById('timeFilter').value = 'all';
    updateSelectedTypesDisplay();
    updateFilterDisplay();
    updateRegionFilterState();

    await loadQuestions(questionSet);
    updateDifficultyDisplay();
}

export function initQuestionEventListeners() {
    document.getElementById('speed').addEventListener('input', (e) => {
        const speed = 110 - e.target.value;
        const label = getSpeedLabel(parseInt(speed));
        document.getElementById('speedValue').textContent = speed;
        document.getElementById('speedLabel').textContent = label;
    });

    document.getElementById('category').addEventListener('change', () => {
        updateDifficultyDisplay();
        updateStats();
    });

    document.getElementById('questionSet').addEventListener('change', onQuestionSetChange);
}
