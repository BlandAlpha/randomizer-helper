// js/storage.js
// 专门处理 localStorage 的读取、写入和迁移

import { V1_STORAGE_KEY, V2_STORAGE_KEY } from './config.js';
// 导入所有默认模板
import { allDefaultTemplates, defaultOverwatchTemplate, defaultOverwatchPool } from './defaultTemplates.js';
import { showToast } from './ui.js';

/**
 * 初始化应用数据
 * 1. 尝试从 V2 加载
 * 2. 如果 V2 失败/不存在, 尝试从 V1 迁移
 * 3. 同步默认模板
 * @returns {Object} appData
 */
export function initializeApp() {
    let appData = null;
    const storedDataV2 = localStorage.getItem(V2_STORAGE_KEY);

    if (storedDataV2) {
        try {
            appData = JSON.parse(storedDataV2);
            if (appData.version !== 'v2') {
                // 版本不对, 强制迁移 V1 (或视为损坏)
                console.warn("V2 存储版本不匹配, 尝试 V1 迁移...");
                appData = migrateV1Data();
            }
        } catch (e) {
            console.error("V2 存储解析失败:", e);
            appData = migrateV1Data(); // 损坏, 尝试 V1 迁移
        }
    } else {
        // V2 不存在, 尝试 V1 迁移 (这也处理了全新安装)
        console.log("未找到 V2 存储, 尝试 V1 迁移/全新安装...");
        appData = migrateV1Data();
    }

    // --- 模板同步逻辑 (V11 关键更新) ---
    // 无论从哪里加载了 appData，都执行此同步

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
    //    (如果用户最后使用的是一个后来被删除的默认模板)
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

/**
 * 尝试从 V1 迁移数据
 * 如果 V1 也不存在, 则返回一个全新的 V2 结构
 * @returns {Object} V2 格式的 appData
 */
function migrateV1Data() {
    console.log("尝试从 V1 迁移...");
    
    // 基础: 一个全新的 V2 结构 (包含默认的 OW 模板)
    // 注意: initializeApp 中的同步逻辑会确保 *所有* 默认模板被添加
    let appData = {
        version: 'v2',
        activeTemplateId: defaultOverwatchTemplate.id,
        templates: [structuredClone(defaultOverwatchTemplate)] // 占位, 会被同步逻辑替换
    };
    
    try {
        const v1Settings = localStorage.getItem(V1_STORAGE_KEY);
        
        if (v1Settings) {
            // 找到了 V1 数据
            console.log("找到 V1 数据, 正在迁移...");
            const { locationText, speed, poolItems } = JSON.parse(v1Settings);
            
            // 将 V1 设置转换为一个新的 "自定义" V2 模板
            const v1Template = {
                id: 'custom-v1-migrated',
                name: "我的旧版配置 (V1 迁移)",
                isDefault: false,
                isSharedPool: true,
                config: {
                    locationText: locationText || "我的情景",
                    speed: speed || 30,
                    sharedPool: poolItems || defaultOverwatchPool, // 使用 V1 的池, 否则回退
                    rotators: [ // V1 只有4个轮换位
                        { id: 0, label: "父亲是", individualPool: [] }, 
                        { id: 1, label: "母亲是", individualPool: [] },
                        { id: 2, label: "爱人是", individualPool: [] }, 
                        { id: 3, label: "孩子是", individualPool: [] }
                    ]
                }
            };
            
            // 将这个 V1 模板添加到模板列表
            appData.templates.push(v1Template);
            // 将 V1 模板设为当前激活
            appData.activeTemplateId = v1Template.id;

            // 移除旧的 V1 键
            localStorage.removeItem(V1_STORAGE_KEY);
            console.log("V1 迁移完成");
        } else {
            // V1 也不存在, 这是全新安装
            console.log("未找到 V1 数据, 全新安装。");
            // appData 已是全新结构, 无需操作
        }
    } catch (e) {
        console.error("V1 迁移失败:", e);
        // 失败则返回一个干净的 V2 结构
        appData = {
            version: 'v2',
            activeTemplateId: defaultOverwatchTemplate.id,
            templates: [structuredClone(defaultOverwatchTemplate)]
        };
    }
    
    // 返回 V2 数据, 之后 initializeApp 会对其进行同步
    return appData;
}

