// js/storage.js
// 专门处理 localStorage 的读取、写入和迁移

import { V1_STORAGE_KEY, V2_STORAGE_KEY, defaultOverwatchTemplate, defaultOverwatchPool } from './config.js';
import { showToast } from './ui.js';

// 初始化应用数据
export function initializeApp() {
    let appData;
    try {
        const savedData = localStorage.getItem(V2_STORAGE_KEY);
        if (savedData) {
            appData = JSON.parse(savedData);
            if (!appData.version || appData.version !== 'v2') {
                throw new Error('版本不匹配');
            }
            console.log("V2 数据已加载");
        } else {
            // V2 数据不存在, 尝试从 V1 迁移
            appData = migrateV1Data();
        }
    } catch (e) {
        console.error("加载 V2 数据失败, 尝试迁移:", e);
        appData = migrateV1Data();
    }
    
    // 确保至少有默认模板
    if (!appData.templates.find(t => t.id === defaultOverwatchTemplate.id)) {
        appData.templates.unshift(structuredClone(defaultOverwatchTemplate));
        saveAppData(appData);
    }
    
    return appData;
}

// 迁移 V1 数据
function migrateV1Data() {
    console.log("尝试从 V1 迁移...");
    let appData;
    try {
        const v1Settings = localStorage.getItem(V1_STORAGE_KEY);
        // 重置 appData
        appData = {
            version: 'v2',
            activeTemplateId: defaultOverwatchTemplate.id,
            templates: [structuredClone(defaultOverwatchTemplate)]
        };
        
        if (v1Settings) {
            const parsedV1 = JSON.parse(v1Settings);
            // 检查是否是自定义的 V1 配置
            if (JSON.stringify(parsedV1.pool) !== JSON.stringify(defaultOverwatchPool) || 
                parsedV1.locationText !== "当你穿越到守望先锋你的") 
            {
                const customV1Template = {
                    id: `migrated-${Date.now()}`,
                    name: "我的旧配置 (已迁移)",
                    isDefault: false,
                    isSharedPool: true,
                    config: {
                        locationText: parsedV1.locationText || "我的情景",
                        speed: parsedV1.speed || 30,
                        sharedPool: parsedV1.pool || [],
                        rotators: (parsedV1.rotators || []).map(r => ({ ...r, individualPool: [] }))
                    }
                };
                appData.templates.push(customV1Template);
                appData.activeTemplateId = customV1Template.id;
                console.log("V1 自定义配置已迁移");
            }
        }
        saveAppData(appData);
        // localStorage.removeItem(V1_STORAGE_KEY);
    } catch (e) {
        console.error("V1 迁移失败, 加载默认数据:", e);
        // 如果迁移失败, 就加载全新的默认数据
        appData = {
            version: 'v2',
            activeTemplateId: defaultOverwatchTemplate.id,
            templates: [structuredClone(defaultOverwatchTemplate)]
        };
        saveAppData(appData);
    }
    return appData;
}

// 保存 V2 数据到 localStorage
export function saveAppData(appData) {
    try {
        localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(appData));
        console.log("AppData 已保存:", appData);
    } catch (e) {
        console.error("保存 AppData 失败:", e);
        showToast("保存失败!", true);
    }
}
