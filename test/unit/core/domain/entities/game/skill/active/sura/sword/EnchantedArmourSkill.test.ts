import { expect } from 'chai';

import { EnchantedArmourSkill } from '@/core/domain/entities/game/skill/active/sura/sword/EnchantedArmourSkill';
import { SkillCalcContext } from '@/core/domain/entities/game/skill/Skill';
import { SkillFlagsEnum } from '@/core/enum/SkillFlagsEnum';

const M1 = { skillLevel: 0.5 } as SkillCalcContext;

describe('EnchantedArmourSkill', () => {
    const skill = new EnchantedArmourSkill();

    it('uses SELFONLY only (no TOGGLE)', () => {
        expect(skill.flags.has(SkillFlagsEnum.SELFONLY)).to.equal(true);
        expect(skill.flags.has(SkillFlagsEnum.TOGGLE)).to.equal(false);
    });

    it('uses proto cooldown 33+140*k (M1 k=0.5 → 103)', () => {
        expect(skill.calculateCooldown(M1)).to.equal(103);
    });

    it('keeps proto duration 30+120*k (M1 k=0.5 → 90)', () => {
        for (const apply of skill.applies) {
            expect(apply.calculateDuration!(M1)).to.equal(90);
        }
    });
});
