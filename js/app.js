// js/app.js
// 主控制器，管理状态、导入模块、绑定事件

import * as dom from './dom.js';
import * as config from './config.js'; // 只导入 config.js 中的 KEYS
import { allDefaultTemplates } from './defaultTemplates.js'; // 导入模板
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
let editingRotatorId = null; // 新增: 跟踪正在编辑的独立池ID

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
    // 修正: 将 isSharedPool 和 config 一起复制到 currentSettings
    currentSettings = {
        ...structuredClone(template.config),
        isSharedPool: template.isSharedPool 
    };
    
    storage.saveAppData(appData); // 保存 activeTemplateId
    
    // 使用 resetGame 来确保进入页面时是初始状态
    game.resetGame(() => ui.populateUI(currentSettings));
    
    // 根据是否为默认模板，显示或隐藏设置按钮
    dom.settingsButton.style.display = template.isDefault ? 'none' : 'block';
    
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
    // 修正: 将 isSharedPool 和 config 一起复制到 currentSettings
    currentSettings = {
        ...structuredClone(template.config),
        isSharedPool: template.isSharedPool
    };
    
    ui.populateSettingsForm(template, handleAddRotatorField);
    // 新增: 设置独立池按钮的初始可见性
    ui.toggleIndividualPoolButtons(!template.isSharedPool);
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
        const isShared = dom.modalPoolTypeSwitch.checked;

        if (!newName || newName.trim() === '') {
            ui.showToast("名称不能为空", true);
            return; // 停在模态框
        }
        
        const newTemplate = {
            id: `custom-${Date.now()}`,
            name: newName,
            isDefault: false,
            isSharedPool: isShared,
            config: {}
        };

        if (isShared) {
            newTemplate.config = {
                locationText: "我的共享池情景",
                speed: 30,
                sharedPool: ["项目A", "项目B", "项目C"],
                rotators: [
                    { id: 0, label: "轮换位 1", individualPool: [] }
                ]
            };
        } else {
            newTemplate.config = {
                locationText: "我的独立池情景",
                speed: 30,
                sharedPool: [],
                rotators: [
                    { id: 0, label: "分类 A", individualPool: ["选项 1", "选项 2", "选项 3"] },
                    { id: 1, label: "分类 B", individualPool: ["选项 A", "选项 B", "选项 C"] }
                ]
            };
        }

        appData.templates.push(newTemplate);
        storage.saveAppData(appData);
        ui.hideModal();
        
        // 直接加载模板并进入游戏页面
        loadTemplate(newTemplate.id); 
    };
    
    ui.showConfirmationModal(
        "创建新模板", 
        "请输入新模板的名称并选择类型:", 
        "create-new", 
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
    const newSharedPool = dom.settingPoolTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    
    const isSharedPool = dom.settingSharePoolToggle.checked;
    
    const newRotators = [];
    const rotatorLabelInputs = dom.settingsRotatorsContainer.querySelectorAll('input[type="text"]');

    rotatorLabelInputs.forEach((input, index) => {
        const label = input.value;
        if (!label) return; // 忽略空标签

        // 从 currentSettings 中获取对应的 rotator 数据 (依赖 DOM 和内存顺序一致)
        const currentRotatorData = currentSettings.rotators[index];
        
        // 如果是共享池, individualPool 设为空数组
        // 如果是独立池, 保留 currentRotatorData 中的 individualPool
        // V9 修复: 确保 currentRotatorData 存在
        const individualPool = (isSharedPool || !currentRotatorData) ? [] : currentRotatorData.individualPool;

        newRotators.push({
            id: index, // 始终重新索引 ID
            label: label,
            individualPool: individualPool
        });
    });

    // 更新 appData 中的模板
    const template = appData.templates[templateIndex];
    template.name = newName;
    template.isSharedPool = isSharedPool; 
    template.config = {
        locationText: newLocationText, 
        speed: currentSettings.speed, // 保留旧的速度值
        sharedPool: newSharedPool,
        rotators: newRotators
    };
    
    // 将更新后的配置加载为 currentSettings
    // 修正: 确保 currentSettings 也包含 isSharedPool
    currentSettings = {
        ...structuredClone(template.config),
        isSharedPool: template.isSharedPool
    };
    
    storage.saveAppData(appData);
    settingsHaveChanged = false;
    
    ui.populateUI(currentSettings); // 使用新保存的设置更新UI
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
            // 回退到第一个默认模板 (通常是守望先锋)
            const primaryDefaultId = allDefaultTemplates[0]?.id || null;
            appData.activeTemplateId = primaryDefaultId;
        }
        
        storage.saveAppData(appData);
        
        ui.hideModal();
        ui.showToast(`模板 "${template.name}" 已删除`);
        
        if (from === 'settings') {
            // 如果在设置页删除，则返回主页
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
        // --- FIX: 丢失的代码到此结束 ---
    }; // FIX: 缺少此 '};'
    
    ui.showConfirmationModal(
        `删除模板 "${template.name}"`,
        "你确定要永久删除这个模板吗？此操作无法撤销。",
        "confirm-cancel",
        modalConfirmCallback
    );
} // FIX: 缺少此 '}'

