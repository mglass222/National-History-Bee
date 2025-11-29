// XP System module - levels, ranks, tier shields, and level-up notifications
import { state, RANK_CONFIG } from './state.js';

// XP threshold for each level (cumulative)
export function getXPForLevel(level) {
    if (level <= 0) return 0;
    if (level <= 10) return level * 100;
    if (level <= 20) return 1000 + (level - 10) * 200;
    if (level <= 30) return 3000 + (level - 20) * 400;
    if (level <= 40) return 7000 + (level - 30) * 600;
    if (level <= 50) return 13000 + (level - 40) * 800;
    if (level <= 60) return 21000 + (level - 50) * 1000;
    if (level <= 70) return 31000 + (level - 60) * 1500;
    if (level <= 80) return 46000 + (level - 70) * 2000;
    if (level <= 90) return 66000 + (level - 80) * 3000;
    return 96000 + (level - 90) * 5000;
}

export function getLevelFromXP(xp) {
    if (xp < 0) return 1;
    for (let level = 1; level <= 100; level++) {
        if (xp < getXPForLevel(level)) return Math.max(1, level - 1);
    }
    return 100;
}

export function getTierForLevel(level) {
    for (const tier of RANK_CONFIG.tiers) {
        if (level >= tier.minLevel && level <= tier.maxLevel) {
            return tier;
        }
    }
    return RANK_CONFIG.tiers[0];
}

export function getRankTitle(level) {
    return RANK_CONFIG.titles[level] || RANK_CONFIG.titles[100];
}

export function calculateLevelProgress(xp) {
    const level = getLevelFromXP(xp);
    // getXPForLevel returns XP needed to REACH that level, so level 1 starts at 0 XP
    const currentLevelXP = level === 1 ? 0 : getXPForLevel(level);
    const nextLevelXP = getXPForLevel(level + 1);
    const progress = Math.max(0, xp - currentLevelXP);
    const needed = nextLevelXP - currentLevelXP;
    return {
        level,
        xp,
        progress,
        needed,
        percentage: Math.min(100, (progress / needed) * 100),
        tier: getTierForLevel(level),
        title: getRankTitle(level)
    };
}

// SVG Shield Generator - creates tier-appropriate shields
export function generateTierShield(level, size = 'medium', showLevelNumber = false) {
    const tier = getTierForLevel(level);
    const tierName = tier.name.toLowerCase();
    const color = tier.color;
    const colorLight = tier.colorLight;

    // Size dimensions
    const sizes = {
        small: { width: 32, height: 38, fontSize: 12, strokeWidth: 1.5 },
        medium: { width: 48, height: 58, fontSize: 16, strokeWidth: 2 },
        large: { width: 80, height: 96, fontSize: 26, strokeWidth: 2.5 }
    };
    const s = sizes[size] || sizes.medium;

    // Shield path (classic heraldic shape)
    const shieldPath = `M ${s.width/2} ${s.height * 0.05}
        L ${s.width * 0.95} ${s.height * 0.15}
        L ${s.width * 0.95} ${s.height * 0.5}
        Q ${s.width * 0.95} ${s.height * 0.75} ${s.width/2} ${s.height * 0.95}
        Q ${s.width * 0.05} ${s.height * 0.75} ${s.width * 0.05} ${s.height * 0.5}
        L ${s.width * 0.05} ${s.height * 0.15}
        Z`;

    // Tier-specific decorations
    let decorations = '';

    if (tierName === 'silver' || tierName === 'gold') {
        // Scroll/laurel accent at top
        decorations = `<path d="M ${s.width * 0.3} ${s.height * 0.2} Q ${s.width/2} ${s.height * 0.12} ${s.width * 0.7} ${s.height * 0.2}"
            fill="none" stroke="${colorLight}" stroke-width="${s.strokeWidth * 0.5}" opacity="0.6"/>`;
    } else if (tierName === 'platinum' || tierName === 'diamond') {
        // Star/gem accent
        const cx = s.width / 2;
        const cy = s.height * 0.25;
        const r = s.width * 0.08;
        decorations = `<polygon points="${cx},${cy-r} ${cx+r*0.3},${cy-r*0.3} ${cx+r},${cy} ${cx+r*0.3},${cy+r*0.3} ${cx},${cy+r} ${cx-r*0.3},${cy+r*0.3} ${cx-r},${cy} ${cx-r*0.3},${cy-r*0.3}"
            fill="${colorLight}" opacity="0.8"/>`;
    } else if (tierName === 'master') {
        // Crown accent
        const cx = s.width / 2;
        const cy = s.height * 0.22;
        const cw = s.width * 0.3;
        const ch = s.height * 0.08;
        decorations = `<path d="M ${cx-cw/2} ${cy+ch/2} L ${cx-cw/2} ${cy-ch/2} L ${cx-cw/4} ${cy} L ${cx} ${cy-ch/2} L ${cx+cw/4} ${cy} L ${cx+cw/2} ${cy-ch/2} L ${cx+cw/2} ${cy+ch/2} Z"
            fill="${colorLight}" opacity="0.8"/>`;
    } else if (tierName === 'grandmaster') {
        // Flame/ornate accent
        const cx = s.width / 2;
        const cy = s.height * 0.2;
        decorations = `<path d="M ${cx} ${cy-s.height*0.08} Q ${cx+s.width*0.1} ${cy-s.height*0.04} ${cx+s.width*0.08} ${cy+s.height*0.02} Q ${cx+s.width*0.04} ${cy} ${cx} ${cy+s.height*0.04} Q ${cx-s.width*0.04} ${cy} ${cx-s.width*0.08} ${cy+s.height*0.02} Q ${cx-s.width*0.1} ${cy-s.height*0.04} ${cx} ${cy-s.height*0.08}"
            fill="${colorLight}" opacity="0.9"/>`;
    }

    // Generate SVG
    return `<div class="tier-shield size-${size}">
        <svg viewBox="0 0 ${s.width} ${s.height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="shieldGrad-${tierName}-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${colorLight};stop-opacity:1" />
                    <stop offset="50%" style="stop-color:${color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
                </linearGradient>
                <filter id="shieldShadow-${size}" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
                </filter>
            </defs>
            <!-- Shield background -->
            <path d="${shieldPath}" fill="url(#shieldGrad-${tierName}-${size})" stroke="${color}" stroke-width="${s.strokeWidth}" filter="url(#shieldShadow-${size})"/>
            <!-- Inner highlight -->
            <path d="${shieldPath}" fill="none" stroke="${colorLight}" stroke-width="${s.strokeWidth * 0.5}" opacity="0.4" transform="scale(0.9) translate(${s.width * 0.055}, ${s.height * 0.055})"/>
            <!-- Tier decorations -->
            ${decorations}
            ${showLevelNumber ? `<!-- Level number -->
            <text x="${s.width/2}" y="${s.height * 0.58}" text-anchor="middle" dominant-baseline="middle"
                font-family="Arial, sans-serif" font-weight="bold" font-size="${s.fontSize}px"
                fill="white" stroke="${color}" stroke-width="0.5">${level}</text>` : ''}
        </svg>
    </div>`;
}

