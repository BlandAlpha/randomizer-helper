// js/ui.js
// 负责所有与 UI 渲染相关的函数

import * as dom from './dom.js';

let toastTimeout = null;

/**
 * 渲染主页模板列表
 * @param {Array} templates - 模板数组
 * @param {Object} eventHandlers - 包含 { onStart, onEdit, onDelete, onDuplicate } 的对象
 */
export function renderHomePage(templates, eventHandlers) {
    dom.templateListEl.innerHTML = '';
    if (templates.length === 0) {
        dom.templateListEl.innerHTML = `<p class="text-gray-400 text-center">没有模板。请创建一个新模板。</p>`;
        return;
    }
    
    templates.forEach(template => {
        const card = document.createElement('div');

        const isDefault = template.isDefault;
        const baseClasses = "template-card-clickable p-4 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors";
        const styleClasses = isDefault 
            ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
            : 'bg-gray-700 hover:bg-gray-600';
            
        card.className = `${baseClasses} ${styleClasses}`;
        card.dataset.id = template.id;
        
        const optionsButtonHTML = `
            <button aria-label="选项" data-id="${template.id}" class="options-btn flex-shrink-0 p-2 rounded-full hover:bg-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
        `;

        card.innerHTML = `
            <div class="flex-grow flex items-center overflow-hidden mr-2 pointer-events-none">
                <span class="font-bold text-lg text-white truncate" title="${template.name}">${template.name}</span>
                ${template.isDefault ? '<span class="ml-2 text-xs bg-gray-500 text-gray-200 py-0.5 px-2 rounded-full flex-shrink-0">默认</span>' : ''}
            </div>
            <div class="flex-shrink-0">
                ${optionsButtonHTML}
            </div>
        `;
        dom.templateListEl.appendChild(card);
    });
    
    // 绑定事件
    dom.templateListEl.querySelectorAll('.template-card-clickable').forEach(card => card.addEventListener('click', (e) => {
        if (e.target.closest('.options-btn')) return; 
        eventHandlers.onStart(e.currentTarget.dataset.id);
    }));
    
    dom.templateListEl.querySelectorAll('.options-btn').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        const templateId = e.currentTarget.dataset.id;
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        const rect = e.currentTarget.getBoundingClientRect();
        showContextMenu(rect.right, rect.bottom, template);
    }));
}

/**
 * 填充游戏页面
 * @param {Object} currentSettings - 当前模板的配置
 */
export function populateUI(currentSettings) {
    if (!dom.locationTextEl || !dom.rotatorGridEl) return;
    dom.locationTextEl.textContent = currentSettings.locationText;
    dom.rotatorGridEl.innerHTML = '';
    currentSettings.rotators.forEach(rotator => {
        const rotatorEl = document.createElement('div');
        rotatorEl.className = "flex flex-col items-center p-4 bg-gray-800 rounded-xl shadow-lg w-full";
        rotatorEl.innerHTML = `
            <span class="text-lg text-gray-400 mb-2">${rotator.label}</span>
            <div id="rotator-value-${rotator.id}" class="text-2xl md:text-3xl font-bold text-yellow-400 h-24 flex items-center justify-center text-center break-words w-full p-1 overflow-hidden">
                ---
            </div>
        `;
        dom.rotatorGridEl.appendChild(rotatorEl);
    });
}

/**
 * 填充设置表单
 * @param {Object} template - 完整的模板对象
 * @param {Function} onAddRotatorField - 添加轮换位字段的回调
 */
export function populateSettingsForm(template, onAddRotatorField) {
    if (!dom.settingLocationInput || !dom.settingsRotatorsContainer || !dom.settingPoolTextarea) return;
    
    const { config, isDefault, name } = template;
    
    dom.settingsTitleEl.textContent = `编辑: ${name}`;
    dom.settingTemplateNameInput.value = name;
    dom.settingLocationInput.value = config.locationText;
    dom.settingPoolTextarea.value = (config.sharedPool || []).join('\n');
    
    dom.settingSharePoolToggle.checked = template.isSharedPool;
    dom.sharedPoolContainer.style.display = template.isSharedPool ? 'block' : 'none';
    dom.settingSharePoolToggle.disabled = template.isDefault; // 默认模板不允许切换

    dom.settingsRotatorsContainer.innerHTML = '';
    config.rotators.forEach(rotator => {
        onAddRotatorField(rotator, false); // 传入整个 rotator
    });
    
    // 根据是否为默认模板显示/隐藏按钮
    const isEditingDisabled = isDefault;
    dom.settingTemplateNameInput.disabled = isEditingDisabled;
    dom.settingLocationInput.disabled = isEditingDisabled;
    dom.settingPoolTextarea.disabled = isEditingDisabled;
    dom.addRotatorButton.disabled = isEditingDisabled;
    
    // 隐藏或显示整个操作区域
    dom.settingsActionsPrimary.classList.toggle('hidden', isEditingDisabled);
    dom.settingsActionsDanger.classList.toggle('hidden', isEditingDisabled);
    
    dom.settingsRotatorsContainer.querySelectorAll('input, button').forEach(el => el.disabled = isEditingDisabled);
}

