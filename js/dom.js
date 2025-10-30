// js/dom.js
// 获取并导出所有需要操作的 DOM 元素

export const loader = document.getElementById('loader');
export const homePage = document.getElementById('home-page');
export const gamePage = document.getElementById('game-page');
export const settingsPage = document.getElementById('settings-page');

// 主页
export const templateListEl = document.getElementById('template-list');
export const createNewTemplateBtn = document.getElementById('create-new-template-btn');

// 游戏页面
export const locationTextEl = document.getElementById('location-text');
export const rotatorGridEl = document.getElementById('rotator-grid');
export const togglePauseButton = document.getElementById('toggle-pause-btn');
export const restartButton = document.getElementById('restart-btn');
export const settingsButton = document.getElementById('settings-btn');
export const homeBtn = document.getElementById('home-btn');

// 设置页面
export const backToGameBtn = document.getElementById('back-to-game-btn');
export const settingsTitleEl = document.getElementById('settings-title');
export const settingTemplateNameInput = document.getElementById('setting-template-name');
export const saveSettingsButton = document.getElementById('save-settings-btn');
export const addRotatorButton = document.getElementById('add-rotator-btn');
export const settingLocationInput = document.getElementById('setting-location');
export const settingsRotatorsContainer = document.getElementById('settings-rotators-container');
export const settingPoolTextarea = document.getElementById('setting-pool');
export const settingSpeedSlider = document.getElementById('setting-speed');
export const settingSpeedValueDisplay = document.getElementById('setting-speed-value');
export const resetTemplateBtn = document.getElementById('reset-template-btn');
export const deleteTemplateBtn = document.getElementById('delete-template-btn');
export const settingSharePoolToggle = document.getElementById('setting-share-pool');
export const sharedPoolContainer = document.getElementById('shared-pool-container');

// 新增: 设置页操作按钮容器
export const settingsActionsPrimary = document.getElementById('settings-actions-primary');
export const settingsActionsDanger = document.getElementById('settings-actions-danger');

// 模态框
export const confirmationModal = document.getElementById('confirmation-modal');
export const modalTitle = document.getElementById('modal-title');
export const modalMessage = document.getElementById('modal-message');
export const modalCloseBtn = document.getElementById('modal-close-btn');
export const modalSaveBtn = document.getElementById('modal-save-btn');
export const modalDiscardBtn = document.getElementById('modal-discard-btn');
export const modalConfirmBtn = document.getElementById('modal-confirm-btn');
export const modalCancelBtn = document.getElementById('modal-cancel-btn');
export const modalButtonsSaveDiscard = document.getElementById('modal-buttons-save-discard');
export const modalButtonsConfirmCancel = document.getElementById('modal-buttons-confirm-cancel');
export const modalInputContainer = document.getElementById('modal-input-container');
export const modalInputLabel = document.getElementById('modal-input-label');
export const modalInput = document.getElementById('modal-input');

// Toast
export const toastNotification = document.getElementById('toast-notification');

// 新增: 上下文菜单
export const contextMenu = document.getElementById('context-menu');

// 新增: 独立池模态框
export const individualPoolModal = document.getElementById('individual-pool-modal');
export const individualPoolTitle = document.getElementById('individual-pool-title');
export const individualPoolTextarea = document.getElementById('individual-pool-textarea');
export const individualPoolSaveBtn = document.getElementById('individual-pool-save-btn');
export const individualPoolCloseBtn = document.getElementById('individual-pool-close-btn');

