import { expect } from 'chai';

import { StrongBodySkill } from '@/core/domain/entities/game/skill/active/warrior/mental/StrongBodySkill';
import { SkillCalcContext } from '@/core/domain/entities/game/skill/Skill';
import { SkillFlagsEnum } from '@/core/enum/SkillFlagsEnum';

const M1 = { skillLevel: 0.5 } as SkillCalcContext;

describe('StrongBodySkill', () => {
    const skill = new StrongBodySkill();

    it('uses SELFONLY only (no TOGGLE)', () => {
        expect(skill.flags.has(SkillFlagsEnum.SELFONLY)).to.equal(true);
        expect(skill.flags.has(SkillFlagsEnum.TOGGLE)).to.equal(false);
    });

    it('uses proto cooldown 63+90*k (M1 k=0.5 → 108)', () => {
        expect(skill.calculateCooldown(M1)).to.equal(108);
    });

    it('keeps proto duration 60+90*k (M1 k=0.5 → 105)', () => {
        for (const apply of skill.applies) {
            expect(apply.calculateDuration!(M1)).to.equal(105);
        }
    });
});
