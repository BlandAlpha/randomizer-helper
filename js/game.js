// js/game.js
// 包含游戏循环的核心逻辑

import * as dom from './dom.js';

let isRunning = false;
let intervalId = null;
let lastRotatorValues = {};
let getSettings = () => ({}); // 获取当前设置的函数

/**
 * 初始化游戏模块
 * @param {Function} settingsGetter - 一个返回 currentSettings 对象的函数
 */
export function initGame(settingsGetter) {
    getSettings = settingsGetter;
}

/**
 * 开始游戏循环
 */
export function startGame() {
    if (isRunning) return;
    isRunning = true;
    dom.togglePauseButton.textContent = '暂停';
    dom.togglePauseButton.classList.remove('bg-green-600', 'hover:bg-green-700');
    dom.togglePauseButton.classList.add('bg-red-600', 'hover:bg-red-700');
    
    const currentSettings = getSettings();
    let currentSpeed = parseInt(currentSettings.speed, 10) || 30;
    let intervalInMs = 1000 / currentSpeed;
    
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateRotators, intervalInMs); 
}

/**
 * 停止游戏循环
 */
export function stopGame() {
    isRunning = false;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (dom.togglePauseButton) {
        dom.togglePauseButton.textContent = '开始';
        dom.togglePauseButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        dom.togglePauseButton.classList.add('bg-green-600', 'hover:bg-green-700');
    }
}

/**
 * 切换暂停/继续状态
 */
export function togglePause() {
    if (isRunning) {
        stopGame();
        dom.togglePauseButton.textContent = '继续'; 
    } else {
        startGame();
    }
}

/**
 * 重置游戏(清除轮换值)
 * @param {Function} onReset - 重置时调用的回调(用于 populateUI)
 */
export function resetGame(onReset) {
    if (isRunning) stopGame();
    lastRotatorValues = {};
    onReset(); // 调用 app.js 中的 populateUI
    dom.togglePauseButton.textContent = '开始';
    dom.togglePauseButton.classList.remove('bg-red-600', 'hover:bg-red-700');
    dom.togglePauseButton.classList.add('bg-green-600', 'hover:bg-green-700');
}

/**
 * 更新所有轮换位的值
 */
function updateRotators() {
    const currentSettings = getSettings();
    if (!currentSettings.rotators) return;
    
    currentSettings.rotators.forEach(rotator => {
        const el = document.getElementById(`rotator-value-${rotator.id}`);
        if (el) el.textContent = getRandomFromPool(rotator.id);
    });
}

/**
 * 从轮换池中获取一个随机值
 * @param {number} rotatorId - 轮换位ID
 * @returns {string}
 */
function getRandomFromPool(rotatorId) {
    const currentSettings = getSettings();
    
    let pool;
    
    if (currentSettings.isSharedPool) {
        // --- 共享池逻辑 ---
        pool = currentSettings.sharedPool;
    } else {
        // --- 独立池逻辑 ---
        const rotator = currentSettings.rotators.find(r => r.id === rotatorId);
        if (rotator) {
            pool = rotator.individualPool;
        } else {
            pool = []; // 未找到指定 rotator, 使用空池
        }
    }
    
    if (!pool || pool.length === 0) return '???';
    if (pool.length === 1) return pool[0];
    const lastValue = lastRotatorValues[rotatorId];
    let newValue = '';
    do {
        newValue = pool[Math.floor(Math.random() * pool.length)];
    } while (newValue === lastValue && pool.length > 1); // 确保池大于1时才检查
    lastRotatorValues[rotatorId] = newValue;
    return newValue;
}

/**
 * 检查游戏是否正在运行
 * @returns {boolean}
 */
export function getIsRunning() {
    return isRunning;
}

