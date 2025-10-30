// js/app.js
// 主控制器，管理状态、导入模块、绑定事件

import * as dom from './dom.js';
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import * as game from './game.js';

// --- 应用状态 ---
let appData = {
    version: 'v2',
    activeTemplateId: null, 
    templates: [] 
};
let currentSettings = {}; // 当前激活模板的 *配置副本*
let settingsHaveChanged = false;
let modalConfirmCallback = null; 

// --- 导航 ---
function showHomePage() {
    ui.renderHomePage(appData.templates, {
        onStart: loadTemplate,
        onEdit: editTemplate,
        onDelete: (id) => handleDeleteTemplate(id, 'home'),
        onDuplicate: handleDuplicateTemplate
    });
    ui.showPage('home');
}

function showGame() {
    ui.showPage('game');
}

function showSettings() {
    settingsHaveChanged = false;
    ui.showPage('settings');
}

// --- 模板管理 ---

// 从主页加载模板到游戏页面
function loadTemplate(templateId) {
    const template = appData.templates.find(t => t.id === templateId);
    if (!template) {
        ui.showToast("找不到模板!", true);
        return;
    }
    
    appData.activeTemplateId = templateId;
    currentSettings = structuredClone(template.config); 
    
    storage.saveAppData(appData); // 保存 activeTemplateId
    
    ui.populateUI(currentSettings);
    game.stopGame(); // 确保加载后是停止状态
    showGame();
}

// 加载模板到设置页面
function editTemplate(templateId) {
    const template = appData.templates.find(t => t.id === templateId);
    if (!template) {
        ui.showToast("找不到模板!", true);
        return;
    }
    
    appData.activeTemplateId = templateId;
    currentSettings = structuredClone(template.config); 
    
    ui.populateSettingsForm(template, handleAddRotatorField);
    showSettings();
}

// "复制并编辑" 默认模板
function handleDuplicateTemplate(templateId) {
    const defaultTemplate = appData.templates.find(t => t.id === templateId);
    if (!defaultTemplate || !defaultTemplate.isDefault) return;

    const defaultNewName = `${defaultTemplate.name} (副本)`;
    
    modalConfirmCallback = (newName) => {
        if (!newName || newName.trim() === '') {
            ui.showToast("名称不能为空", true);
            return; // 停在模态框
        }

        const newTemplate = structuredClone(defaultTemplate);
        newTemplate.id = `custom-${Date.now()}`;
        newTemplate.name = newName;
        newTemplate.isDefault = false;
        
        appData.templates.push(newTemplate);
        storage.saveAppData(appData);
        
        ui.hideModal();
        editTemplate(newTemplate.id); // 立即进入编辑
    };
    
    ui.showConfirmationModal(
        "复制模板",
        `请输入新副本的名称:`,
        "prompt",
        modalConfirmCallback,
        defaultNewName
    );
}

// 创建新模板
function createNewTemplate() {
    modalConfirmCallback = (newName) => {
        if (!newName || newName.trim() === '') {
            ui.showToast("名称不能为空", true);
            return; // 停在模态框
        }
        
        const newTemplate = {
            id: `custom-${Date.now()}`,
            name: newName,
            isDefault: false,
            isSharedPool: true,
            config: {
                locationText: "我的情景",
                speed: 30,
                sharedPool: ["项目A", "项目B", "项目C"],
                rotators: [
                    { id: 0, label: "轮换位 1", individualPool: [] }
                ]
            }
        };
        appData.templates.push(newTemplate);
        storage.saveAppData(appData);
        ui.hideModal();
        editTemplate(newTemplate.id); // 创建后立即进入编辑
    };
    
    ui.showConfirmationModal(
        "创建新模板", 
        "请输入新模板的名称:", 
        "prompt", 
        modalConfirmCallback,
        "我的新模板"
    );
}

// --- 设置页面逻辑 ---

// 保存设置
function saveSettings() {
    if (game.getIsRunning()) game.stopGame();

    const templateIndex = appData.templates.findIndex(t => t.id === appData.activeTemplateId);
    if (templateIndex === -1) {
        ui.showToast("错误: 找不到模板!", true);
        return;
    }
    
    // 从表单读取数据
    const newName = dom.settingTemplateNameInput.value || "未命名模板";
    const newLocationText = dom.settingLocationInput.value;
    const newSpeed = parseInt(dom.settingSpeedSlider.value, 10);
    const newSharedPool = dom.settingPoolTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    
    const newRotators = [];
    const rotatorInputs = dom.settingsRotatorsContainer.querySelectorAll('input');
    rotatorInputs.forEach((input, index) => {
        if (input.value) {
            // V8: 独立池逻辑将在此处添加
            newRotators.push({ 
                id: index, 
                label: input.value, 
                individualPool: [] // V8 待办
            });
        }
    });

    // 更新 appData 中的模板
    const template = appData.templates[templateIndex];
    template.name = newName;
    template.isSharedPool = dom.settingSharePoolToggle.checked; 
    template.config = {
        locationText: newLocationText, 
        speed: newSpeed,
        sharedPool: newSharedPool,
        rotators: newRotators
    };
    
    // 将更新后的配置加载为 currentSettings
    currentSettings = structuredClone(template.config);
    
    storage.saveAppData(appData);
    settingsHaveChanged = false;
    
    ui.populateUI(currentSettings); // 使用新保存的设置更新UI
    showGame();
    ui.showToast("设置已保存");
}

