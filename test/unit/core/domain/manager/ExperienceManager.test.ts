import { expect } from 'chai';
import ExperienceManager from '@/core/domain/manager/ExperienceManager';
import exp from '@/core/infra/config/data/exp/exp';
import general from '@/core/infra/config/data/general.json';
import { PrivilegeManager } from '@/core/domain/manager/PrivilegeManager';

describe('ExperienceManager', () => {
    const manager = new ExperienceManager({
        config: { MAX_LEVEL: general.MAX_LEVEL } as any,
        privilegeManager: new PrivilegeManager(),
    });

    it('has one exp entry per character level', () => {
        expect(exp).to.have.length(general.MAX_LEVEL);
    });

    it('returns the first table entry for level 1', () => {
        expect(manager.getNeededExperience(1)).to.equal(exp[0]);
    });

    it('returns the last table entry at MAX_LEVEL so the client exp bar is not 0/0', () => {
        expect(manager.getNeededExperience(general.MAX_LEVEL)).to.equal(exp[general.MAX_LEVEL - 1]);
        expect(manager.getNeededExperience(general.MAX_LEVEL)).to.be.greaterThan(0);
    });

    it('returns 0 outside the valid level range', () => {
        expect(manager.getNeededExperience(0)).to.equal(0);
        expect(manager.getNeededExperience(general.MAX_LEVEL + 1)).to.equal(0);
    });
});
