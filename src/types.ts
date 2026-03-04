export type Team = 'player' | 'enemy';
export type UnitType = 'Sword' | 'Spear' | 'Bow';
export type SkillType = 'Heal' | 'Charge' | 'ArrowRain' | 'Knockback';
export type PropType = 'Obstacle' | 'Trap';
export type FormationType = 'Normal' | 'WhiteTiger' | 'BlackTortoise' | 'VermilionBird' | 'AzureDragon';

export interface FloatingText {
  id: number;
  text: string;
  color: string;
}

export interface Unit {
  id: string;
  team: Team;
  type: UnitType;
  x: number;
  y: number;
  facing: number;
  skills: SkillType[];
  hp: number;
  maxHp: number;
  atk: number;
  range: number;
  cdTimer: number;
  activeSkill?: string;
  isAttacking?: boolean;
  isCasting?: boolean;
  attackTrigger?: number;
  castTrigger?: number;
  floatingTexts?: FloatingText[];
}

export interface Prop {
  id: string;
  type: PropType;
  x: number;
  y: number;
  active: boolean;
  hp?: number;
  maxHp?: number;
  team?: Team;
}

export interface LogEntry {
  id: number;
  msg: string;
  color: string;
}