// 重置模板(恢复到上次保存)
function handleResetTemplate() {
    modalConfirmCallback = () => {
        const template = appData.templates.find(t => t.id === appData.activeTemplateId);
        if (template) {
            editTemplate(template.id); // 这会重新加载并填充表单
            ui.showToast("已重置为上次保存的状态");
        }
        ui.hideModal();
    };
    
    ui.showConfirmationModal(
        "重置模板",
        "你确定要丢弃所有未保存的更改, 恢复到上次保存的状态吗？",
        "confirm-cancel",
        modalConfirmCallback
    );
}

// 删除模板
function handleDeleteTemplate(templateId, from) {
    const template = appData.templates.find(t => t.id === templateId);
    if (!template || template.isDefault) return;
    
    modalConfirmCallback = () => {
        appData.templates = appData.templates.filter(t => t.id !== templateId);
        if (appData.activeTemplateId === templateId) {
            appData.activeTemplateId = config.defaultOverwatchTemplate.id;
        }
        storage.saveAppData(appData);
        
        ui.hideModal();
        ui.showToast(`模板 "${template.name}" 已删除`);
        
        // 如果在设置页删除，则返回主页
        if (from === 'settings') {
            showHomePage();
        } else {
            // 否则 (在主页删除)，刷新主页列表
            ui.renderHomePage(appData.templates, {
                onStart: loadTemplate,
                onEdit: editTemplate,
                onDelete: (id) => handleDeleteTemplate(id, 'home'),
                onDuplicate: handleDuplicateTemplate
            });
        }
    };
    
    ui.showConfirmationModal(
        `删除模板 "${template.name}"`,
        "你确定要永久删除这个模板吗？此操作无法撤销。",
        "confirm-cancel",
        modalConfirmCallback
    );
}

// 在设置页添加轮换位字段的包装器
function handleAddRotatorField(value = '', markAsChange = true) {
    if (markAsChange) settingsHaveChanged = true;
    
    ui.addRotatorField(value, 
        () => { settingsHaveChanged = true; }, // onFieldChanged
        () => { settingsHaveChanged = true; }  // onFieldRemoved
    );
}


// --- 初始化和事件绑定 ---
window.addEventListener('DOMContentLoaded', () => {
    
    // 1. 初始化游戏逻辑，并传入设置获取器
    game.initGame(() => currentSettings);
    
    // 2. 加载数据
    appData = storage.initializeApp();
    
    // 3. 显示主页
    showHomePage();
    dom.loader.classList.add('hidden');

    // --- 绑定事件监听 ---
    
    // 主页
    dom.createNewTemplateBtn.addEventListener('click', createNewTemplate);
    
    // 游戏页
    dom.togglePauseButton.addEventListener('click', game.togglePause);
    dom.restartButton.addEventListener('click', () => {
        game.resetGame(() => ui.populateUI(currentSettings));
    });
    dom.settingsButton.addEventListener('click', () => {
        // 加载当前模板到设置页
        const template = appData.templates.find(t => t.id === appData.activeTemplateId);
        if (template) {
            editTemplate(template.id);
        } else {
            ui.showToast("错误: 找不到当前模板", true);
            showHomePage();
        }
    });
    dom.homeBtn.addEventListener('click', () => {
        if (game.getIsRunning()) game.stopGame();
        showHomePage();
    });

    // 设置页
    dom.saveSettingsButton.addEventListener('click', saveSettings);
    dom.addRotatorButton.addEventListener('click', () => handleAddRotatorField(undefined, true));
    dom.resetTemplateBtn.addEventListener('click', handleResetTemplate);
    dom.deleteTemplateBtn.addEventListener('click', () => handleDeleteTemplate(appData.activeTemplateId, 'settings'));

    // 设置页导航
    dom.backToGameBtn.addEventListener('click', () => {
        if (settingsHaveChanged) {
            modalConfirmCallback = null; // 重置
            ui.showConfirmationModal('未保存的更改', '你有未保存的更改。你要做什么？', 'save-discard');
        } else {
            showGame();
        }
    });
    
    dom.homeBtnSettings.addEventListener('click', () => {
         if (settingsHaveChanged) {
            modalConfirmCallback = () => {
                ui.hideModal();
                showHomePage();
            };
            ui.showConfirmationModal('未保存的更改', '你确定要返回主页并丢弃所有更改吗？', 'confirm-cancel', modalConfirmCallback);
         } else {
            showHomePage();
         }
    });
    
    // 模态框按钮
    dom.modalCloseBtn.addEventListener('click', ui.hideModal);
    dom.modalCancelBtn.addEventListener('click', ui.hideModal);
    
    dom.modalDiscardBtn.addEventListener('click', () => {
        ui.hideModal();
        showGame(); // 返回游戏页
        settingsHaveChanged = false;
        ui.showToast("修改已丢弃");
    });
    
    dom.modalSaveBtn.addEventListener('click', () => {
        ui.hideModal();
        saveSettings(); // 保存并自动返回游戏页
    });
    
    dom.modalConfirmBtn.addEventListener('click', () => {
        if (modalConfirmCallback) {
            const inputValue = dom.modalInput.value;
            modalConfirmCallback(inputValue); // 传递值
        }
        // 重置回调，防止重复触发
        modalConfirmCallback = null; 
    });

    // 标记更改 (仅限非禁用时)
    const markChanged = () => { if (!settingsHaveChanged) settingsHaveChanged = true; };
    dom.settingTemplateNameInput.addEventListener('input', markChanged);
    dom.settingLocationInput.addEventListener('input', markChanged);
    dom.settingPoolTextarea.addEventListener('input', markChanged);
    dom.settingSpeedSlider.addEventListener('input', (e) => {
        dom.settingSpeedValueDisplay.textContent = `${e.target.value} 个/秒`;
        markChanged();
    });
});
