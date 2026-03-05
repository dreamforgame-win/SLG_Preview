export type SkillEffectType = 'add_politics' | 'add_knowledge' | 'add_charm' | 'add_defense' | 'add_output';
export type SkillEffectTarget = 'self' | 'adjacent_officials' | 'adjacent_buildings' | 'current_hex';

export interface Skill {
  id: string;
  name: string;
  description: string;
  effectType: SkillEffectType;
  effectTarget: SkillEffectTarget;
  effectValue: number;
}

export interface Official {
  id: string;
  name: string;
  politics: number;
  knowledge: number;
  charm: number;
  fixedSkill: Skill;
  randomSkill: Skill;
}

export const RANDOM_SKILLS: Skill[] = [
  { id: 'rs_1', name: '提携', description: '周边一格的文官政务+5', effectType: 'add_politics', effectTarget: 'adjacent_officials', effectValue: 5 },
  { id: 'rs_2', name: '讲学', description: '周边一格的文官学识+5', effectType: 'add_knowledge', effectTarget: 'adjacent_officials', effectValue: 5 },
  { id: 'rs_3', name: '风雅', description: '周边一格的文官魅力+5', effectType: 'add_charm', effectTarget: 'adjacent_officials', effectValue: 5 },
  { id: 'rs_4', name: '固防', description: '周遭的功能建筑防御+10%', effectType: 'add_defense', effectTarget: 'adjacent_buildings', effectValue: 10 },
  { id: 'rs_5', name: '激励', description: '周遭地块产出+10%', effectType: 'add_output', effectTarget: 'adjacent_buildings', effectValue: 10 },
];

export const generateRandomSkill = (): Skill => {
  return RANDOM_SKILLS[Math.floor(Math.random() * RANDOM_SKILLS.length)];
};

