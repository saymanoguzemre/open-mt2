import { expect } from 'chai';

import { AuraOfWordSkill } from '@/core/domain/entities/game/skill/active/warrior/body/AuraOfWordSkill';
import { SkillCalcContext } from '@/core/domain/entities/game/skill/Skill';
import { SkillFlagsEnum } from '@/core/enum/SkillFlagsEnum';

const M1 = { skillLevel: 0.5 } as SkillCalcContext;

describe('AuraOfWordSkill', () => {
    const skill = new AuraOfWordSkill();

    it('uses SELFONLY only (no TOGGLE)', () => {
        expect(skill.flags.has(SkillFlagsEnum.SELFONLY)).to.equal(true);
        expect(skill.flags.has(SkillFlagsEnum.TOGGLE)).to.equal(false);
    });

    it('uses proto cooldown 33+50*k (M1 k=0.5 → 58)', () => {
        expect(skill.calculateCooldown(M1)).to.equal(58);
    });

    it('keeps proto duration 30+50*k (M1 k=0.5 → 55)', () => {
        for (const apply of skill.applies) {
            expect(apply.calculateDuration!(M1)).to.equal(55);
        }
    });
});
