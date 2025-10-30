// js/config.js
// 存储所有全局常量和默认模板数据

export const V1_STORAGE_KEY = 'overwatchRotatorSettings_v1';
export const V2_STORAGE_KEY = 'randomRotatorAssistant_v2';

export const defaultOverwatchPool = [
    "末日铁拳", "D.Va", "骇灾", "渣客女王", "毛加", "奥丽莎", "拉玛刹",
    "莱因哈特", "路霸", "西格玛", "温斯顿", "破坏球", "查莉娅", "艾什",
    "堡垒", "卡西迪", "回声", "弗蕾娅", "源氏", "半藏", "狂鼠", "美",
    "法老之鹰", "死神", "索杰恩", "士兵：76", "黑影", "秩序之光",
    "托比昂", "猎空", "探奇", "黑百合", "安娜", "巴蒂斯特", "布丽吉塔",
    "伊拉锐", "朱诺", "雾子", "生命之梭", "卢西奥", "天使", "莫伊拉", "无漾"
];

export const defaultOverwatchTemplate = {
    id: 'default-ow-uuid', 
    name: "守望先锋 命运轮换",
    isDefault: true, 
    isSharedPool: true,
    config: {
        locationText: "当你穿越到守望先锋你的",
        speed: 30,
        sharedPool: defaultOverwatchPool,
        rotators: [
            { id: 0, label: "父亲是", individualPool: [] }, 
            { id: 1, label: "母亲是", individualPool: [] },
            { id: 2, label: "爱人是", individualPool: [] }, 
            { id: 3, label: "孩子是", individualPool: [] }
        ]
    }
};
