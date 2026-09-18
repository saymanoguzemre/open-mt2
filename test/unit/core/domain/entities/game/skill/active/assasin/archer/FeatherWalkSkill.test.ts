import { expect } from 'chai';

import { FeatherWalkSkill } from '@/core/domain/entities/game/skill/active/assasin/archer/FeatherWalkSkill';
import { SkillCalcContext } from '@/core/domain/entities/game/skill/Skill';
import { SkillFlagsEnum } from '@/core/enum/SkillFlagsEnum';

const M1 = { skillLevel: 0.5 } as SkillCalcContext;

describe('FeatherWalkSkill', () => {
    const skill = new FeatherWalkSkill();

    it('uses SELFONLY only (no TOGGLE)', () => {
        expect(skill.flags.has(SkillFlagsEnum.SELFONLY)).to.equal(true);
        expect(skill.flags.has(SkillFlagsEnum.TOGGLE)).to.equal(false);
    });

    it('uses proto cooldown 30+30*k (M1 k=0.5 → 45)', () => {
        expect(skill.calculateCooldown(M1)).to.equal(45);
    });

    it('keeps proto duration 15+30*k (M1 k=0.5 → 30)', () => {
        for (const apply of skill.applies) {
            expect(apply.calculateDuration!(M1)).to.equal(30);
        }
    });
});
