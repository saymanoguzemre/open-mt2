import { expect } from 'chai';
import sinon from 'sinon';
import { PlayerPoints } from '@/core/domain/entities/game/player/delegate/PlayerPoints';
import { PointsEnum } from '@/core/enum/PointsEnum';

const MAX_LEVEL = 120;

const makePoints = ({ level = 1, experience = 0 }: { level?: number; experience?: number } = {}) => {
    const player: any = {
        isHorseRiding: () => false,
        getHorseLevel: () => 0,
        isAffectByFlag: () => false,
        getPolymorphVnum: () => 0,
        getSkillGroup: () => 0,
        getPlayerClass: () => 0,
        levelUp: sinon.stub(),
        getWeaponValues: () => ({
            physic: { min: 0, max: 0, bonus: 0 },
            magic: { min: 0, max: 0, bonus: 0 },
        }),
        getArmorValues: () => [],
    };

    return new PlayerPoints(
        {
            st: 15,
            ht: 13,
            dx: 8,
            iq: 4,
            level,
            experience,
            health: 100,
            mana: 100,
            stamina: 100,
            gold: 0,
            givenStatusPoints: 0,
            availableStatusPoints: 0,
            hpPerLvl: 1,
            hpPerHtPoint: 1,
            mpPerLvl: 1,
            mpPerIqPoint: 1,
            baseHealth: 100,
            baseMana: 100,
            defensePerHtPoint: 1,
            attackPerStPoint: 1,
            attackPerDxPoint: 1,
            attackPerIqPoint: 1,
            baseAttackSpeed: 100,
            baseMovementSpeed: 100,
        } as any,
        {
            config: {
                MAX_POINTS: 150,
                MAX_LEVEL,
                POINTS_PER_LEVEL: 3,
                jobs: {
                    warrior: { common: { st: 15, ht: 13, dx: 8, iq: 4 } },
                },
            } as any,
            experienceManager: { getNeededExperience: (lvl: number) => (lvl > MAX_LEVEL ? 0 : 1000) } as any,
            player,
            mobManager: { getMobProto: () => ({ st: 20, ht: 20, dx: 20, iq: 20 }) } as any,
        } as any,
    );
};

describe('PlayerPoints character level cap', () => {
    afterEach(() => sinon.restore());

    it('allows setPoint(LEVEL) up to MAX_LEVEL', () => {
        const points = makePoints();

        points.setPoint(PointsEnum.LEVEL, MAX_LEVEL);

        expect(points.getPoint(PointsEnum.LEVEL)).to.equal(MAX_LEVEL);
    });

    it('ignores setPoint(LEVEL) above MAX_LEVEL', () => {
        const points = makePoints({ level: 30 });

        points.setPoint(PointsEnum.LEVEL, MAX_LEVEL + 1);

        expect(points.getPoint(PointsEnum.LEVEL)).to.equal(30);
    });

    it('levels from MAX_LEVEL - 1 to MAX_LEVEL when enough experience is added', () => {
        const points = makePoints({ level: MAX_LEVEL - 1, experience: 0 });

        points.addPoint(PointsEnum.EXPERIENCE, 1000);

        expect(points.getPoint(PointsEnum.LEVEL)).to.equal(MAX_LEVEL);
        expect(points.getPoint(PointsEnum.EXPERIENCE)).to.equal(0);
    });

    it('does not raise the level past MAX_LEVEL and keeps leftover experience up to the cap', () => {
        const points = makePoints({ level: MAX_LEVEL - 1, experience: 0 });

        points.addPoint(PointsEnum.EXPERIENCE, 5000);

        expect(points.getPoint(PointsEnum.LEVEL)).to.equal(MAX_LEVEL);
        expect(points.getPoint(PointsEnum.EXPERIENCE)).to.equal(999);
    });

    it('gains experience at MAX_LEVEL without leveling', () => {
        const points = makePoints({ level: MAX_LEVEL, experience: 0 });

        points.addPoint(PointsEnum.EXPERIENCE, 400);

        expect(points.getPoint(PointsEnum.LEVEL)).to.equal(MAX_LEVEL);
        expect(points.getPoint(PointsEnum.EXPERIENCE)).to.equal(400);
    });

    it('caps experience at neededExp - 1 so a max-level character never promotes', () => {
        const points = makePoints({ level: MAX_LEVEL, experience: 0 });

        points.addPoint(PointsEnum.EXPERIENCE, 5000);

        expect(points.getPoint(PointsEnum.LEVEL)).to.equal(MAX_LEVEL);
        expect(points.getPoint(PointsEnum.EXPERIENCE)).to.equal(999);
    });

    it('lets a max-level character spend experience without going below 0', () => {
        const points = makePoints({ level: MAX_LEVEL, experience: 500 });

        points.addPoint(PointsEnum.EXPERIENCE, -200);
        expect(points.getPoint(PointsEnum.EXPERIENCE)).to.equal(300);

        points.addPoint(PointsEnum.EXPERIENCE, -1000);
        expect(points.getPoint(PointsEnum.EXPERIENCE)).to.equal(0);
        expect(points.getPoint(PointsEnum.LEVEL)).to.equal(MAX_LEVEL);
    });

    it('ignores addPoint(LEVEL) that would exceed MAX_LEVEL', () => {
        const points = makePoints({ level: MAX_LEVEL });

        points.addPoint(PointsEnum.LEVEL, 1);

        expect(points.getPoint(PointsEnum.LEVEL)).to.equal(MAX_LEVEL);
    });
});