/**
 * 在设置页添加一个新的轮换位字段
 * @param {string} value - 字段的初始值
 * @param {Function} onFieldChanged - 字段值变动时的回调
 * @param {Function} onFieldRemoved - 字段被移除时的回调
 * @param {Function} onEditPool - 编辑独立池按钮的回调
 */
export function addRotatorField(rotator, showPoolButton, onFieldChanged, onFieldRemoved, onEditPool) {
    const fieldEl = document.createElement('div');
    fieldEl.className = "flex items-center gap-2 w-full";
    
    const deleteIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
    `;

    fieldEl.innerHTML = `
        <input type="text" id="rotator-label-${rotator.id}" name="rotator-label-${rotator.id}" value="${rotator.label}" class="flex-grow bg-gray-700 border border-gray-600 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 min-w-0" placeholder="轮换位名称 (如: 敌人是)">
        <div class="flex-shrink-0 flex items-center gap-2">
            <button class="edit-individual-pool-btn ${showPoolButton ? '' : 'hidden'} bg-yellow-600 hover:bg-yellow-700 text-white font-bold p-2 rounded-lg text-sm h-10">编辑池</button>
            <button class="remove-rotator-btn bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-lg h-10 w-10 flex items-center justify-center">
                ${deleteIconSVG}
            </button>
        </div>
    `;
    dom.settingsRotatorsContainer.appendChild(fieldEl);
    
    fieldEl.querySelector('.remove-rotator-btn').addEventListener('click', (e) => {
        if (e.currentTarget.disabled) return;
        fieldEl.remove();
        onFieldRemoved(rotator); // 传递 rotator 对象
    });
    fieldEl.querySelector('input').addEventListener('input', (e) => {
        if (e.target.disabled) return;
        onFieldChanged();
    });
    // 绑定新按钮
    fieldEl.querySelector('.edit-individual-pool-btn').addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (e.currentTarget.disabled) return;
        onEditPool(rotator);
    });
}

/**
 * 切换所有独立池 "编辑池" 按钮的可见性
 * @param {boolean} show - 是否显示
 */
export function toggleIndividualPoolButtons(show) {
    const buttons = dom.settingsRotatorsContainer.querySelectorAll('.edit-individual-pool-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('hidden', !show);
    });
}

/**
 * 显示一个 Toast 提示
 * @param {string} message - 提示信息
 * @param {boolean} isError - 是否为错误提示
 */
export function showToast(message, isError = false) {
    if (toastTimeout) clearTimeout(toastTimeout);
    dom.toastNotification.textContent = message;
    dom.toastNotification.classList.remove('hidden', 'opacity-0', 'bg-green-600', 'bg-red-600');
    dom.toastNotification.classList.add(isError ? 'bg-red-600' : 'bg-green-600');
    
    void dom.toastNotification.offsetWidth; // 触发重绘
    dom.toastNotification.classList.remove('opacity-0');
    
    toastTimeout = setTimeout(() => {
        dom.toastNotification.classList.add('opacity-0');
        setTimeout(() => dom.toastNotification.classList.add('hidden'), 300);
    }, 3000);
}

/**
 * 显示确认模态框
 * @param {string} title - 模态框标题
 * @param {string} message - 模态框信息
 * @param {'save-discard' | 'confirm-cancel' | 'prompt'} mode - 模态框模式
 * @param {Function} callback - 确认按钮的回调
 * @param {string} promptValue - 'prompt' 模式下的默认输入值
 */
export function showConfirmationModal(title, message, mode, callback = null, promptValue = '') {
    dom.modalTitle.textContent = title;
    dom.modalMessage.textContent = message;
    
    // 重置所有
    dom.modalButtonsSaveDiscard.classList.add('hidden');
    dom.modalButtonsConfirmCancel.classList.add('hidden');
    dom.modalInputContainer.classList.add('hidden');
    dom.modalSwitchContainer.classList.add('hidden');
    dom.modalConfirmBtn.textContent = "确认"; 
    dom.modalConfirmBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    dom.modalConfirmBtn.classList.add('bg-red-600', 'hover:bg-red-700');

    if (mode === 'save-discard') {
        dom.modalButtonsSaveDiscard.classList.remove('hidden');
    } else if (mode === 'confirm-cancel') {
        dom.modalButtonsConfirmCancel.classList.remove('hidden');
    } else if (mode === 'prompt') {
        dom.modalInputContainer.classList.remove('hidden');
        dom.modalInputLabel.textContent = "模板名称"; 
        dom.modalInput.value = promptValue;
        dom.modalButtonsConfirmCancel.classList.remove('hidden');
        dom.modalConfirmBtn.textContent = "确认";
        dom.modalConfirmBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        dom.modalConfirmBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    } else if (mode === 'create-new') {
        dom.modalInputContainer.classList.remove('hidden');
        dom.modalSwitchContainer.classList.remove('hidden');
        dom.modalInputLabel.textContent = "模板名称";
        dom.modalInput.value = promptValue;
        dom.modalButtonsConfirmCancel.classList.remove('hidden');
        dom.modalConfirmBtn.textContent = "创建并开始";
        dom.modalConfirmBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        dom.modalConfirmBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
    
    dom.confirmationModal.classList.remove('hidden');
    
    if (mode === 'prompt' || mode === 'create-new') {
        dom.modalInput.focus();
        dom.modalInput.select();
    }
}

/**
 * 隐藏模态框
 */
export function hideModal() {
    dom.confirmationModal.classList.add('hidden');
}

/**
 * 新增: 显示上下文菜单
 * @param {number} x - 屏幕 x 坐标
 * @param {number} y - 屏幕 y 坐标
 * @param {Object} template - 关联的模板对象
 */
export function showContextMenu(x, y, template) {
    dom.contextMenu.innerHTML = ''; // 清空旧菜单项

    const menuItemClasses = "block w-full text-left px-4 py-2 text-sm transition-colors rounded-md";
    const normalItemClasses = "text-gray-200 hover:bg-gray-700";
    const dangerItemClasses = "text-red-400 hover:bg-gray-700";

    let menuItemsHTML = '';
    if (template.isDefault) {
        menuItemsHTML = `<button data-id="${template.id}" class="context-menu-item duplicate-template-btn ${menuItemClasses} ${normalItemClasses}">复制并编辑</button>`;
    } else {
        menuItemsHTML = `
            <button data-id="${template.id}" class="context-menu-item edit-template-btn ${menuItemClasses} ${normalItemClasses}">编辑</button>
            <button data-id="${template.id}" class="context-menu-item delete-template-btn ${menuItemClasses} ${dangerItemClasses}">删除</button>
        `;
    }
    dom.contextMenu.innerHTML = menuItemsHTML;
    
    // 必须先显示才能获取尺寸
    dom.contextMenu.classList.remove('hidden');

    // 定位 (智能判断)
    const menuWidth = dom.contextMenu.offsetWidth;
    const menuHeight = dom.contextMenu.offsetHeight;
    const viewportHeight = window.innerHeight;

    let top = y + 5; // 默认在下方
    // 如果下方空间不足，则放到上方
    if (y + menuHeight + 10 > viewportHeight) {
        top = y - menuHeight - 30; // 30是按钮高度的近似值
    }

    dom.contextMenu.style.left = `${x - menuWidth}px`;
    dom.contextMenu.style.top = `${top}px`;
}

/**
 * 新增: 隐藏上下文菜单
 */
export function hideContextMenu() {
    if (dom.contextMenu) {
        dom.contextMenu.classList.add('hidden');
    }
}


/**
 * 新增: 显示独立池编辑模态框
 * @param {Object} rotator - 轮换位对象
 */
export function showIndividualPoolModal(rotator) {
    dom.individualPoolTitle.textContent = `编辑: ${rotator.label}`;
    dom.individualPoolTextarea.value = (rotator.individualPool || []).join('\n');
    dom.individualPoolModal.classList.remove('hidden');
    dom.individualPoolTextarea.focus();
}

/**
 * 新增: 隐藏独立池编辑模态框
 */
export function hideIndividualPoolModal() {
    dom.individualPoolModal.classList.add('hidden');
}


/**
 * 切换页面显示
 * @param {'home' | 'game' | 'settings'} pageName - 要显示的页面
 */
export function showPage(pageName) {
    const pages = [dom.homePage, dom.gamePage, dom.settingsPage];
    const targetPageId = `${pageName}-page`;

    pages.forEach(page => {
        if (page.id === targetPageId) {
            page.classList.remove('hidden');
        } else {
            page.classList.add('hidden');
        }
    });
}