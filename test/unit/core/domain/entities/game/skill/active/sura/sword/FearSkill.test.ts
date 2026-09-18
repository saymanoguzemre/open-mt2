import { expect } from 'chai';

import { FearSkill } from '@/core/domain/entities/game/skill/active/sura/sword/FearSkill';
import { SkillCalcContext } from '@/core/domain/entities/game/skill/Skill';
import { SkillFlagsEnum } from '@/core/enum/SkillFlagsEnum';

const M1 = { skillLevel: 0.5 } as SkillCalcContext;

describe('FearSkill', () => {
    const skill = new FearSkill();

    it('uses SELFONLY only (no TOGGLE)', () => {
        expect(skill.flags.has(SkillFlagsEnum.SELFONLY)).to.equal(true);
        expect(skill.flags.has(SkillFlagsEnum.TOGGLE)).to.equal(false);
    });

    it('uses proto cooldown 100', () => {
        expect(skill.calculateCooldown(M1)).to.equal(100);
    });

    it('keeps proto duration 60+100*k (M1 k=0.5 → 110)', () => {
        for (const apply of skill.applies) {
            expect(apply.calculateDuration!(M1)).to.equal(110);
        }
    });
});