// Render full level badge with shield, level info, and progress bar
export function renderLevelBadge(xp, showProgress = true) {
    const progress = calculateLevelProgress(xp);
    const tierClass = progress.tier.name.toLowerCase();

    let progressHtml = '';
    if (showProgress) {
        progressHtml = `
            <div class="level-badge-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill tier-${tierClass}" style="width: ${progress.percentage}%"></div>
                </div>
                <span class="progress-bar-text">${progress.progress} / ${progress.needed} XP</span>
            </div>`;
    }

    return `<div class="level-badge tier-${tierClass}">
        ${generateTierShield(progress.level, 'medium')}
        <div class="level-badge-info">
            <span class="level-badge-title tier-${tierClass}">${progress.title}</span>
            ${progressHtml}
        </div>
    </div>`;
}

// Render compact level badge for header/leaderboard
export function renderCompactLevelBadge(xp) {
    const progress = calculateLevelProgress(xp);
    return generateTierShield(progress.level, 'small', true);
}

// Show level up notification
export function showLevelUpNotification(newLevel) {
    const tier = getTierForLevel(newLevel);
    const title = getRankTitle(newLevel);

    // Create overlay and notification if they don't exist
    let overlay = document.getElementById('levelUpOverlay');
    let notification = document.getElementById('levelUpNotification');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'levelUpOverlay';
        overlay.className = 'level-up-overlay';
        overlay.onclick = closeLevelUpNotification;
        document.body.appendChild(overlay);
    }

    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'levelUpNotification';
        notification.className = 'level-up-notification';
        document.body.appendChild(notification);
    }

    notification.innerHTML = `
        <div class="level-up-title">Rank Up!</div>
        ${generateTierShield(newLevel, 'large')}
        <div class="new-title" style="color: ${tier.color}">${title}</div>
        <button onclick="closeLevelUpNotification()" style="margin-top: 16px; padding: 10px 24px; background: ${tier.color}; color: white; border: none; border-radius: 8px; font-size: 1em; cursor: pointer;">Continue</button>
    `;

    // Show with animation
    setTimeout(() => {
        overlay.classList.add('show');
        notification.classList.add('show');
    }, 100);
}

export function closeLevelUpNotification() {
    const overlay = document.getElementById('levelUpOverlay');
    const notification = document.getElementById('levelUpNotification');
    if (overlay) overlay.classList.remove('show');
    if (notification) notification.classList.remove('show');
}

// Update XP display in settings panel
export function updateXPDisplay() {
    const xpContainer = document.getElementById('xpDisplayContainer');
    if (!state.userProfile || !xpContainer) return;

    const xp = state.userProfile.totalPoints || 0;
    const progress = calculateLevelProgress(xp);
    const tierClass = progress.tier.name.toLowerCase();

    xpContainer.innerHTML = `
        <div class="xp-header">
            ${generateTierShield(progress.level, 'medium')}
            <div class="xp-info">
                <div class="xp-level-title">
                    <span class="xp-level">Level ${progress.level}</span>
                    <span class="xp-rank-title tier-${tierClass}" style="color: ${progress.tier.color}">${progress.title}</span>
                </div>
            </div>
        </div>
        <div class="xp-progress-wrapper">
            <div class="xp-progress-bar">
                <div class="xp-progress-fill" style="width: ${progress.percentage}%; background: linear-gradient(90deg, ${progress.tier.color}, ${progress.tier.colorLight})"></div>
            </div>
            <div class="xp-progress-text">
                <span>${progress.progress} / ${progress.needed} XP</span>
                <span>Total: ${xp} XP</span>
            </div>
        </div>
    `;
}
