// js/storage.js
// 专门处理 localStorage 的读取、写入

import { V2_STORAGE_KEY } from './config.js';
// 导入所有默认模板
import { allDefaultTemplates } from './defaultTemplates.js';
import { showToast } from './ui.js';

/**
 * 初始化应用数据
 * 1. 尝试从 V2 加载
 * 2. 如果 V2 失败/不存在, 创建一个全新的应用结构
 * 3. 同步默认模板
 * @returns {Object} appData
 */
export function initializeApp() {
    let appData = null;
    const storedDataV2 = localStorage.getItem(V2_STORAGE_KEY);

    if (storedDataV2) {
        try {
            appData = JSON.parse(storedDataV2);
            // 只要版本号不对或不是v2,就视为无效
            if (!appData.version || appData.version !== 'v2') {
                console.warn("存储版本不匹配，将重置。");
                appData = null; 
            }
        } catch (e) {
            console.error("存储解析失败, 将创建全新存储:", e);
            appData = null;
        }
    }

    // 如果 appData 为 null (即全新安装, 或数据损坏/版本过时)
    if (!appData) {
        console.log("全新安装或数据重置。");
        appData = {
            version: 'v2',
            // 回退到第一个默认模板的 ID
            activeTemplateId: allDefaultTemplates[0]?.id || null, 
            templates: [] // 模板同步逻辑会填充它
        };
    }

    // --- 模板同步逻辑 (V11 关键更新) ---
    // 无论 appData 是加载的还是新建的，都执行此同步

    // 1. 创建一个新列表, 始终以代码中最新的默认模板开始
    const newTemplatesList = allDefaultTemplates.map(t => structuredClone(t));

    // 2. 从已加载的 appData 中, 仅筛选出用户自定义的模板
    if (appData.templates && appData.templates.length > 0) {
        const customTemplates = appData.templates.filter(t => !t.isDefault);
        newTemplatesList.push(...customTemplates);
    }

    // 3. 用这个同步过的新列表替换掉旧列表
    appData.templates = newTemplatesList;

    // 4. (健壮性检查) 验证 activeTemplateId 是否仍然存在
    const activeTemplateExists = appData.templates.find(t => t.id === appData.activeTemplateId);
    if (!activeTemplateExists) {
        // 如果激活的模板不见了, 回退到第一个默认模板
        appData.activeTemplateId = allDefaultTemplates[0]?.id || null;
    }
    
    // 5. 将同步后的数据保存回去
    saveAppData(appData);
    
    return appData;
}

/**
 * 将 appData 保存到 localStorage
 * @param {Object} appData 
 */
export function saveAppData(appData) {
    try {
        localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.error("保存 appData 失败:", e);
        showToast("保存设置失败! 可能是存储已满。", true);
    }
}