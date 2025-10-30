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
        card.className = "template-card-clickable bg-gray-700 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 cursor-pointer hover:bg-gray-600 transition-colors";
        card.dataset.id = template.id;
        
        let buttonsHTML = '';
        if (template.isDefault) {
            buttonsHTML = `<button data-id="${template.id}" class="duplicate-template-btn w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">复制并编辑</button>`;
        } else {
            buttonsHTML = `
                <button data-id="${template.id}" class="edit-template-btn w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">编辑</button>
                <button data-id="${template.id}" class="delete-template-btn w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">删除</button>
            `;
        }

        card.innerHTML = `
            <div class="flex-grow text-center md:text-left pointer-events-none">
                <span class="font-bold text-lg text-white">${template.name}</span>
                ${template.isDefault ? '<span class="ml-2 text-xs bg-gray-500 text-gray-200 py-0.5 px-2 rounded-full">默认</span>' : ''}
            </div>
            <div class="flex flex-col md:flex-row gap-3 flex-shrink-0 w-full md:w-auto">
                ${buttonsHTML}
            </div>
        `;
        dom.templateListEl.appendChild(card);
    });
    
    // 绑定事件
    dom.templateListEl.querySelectorAll('.template-card-clickable').forEach(card => card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return; 
        eventHandlers.onStart(e.currentTarget.dataset.id);
    }));
    
    dom.templateListEl.querySelectorAll('.edit-template-btn').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        eventHandlers.onEdit(e.target.dataset.id);
    }));
    
    dom.templateListEl.querySelectorAll('.delete-template-btn').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        eventHandlers.onDelete(e.target.dataset.id);
    }));
    
    dom.templateListEl.querySelectorAll('.duplicate-template-btn').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        eventHandlers.onDuplicate(e.target.dataset.id);
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
            <div id="rotator-value-${rotator.id}" class="text-2xl md:text-3xl font-bold text-yellow-400 min-h-10 flex items-center justify-center overflow-visible break-words w-full">
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
    if (!dom.settingLocationInput || !dom.settingsRotatorsContainer || !dom.settingPoolTextarea || !dom.settingSpeedSlider) return;
    
    const { config, isDefault, name } = template;
    
    dom.settingsTitleEl.textContent = `编辑: ${name}`;
    dom.settingTemplateNameInput.value = name;
    dom.settingLocationInput.value = config.locationText;
    dom.settingPoolTextarea.value = (config.sharedPool || []).join('\n');
    dom.settingSpeedSlider.value = config.speed;
    dom.settingSpeedValueDisplay.textContent = `${config.speed} 个/秒`;
    
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
    dom.settingSpeedSlider.disabled = isEditingDisabled;
    dom.addRotatorButton.disabled = isEditingDisabled;
    
    dom.resetTemplateBtn.classList.toggle('hidden', isEditingDisabled);
    dom.deleteTemplateBtn.classList.toggle('hidden', isEditingDisabled);
    dom.saveSettingsButton.classList.toggle('hidden', isEditingDisabled);
    
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
    fieldEl.className = "flex items-center space-x-2 w-full";
    fieldEl.innerHTML = `
        <input type="text" value="${rotator.label}" class="flex-grow bg-gray-700 border border-gray-600 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="轮换位名称 (如: 敌人是)">
        <button class="edit-individual-pool-btn ${showPoolButton ? '' : 'hidden'} bg-yellow-600 hover:bg-yellow-700 text-white font-bold p-2 rounded-lg text-sm">编辑池</button>
        <button class="remove-rotator-btn bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-lg w-10">-</button>
    `;
    dom.settingsRotatorsContainer.appendChild(fieldEl);
    
    fieldEl.querySelector('.remove-rotator-btn').addEventListener('click', (e) => {
        if (e.target.disabled) return;
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
        if (e.target.disabled) return;
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
    }
    
    dom.confirmationModal.classList.remove('hidden');
    
    if (mode === 'prompt') {
        dom.modalInput.focus();
        dom.modalInput.select();
    }
    
    // 返回一个 Promise，以便 app.js 可以 await
    return new Promise((resolve) => {
        // 将回调和 resolve 绑定到按钮上
        // 这部分在 app.js 中处理更清晰
    });
}

/**
 * 隐藏模态框
 */
export function hideModal() {
    dom.confirmationModal.classList.add('hidden');
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
    dom.homePage.classList.add('hidden');
    dom.gamePage.classList.add('hidden');
    dom.settingsPage.classList.add('hidden');

    switch (pageName) {
        case 'home':
            dom.homePage.classList.remove('hidden');
            break;
        case 'game':
            dom.gamePage.classList.remove('hidden');
            break;
        case 'settings':
            dom.settingsPage.classList.remove('hidden');
            break;
    }
}