export const INITIAL_OFFICIALS: Official[] = [
  { id: 'o_1', name: '房玄龄', politics: 98, knowledge: 95, charm: 85, fixedSkill: { id: 'fs_1', name: '王佐之才', description: '本地块产出+20%', effectType: 'add_output', effectTarget: 'current_hex', effectValue: 20 }, randomSkill: generateRandomSkill() },
  { id: 'o_2', name: '杜如晦', politics: 97, knowledge: 92, charm: 80, fixedSkill: { id: 'fs_2', name: '决断如流', description: '本地块防御+20%', effectType: 'add_defense', effectTarget: 'current_hex', effectValue: 20 }, randomSkill: generateRandomSkill() },
  { id: 'o_3', name: '魏徵', politics: 95, knowledge: 90, charm: 88, fixedSkill: { id: 'fs_3', name: '犯颜直谏', description: '本地块政务加成+10', effectType: 'add_politics', effectTarget: 'current_hex', effectValue: 10 }, randomSkill: generateRandomSkill() },
  { id: 'o_4', name: '长孙无忌', politics: 96, knowledge: 88, charm: 90, fixedSkill: { id: 'fs_4', name: '凌烟第一', description: '本地块魅力加成+10', effectType: 'add_charm', effectTarget: 'current_hex', effectValue: 10 }, randomSkill: generateRandomSkill() },
  { id: 'o_5', name: '狄仁杰', politics: 98, knowledge: 92, charm: 95, fixedSkill: { id: 'fs_5', name: '明察秋毫', description: '本地块政务加成+15', effectType: 'add_politics', effectTarget: 'current_hex', effectValue: 15 }, randomSkill: generateRandomSkill() },
  { id: 'o_6', name: '姚崇', politics: 96, knowledge: 90, charm: 85, fixedSkill: { id: 'fs_6', name: '救时宰相', description: '本地块产出+15%', effectType: 'add_output', effectTarget: 'current_hex', effectValue: 15 }, randomSkill: generateRandomSkill() },
  { id: 'o_7', name: '宋璟', politics: 95, knowledge: 92, charm: 86, fixedSkill: { id: 'fs_7', name: '守正不阿', description: '本地块防御+15%', effectType: 'add_defense', effectTarget: 'current_hex', effectValue: 15 }, randomSkill: generateRandomSkill() },
  { id: 'o_8', name: '张九龄', politics: 92, knowledge: 96, charm: 90, fixedSkill: { id: 'fs_8', name: '风度翩翩', description: '本地块魅力加成+15', effectType: 'add_charm', effectTarget: 'current_hex', effectValue: 15 }, randomSkill: generateRandomSkill() },
  { id: 'o_9', name: '裴度', politics: 94, knowledge: 90, charm: 88, fixedSkill: { id: 'fs_9', name: '平蔡名臣', description: '本地块防御+20%', effectType: 'add_defense', effectTarget: 'current_hex', effectValue: 20 }, randomSkill: generateRandomSkill() },
  { id: 'o_10', name: '李泌', politics: 95, knowledge: 94, charm: 85, fixedSkill: { id: 'fs_10', name: '白衣宰相', description: '本地块学识加成+15', effectType: 'add_knowledge', effectTarget: 'current_hex', effectValue: 15 }, randomSkill: generateRandomSkill() },
  { id: 'o_11', name: '陆贽', politics: 93, knowledge: 95, charm: 84, fixedSkill: { id: 'fs_11', name: '内相', description: '本地块政务加成+10', effectType: 'add_politics', effectTarget: 'current_hex', effectValue: 10 }, randomSkill: generateRandomSkill() },
  { id: 'o_12', name: '颜真卿', politics: 85, knowledge: 96, charm: 98, fixedSkill: { id: 'fs_12', name: '刚正不阿', description: '本地块防御+25%', effectType: 'add_defense', effectTarget: 'current_hex', effectValue: 25 }, randomSkill: generateRandomSkill() },
  { id: 'o_13', name: '韩愈', politics: 82, knowledge: 98, charm: 85, fixedSkill: { id: 'fs_13', name: '文起八代', description: '本地块学识加成+20', effectType: 'add_knowledge', effectTarget: 'current_hex', effectValue: 20 }, randomSkill: generateRandomSkill() },
  { id: 'o_14', name: '柳宗元', politics: 80, knowledge: 97, charm: 86, fixedSkill: { id: 'fs_14', name: '永州八记', description: '本地块魅力加成+10', effectType: 'add_charm', effectTarget: 'current_hex', effectValue: 10 }, randomSkill: generateRandomSkill() },
  { id: 'o_15', name: '白居易', politics: 85, knowledge: 98, charm: 92, fixedSkill: { id: 'fs_15', name: '诗魔', description: '本地块魅力加成+20', effectType: 'add_charm', effectTarget: 'current_hex', effectValue: 20 }, randomSkill: generateRandomSkill() },
  { id: 'o_16', name: '褚遂良', politics: 88, knowledge: 95, charm: 82, fixedSkill: { id: 'fs_16', name: '书法大家', description: '本地块学识加成+15', effectType: 'add_knowledge', effectTarget: 'current_hex', effectValue: 15 }, randomSkill: generateRandomSkill() },
  { id: 'o_17', name: '上官婉儿', politics: 85, knowledge: 95, charm: 96, fixedSkill: { id: 'fs_17', name: '巾帼宰相', description: '本地块政务加成+10', effectType: 'add_politics', effectTarget: 'current_hex', effectValue: 10 }, randomSkill: generateRandomSkill() },
  { id: 'o_18', name: '贺知章', politics: 75, knowledge: 92, charm: 90, fixedSkill: { id: 'fs_18', name: '诗狂', description: '本地块魅力加成+15', effectType: 'add_charm', effectTarget: 'current_hex', effectValue: 15 }, randomSkill: generateRandomSkill() },
  { id: 'o_19', name: '张说', politics: 90, knowledge: 94, charm: 85, fixedSkill: { id: 'fs_19', name: '燕国公', description: '本地块产出+10%', effectType: 'add_output', effectTarget: 'current_hex', effectValue: 10 }, randomSkill: generateRandomSkill() },
  { id: 'o_20', name: '李德裕', politics: 96, knowledge: 92, charm: 82, fixedSkill: { id: 'fs_20', name: '会昌中兴', description: '本地块政务加成+20', effectType: 'add_politics', effectTarget: 'current_hex', effectValue: 20 }, randomSkill: generateRandomSkill() },
];
