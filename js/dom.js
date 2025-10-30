// js/dom.js
// 获取并导出所有需要操作的 DOM 元素

export const loader = document.getElementById('loader');
export const homePage = document.getElementById('home-page');
export const gamePage = document.getElementById('game-page');
export const settingsPage = document.getElementById('settings-page');

// 主页
export const createNewTemplateBtn = document.getElementById('create-new-template-btn');
export const defaultTemplatesSection = document.getElementById('default-templates-section');
export const customTemplatesSection = document.getElementById('custom-templates-section');
export const defaultTemplateList = document.getElementById('default-template-list');
export const customTemplateList = document.getElementById('custom-template-list');
export const emptyStatePlaceholder = document.getElementById('empty-state-placeholder');

// 游戏页
export const homeBtn = document.getElementById('home-btn');
export const projectTitleGame = document.getElementById('project-title-game');
export const scenarioTitleGame = document.getElementById('scenario-title-game');
export const settingsBtnContainer = document.getElementById('settings-btn-container');
export const settingsButton = document.getElementById('settings-btn');
export const rotatorGridEl = document.getElementById('rotator-grid');
export const togglePauseButton = document.getElementById('toggle-pause-btn');
export const restartButton = document.getElementById('restart-btn');

// 设置页
export const settingsTitleEl = document.getElementById('settings-title');
export const backToGameBtn = document.getElementById('back-to-game-btn');
export const settingTemplateNameLabel = document.getElementById('setting-template-name-label');
export const settingTemplateNameInput = document.getElementById('setting-template-name');
export const settingLocationInput = document.getElementById('setting-location');
export const settingPoolTypeSharedBtn = document.getElementById('setting-pool-type-shared-btn');
export const settingPoolTypeIndividualBtn = document.getElementById('setting-pool-type-individual-btn');
export const settingsRotatorsContainer = document.getElementById('settings-rotators-container');
export const addRotatorButton = document.getElementById('add-rotator-btn');
export const sharedPoolContainer = document.getElementById('shared-pool-container');
export const settingPoolTextarea = document.getElementById('setting-pool');
export const settingsActionsPrimary = document.getElementById('settings-actions-primary');
export const saveSettingsButton = document.getElementById('save-settings-btn');
export const settingsActionsDanger = document.getElementById('settings-actions-danger');
export const deleteTemplateBtn = document.getElementById('delete-template-btn');

// 模态框 (通用)
export const confirmationModal = document.getElementById('confirmation-modal');
export const modalTitle = document.getElementById('modal-title');
export const modalMessage = document.getElementById('modal-message');
export const modalCloseBtn = document.getElementById('modal-close-btn');
export const modalInputContainer = document.getElementById('modal-input-container');
export const modalInputLabel = document.getElementById('modal-input-label');
export const modalInput = document.getElementById('modal-input');
export const modalSegmentContainer = document.getElementById('modal-segment-container');
export const modalPoolTypeSharedBtn = document.getElementById('modal-pool-type-shared-btn');
export const modalPoolTypeIndividualBtn = document.getElementById('modal-pool-type-individual-btn');
export const modalButtonsSaveDiscard = document.getElementById('modal-buttons-save-discard');
export const modalSaveBtn = document.getElementById('modal-save-btn');
export const modalDiscardBtn = document.getElementById('modal-discard-btn');
export const modalButtonsConfirmCancel = document.getElementById('modal-buttons-confirm-cancel');
export const modalConfirmBtn = document.getElementById('modal-confirm-btn');
export const modalCancelBtn = document.getElementById('modal-cancel-btn');

// Toast
export const toastNotification = document.getElementById('toast-notification');

// 上下文菜单
export const contextMenu = document.getElementById('context-menu');

// 独立池模态框
export const individualPoolModal = document.getElementById('individual-pool-modal');
export const individualPoolTitle = document.getElementById('individual-pool-title');
export const individualPoolCloseBtn = document.getElementById('individual-pool-close-btn');
export const individualPoolTextarea = document.getElementById('individual-pool-textarea');
export const individualPoolSaveBtn = document.getElementById('individual-pool-save-btn');

