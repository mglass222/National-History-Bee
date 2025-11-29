// Filter management module
import { state } from './state.js';

export async function loadMetadata(questionSet = 'nat_hist_bee') {
    try {
        const response = await fetch(`src/assets/${questionSet}_question_metadata.json`);
        const data = await response.json();
        state.questionMetadata = data.categories;
        console.log(`Loaded metadata for ${Object.keys(state.questionMetadata).length} questions`);
    } catch (error) {
        console.error('Error loading metadata:', error);
    }
}

export function onRegionFilterChange() {
    state.activeFilters.region = document.getElementById('regionFilter').value;
    updateSelectedTypesDisplay();
    updateFilterDisplay();
}

export function onTimePeriodFilterChange() {
    state.activeFilters.timePeriod = document.getElementById('timeFilter').value;
    updateSelectedTypesDisplay();
    updateFilterDisplay();
}

export function onAnswerTypeFilterChange() {
    const select = document.getElementById('answerTypeFilter');
    const value = select.value;

    if (value === 'all') {
        state.activeFilters.answerTypes = [];
    } else {
        if (!state.activeFilters.answerTypes.includes(value)) {
            state.activeFilters.answerTypes.push(value);
        }
    }
    select.value = 'all';
    updateSelectedTypesDisplay();
    updateFilterDisplay();
}

export function updateSelectedTypesDisplay() {
    const regionIndicator = document.getElementById('regionIndicator');
    const regionTagsContainer = document.getElementById('regionTags');
    const timePeriodIndicator = document.getElementById('timePeriodIndicator');
    const timePeriodTagsContainer = document.getElementById('timePeriodTags');
    const typesIndicator = document.getElementById('questionTypesIndicator');
    const typesTagsContainer = document.getElementById('questionTypesTags');

    // Region display
    const regionTags = [];
    if (state.activeFilters.region !== 'all') {
        regionTags.push(`<span class="question-type-filter-tag">${state.activeFilters.region}<span class="remove-type" onclick="clearRegionFilter()">×</span></span>`);
    }

    if (regionTags.length === 0) {
        regionIndicator.style.display = 'none';
        regionTagsContainer.innerHTML = '';
    } else {
        regionIndicator.style.display = 'flex';
        regionTagsContainer.innerHTML = regionTags.join('');
    }

    // Time period display
    const timePeriodTags = [];
    if (state.activeFilters.timePeriod !== 'all') {
        timePeriodTags.push(`<span class="question-type-filter-tag">${state.activeFilters.timePeriod}<span class="remove-type" onclick="clearTimePeriodFilter()">×</span></span>`);
    }

    if (timePeriodTags.length === 0) {
        timePeriodIndicator.style.display = 'none';
        timePeriodTagsContainer.innerHTML = '';
    } else {
        timePeriodIndicator.style.display = 'flex';
        timePeriodTagsContainer.innerHTML = timePeriodTags.join('');
    }

    // Question types display
    const typeTags = state.activeFilters.answerTypes.map(type =>
        `<span class="question-type-filter-tag">${type}<span class="remove-type" onclick="removeQuestionType('${type.replace(/'/g, "\\'")}')">×</span></span>`
    );

    if (typeTags.length === 0) {
        typesIndicator.style.display = 'none';
        typesTagsContainer.innerHTML = '';
    } else {
        typesIndicator.style.display = 'flex';
        typesTagsContainer.innerHTML = typeTags.join('');
    }
}

export function clearRegionFilter() {
    state.activeFilters.region = 'all';
    document.getElementById('regionFilter').value = 'all';
    updateSelectedTypesDisplay();
    updateFilterDisplay();
}

export function clearTimePeriodFilter() {
    state.activeFilters.timePeriod = 'all';
    document.getElementById('timeFilter').value = 'all';
    updateSelectedTypesDisplay();
    updateFilterDisplay();
}

export function removeQuestionType(type) {
    state.activeFilters.answerTypes = state.activeFilters.answerTypes.filter(t => t !== type);
    updateSelectedTypesDisplay();
    updateFilterDisplay();
}

export function getFilteredQuestions(category) {
    if (!state.questions[category]) return [];

    return state.questions[category].filter(q => {
        const meta = state.questionMetadata[q.id];
        if (!meta) return true;

        if (state.activeFilters.region !== 'all') {
            if (!meta.regions.includes(state.activeFilters.region)) return false;
        }

        if (state.activeFilters.timePeriod !== 'all') {
            if (!meta.time_periods.includes(state.activeFilters.timePeriod)) return false;
        }

        if (state.activeFilters.answerTypes.length > 0) {
            if (!state.activeFilters.answerTypes.includes(meta.answer_type)) return false;
        }

        return true;
    });
}

export function updateFilterDisplay() {
    const matchingCount = document.getElementById('matchingCount');

    const hasFilters = state.activeFilters.answerTypes.length > 0 ||
                      state.activeFilters.region !== 'all' ||
                      state.activeFilters.timePeriod !== 'all';

    const category = document.getElementById('category').value;
    const filtered = getFilteredQuestions(category);
    const total = state.questions[category] ? state.questions[category].length : 0;

    if (hasFilters) {
        matchingCount.style.display = 'block';
        matchingCount.className = 'matching-count';

        if (filtered.length === 0) {
            matchingCount.className += ' error';
            matchingCount.textContent = 'No questions match these filters';
        } else if (filtered.length < 10) {
            matchingCount.className += ' warning';
            matchingCount.textContent = `Only ${filtered.length} questions match`;
        } else {
            matchingCount.textContent = `${filtered.length} of ${total} questions match`;
        }
    } else {
        matchingCount.style.display = 'none';
    }
}

export function removeFilter(type) {
    switch(type) {
        case 'region':
            state.activeFilters.region = 'all';
            document.getElementById('regionFilter').value = 'all';
            break;
        case 'timePeriod':
            state.activeFilters.timePeriod = 'all';
            document.getElementById('timeFilter').value = 'all';
            break;
    }
    updateFilterDisplay();
}

export function clearAllFilters() {
    state.activeFilters.region = 'all';
    state.activeFilters.timePeriod = 'all';
    state.activeFilters.answerTypes = [];

    document.getElementById('regionFilter').value = 'all';
    document.getElementById('timeFilter').value = 'all';
    const secondaryFilter = document.getElementById('secondaryFilter');
    if (secondaryFilter) secondaryFilter.value = 'all';
    document.getElementById('answerTypeFilter').value = 'all';

    updateSelectedTypesDisplay();
    updateFilterDisplay();
}

export function updateRegionFilterState() {
    const questionSet = document.getElementById('questionSet').value;
    const regionFilter = document.getElementById('regionFilter');
    const regionSection = document.getElementById('regionFilterSection');
    const isUSHistory = questionSet.startsWith('us_');

    regionFilter.disabled = isUSHistory;
    regionSection.classList.toggle('disabled', isUSHistory);

    if (isUSHistory) {
        regionFilter.value = 'all';
        state.activeFilters.region = 'all';
    }
}

export function initFilterEventListeners() {
    document.getElementById('regionFilter')?.addEventListener('change', onRegionFilterChange);
    document.getElementById('timeFilter')?.addEventListener('change', onTimePeriodFilterChange);
    document.getElementById('answerTypeFilter')?.addEventListener('change', onAnswerTypeFilterChange);
}