function handleAddRotatorField(rotator, markAsChange = true) {
    if (markAsChange) settingsHaveChanged = true;

    let rotatorData = rotator;
    if (!rotatorData) {
        // 这是来自 "+" 按钮的新轮换位
        rotatorData = { 
            id: Date.now(), // 临时唯一 ID
            label: '', 
            individualPool: [] 
        };
        // 关键: 将新轮换位添加到内存中的设置
        currentSettings.rotators.push(rotatorData); 
    }

    ui.addRotatorField(
        rotatorData, 
        !dom.settingSharePoolToggle.checked, // showPoolButton
        () => { settingsHaveChanged = true; }, // onFieldChanged
        (removedRotator) => { // onFieldRemoved
            settingsHaveChanged = true; 
            // 关键: 从内存中的设置移除
            currentSettings.rotators = currentSettings.rotators.filter(r => r.id !== removedRotator.id);
        },
        (r) => { openPoolEditor(r); } // onEditPool
    );
}

/**
 * 新增: 打开独立池编辑器
 * @param {Object} rotator - 轮换位对象
 */
function openPoolEditor(rotator) {
    editingRotatorId = rotator.id; // 跟踪正在编辑的 ID
    ui.showIndividualPoolModal(rotator);
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

    // 新增: "共享轮换池" 开关
    dom.settingSharePoolToggle.addEventListener('change', (e) => {
        const isShared = e.target.checked;
        dom.sharedPoolContainer.style.display = isShared ? 'block' : 'none';
        ui.toggleIndividualPoolButtons(!isShared);
        settingsHaveChanged = true;
    });

    // 设置页导航
    dom.backToGameBtn.addEventListener('click', () => {
        if (settingsHaveChanged) {
            modalConfirmCallback = null; // 重置
            ui.showConfirmationModal('未保存的更改', '你有未保存的更改。你要做什么？', 'save-discard');
        } else {
            showGame();
        }
    });
    
    // --- 新增: 上下文菜单事件处理 ---
    dom.contextMenu.addEventListener('click', (e) => {
        const target = e.target.closest('.context-menu-item');
        if (!target) return;        const id = target.dataset.id;
        if (!id) return;

        // 根据按钮的 class 调用对应的处理函数
        if (target.classList.contains('edit-template-btn')) {
            editTemplate(id);
        } else if (target.classList.contains('delete-template-btn')) {
            handleDeleteTemplate(id, 'home');
        } else if (target.classList.contains('duplicate-template-btn')) {
            handleDuplicateTemplate(id);
        }
        
        ui.hideContextMenu(); // 操作后总是关闭菜单
    });

    // --- 新增: 点击外部关闭上下文菜单 ---
    document.addEventListener('click', (e) => {
        // 如果菜单是可见的，并且点击的不是菜单自身或选项按钮，则关闭
        if (!dom.contextMenu.classList.contains('hidden') && 
            !e.target.closest('#context-menu') && 
            !e.target.closest('.options-btn')) {
            ui.hideContextMenu();
        }
    });
    
    // 模态框按钮
    dom.modalCloseBtn.addEventListener('click', ui.hideModal);
    dom.modalCancelBtn.addEventListener('click', ui.hideModal);
    
    dom.modalDiscardBtn.addEventListener('click', () => {
        ui.hideModal();
        
        // 修复: 从主数据源重新加载模板以丢弃更改
        const template = appData.templates.find(t => t.id === appData.activeTemplateId);
        if (template) {
            currentSettings = {
                ...structuredClone(template.config),
                isSharedPool: template.isSharedPool
            };
            // 使用原始的、未更改的数据重新填充游戏UI
            ui.populateUI(currentSettings);
        }
        
        showGame(); // 返回游戏页面
        settingsHaveChanged = false;
        ui.showToast("修改已丢弃");
    });
    
    dom.modalSaveBtn.addEventListener('click', () => {
        ui.hideModal();
        saveSettings(); // 保存
        showGame();     // 然后返回游戏页
    });
    
    dom.modalConfirmBtn.addEventListener('click', () => {
        if (modalConfirmCallback) {
            const inputValue = dom.modalInput.value;
            modalConfirmCallback(inputValue); // 传递值
        }
        // 重置回调，防止重复触发
        modalConfirmCallback = null; 
    });

    // 新增: 独立池模态框按钮
    dom.individualPoolCloseBtn.addEventListener('click', ui.hideIndividualPoolModal);
    
    dom.individualPoolSaveBtn.addEventListener('click', () => {
        const newPool = dom.individualPoolTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
        
        const rotatorIndex = currentSettings.rotators.findIndex(r => r.id === editingRotatorId);
        
        if (rotatorIndex > -1) {
            currentSettings.rotators[rotatorIndex].individualPool = newPool;
            settingsHaveChanged = true;
            ui.hideIndividualPoolModal();
            ui.showToast("独立池已保存");
        } else {
            ui.showToast("保存失败: 找不到轮换位", true);
        }
        editingRotatorId = null; // 重置
    });

    // 标记更改 (仅限非禁用时)
    const markChanged = () => { if (!settingsHaveChanged) settingsHaveChanged = true; };
    dom.settingTemplateNameInput.addEventListener('input', markChanged);
    dom.settingLocationInput.addEventListener('input', markChanged);
    dom.settingPoolTextarea.addEventListener('input', markChanged);
}); // FIX: 缺少此 '});' 来关闭 DOMContentLoaded