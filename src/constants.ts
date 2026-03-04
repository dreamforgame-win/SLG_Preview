import { UnitType, SkillType, PropType, FormationType } from './types';

export const CLASS_DATA: Record<UnitType, { name: string; icon: string; range: number; atk: number; maxHp: number }> = {
  Sword: { name: '刀兵', icon: '🔪', range: 1, atk: 20, maxHp: 1000 },
  Spear: { name: '枪兵', icon: '🔱', range: 2, atk: 20, maxHp: 1000 },
  Bow: { name: '弓兵', icon: '🏹', range: 3, atk: 20, maxHp: 1000 },
};

export const SKILL_DATA: Record<SkillType, { name: string; desc: string }> = {
  Heal: { name: '治疗', desc: '周围1格友军恢复10%血量' },
  Charge: { name: '冲锋', desc: '前方 3x1 格敌人造成50%伤害' },
  ArrowRain: { name: '箭雨', desc: '前方 3x3 格敌人造成50%伤害' },
  Knockback: { name: '击退', desc: '周围1格敌人20%伤害并击退1格' },
};

export const PROP_DATA: Record<PropType, { name: string; icon: string; desc: string }> = {
  Obstacle: { name: '障碍', icon: '🪨', desc: '阻挡移动，不可穿越' },
  Trap: { name: '陷阱', icon: '🪤', desc: '踩中造成5%血量伤害(上限200)' },
};

export const FORMATION_DATA: Record<FormationType, { name: string; desc: string }> = {
  Normal: { name: '普通阵', desc: '无加成' },
  WhiteTiger: { name: '白虎阵', desc: '第3、4排：攻击力+5%' },
  AzureDragon: { name: '青龙阵', desc: '第2、3排：枪兵攻击距离+1' },
  BlackTortoise: { name: '玄武阵', desc: '第1排：刀兵最大血量+20%' },
  VermilionBird: { name: '朱雀阵', desc: '1排3列血量+10%，3排1、5列攻击+10%，5排3列射程+1' }
};


