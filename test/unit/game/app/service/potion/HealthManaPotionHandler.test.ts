import { expect } from 'chai';
import sinon from 'sinon';
import { PointsEnum } from '@/core/enum/PointsEnum';
import { SpecialEffectTypeEnum } from '@/core/enum/SpecialEffectTypeEnum';
import { TimedEventsEnum } from '@/core/enum/TimedEventsEnum';
import { WindowTypeEnum } from '@/core/enum/WindowTypeEnum';
import WinstonLoggerAdapter from '@/core/infra/logger/WinstonLoggerAdapter';
import HealthManaPotionHandler from '@/game/app/service/potion/HealthManaPotionHandler';

describe('HealthManaPotionHandler', () => {
    let loggerStub;
    let itemManagerStub;
    let handler: HealthManaPotionHandler;
    let playerStub;
    let inventoryStub;
    let points: Record<number, number>;
    let timerActive: boolean;

    const createItem = ({ values, count = 1 }: { values: number[]; count?: number }) => ({
        getValues: sinon.stub().returns(values),
        getCount: sinon.stub().returns(count),
        getPosition: sinon.stub().returns(2),
        getSize: sinon.stub().returns(1),
        getId: sinon.stub().returns(27003),
        decreaseCount: sinon.stub(),
    });

    const drinkLargeRedPotions = async (count: number) => {
        for (let i = 0; i < count; i++) {
            await handler.execute(playerStub, createItem({ values: [1200, 0], count: 2 }) as any);
        }
    };

    const recoveryTick = () => {
        const timerCall = playerStub.addEventTimer.getCall(0);
        expect(timerCall, 'recovery timer should have been started').to.not.equal(null);
        timerCall.args[0].eventFunction();
    };

    beforeEach(() => {
        loggerStub = sinon.createStubInstance(WinstonLoggerAdapter);
        itemManagerStub = {
            delete: sinon.stub().resolves(),
            update: sinon.stub().resolves(),
        };
        handler = new HealthManaPotionHandler({
            logger: loggerStub,
            itemManager: itemManagerStub,
        });
        inventoryStub = { removeItem: sinon.stub() };
        points = {
            [PointsEnum.HEALTH]: 3000,
            [PointsEnum.MAX_HEALTH]: 10000,
            [PointsEnum.HP_RECOVERY]: 0,
            [PointsEnum.MANA]: 1000,
            [PointsEnum.MAX_MANA]: 10000,
            [PointsEnum.MANA_RECOVERY]: 0,
            [PointsEnum.POTION_BONUS]: 0,
        };
        timerActive = false;
        playerStub = {
            getId: sinon.stub().returns(1),
            getName: sinon.stub().returns('tester'),
            getPoint: (point: PointsEnum) => points[point] ?? 0,
            addPoint: (point: PointsEnum, value: number) => {
                const next = (points[point] ?? 0) + value;
                if (point === PointsEnum.HEALTH) {
                    points[point] = Math.max(0, Math.min(next, points[PointsEnum.MAX_HEALTH]));
                    return;
                }
                if (point === PointsEnum.MANA) {
                    points[point] = Math.max(0, Math.min(next, points[PointsEnum.MAX_MANA]));
                    return;
                }
                points[point] = next;
            },
            sendSpecialEffect: sinon.stub(),
            isEventTimerActive: sinon.stub().callsFake(() => timerActive),
            addEventTimer: sinon.stub().callsFake(() => {
                timerActive = true;
            }),
            removeEventTimer: sinon.stub().callsFake(() => {
                timerActive = false;
            }),
            getInventory: sinon.stub().returns(inventoryStub),
            sendItemRemoved: sinon.stub(),
            sendItemUpdate: sinon.stub(),
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should add the potion amount to the HP recovery pool and play the red effect', async () => {
        await drinkLargeRedPotions(1);

        expect(points[PointsEnum.HP_RECOVERY]).to.equal(1200);
        expect(playerStub.sendSpecialEffect.calledOnceWith(SpecialEffectTypeEnum.HP_UP_RED)).to.be.true;
        expect(itemManagerStub.update.calledOnce).to.be.true;
    });

    it('should refuse a health potion when current HP plus the pool already fills max HP', async () => {
        points[PointsEnum.HEALTH] = 9000;
        points[PointsEnum.HP_RECOVERY] = 1000;

        await drinkLargeRedPotions(1);

        expect(points[PointsEnum.HP_RECOVERY]).to.equal(1000);
        expect(playerStub.addEventTimer.notCalled).to.be.true;
        expect(itemManagerStub.update.notCalled).to.be.true;
    });

    it('should apply at most 7% of max HP per tick, not the whole recovery pool', async () => {
        await drinkLargeRedPotions(5);

        expect(points[PointsEnum.HP_RECOVERY]).to.equal(6000);

        recoveryTick();

        expect(points[PointsEnum.HEALTH]).to.equal(3700);
        expect(points[PointsEnum.HP_RECOVERY]).to.equal(5300);
        expect(playerStub.removeEventTimer.notCalled).to.be.true;
    });

    it('should keep ticking until the HP recovery pool is drained', async () => {
        await drinkLargeRedPotions(5);

        const timerOptions = playerStub.addEventTimer.firstCall.args[0].options;
        expect(timerOptions.interval).to.equal(1_000);
        expect(timerOptions.duration).to.equal(undefined);

        for (let i = 0; i < 8; i++) {
            recoveryTick();
        }

        expect(points[PointsEnum.HEALTH]).to.equal(8600);
        expect(points[PointsEnum.HP_RECOVERY]).to.equal(400);
        expect(playerStub.removeEventTimer.notCalled).to.be.true;

        recoveryTick();

        expect(points[PointsEnum.HEALTH]).to.equal(9000);
        expect(points[PointsEnum.HP_RECOVERY]).to.equal(0);
        expect(playerStub.removeEventTimer.calledWith(TimedEventsEnum.HEALTH_POTION)).to.be.true;
    });

    it('should stop recovery and clear the remaining pool when HP is full', async () => {
        await drinkLargeRedPotions(5);
        points[PointsEnum.HEALTH] = 10000;

        recoveryTick();

        expect(points[PointsEnum.HEALTH]).to.equal(10000);
        expect(points[PointsEnum.HP_RECOVERY]).to.equal(0);
        expect(playerStub.removeEventTimer.calledWith(TimedEventsEnum.HEALTH_POTION)).to.be.true;
    });

    it('should stack additional potions onto the pool while the timer is already running', async () => {
        await drinkLargeRedPotions(1);
        expect(playerStub.addEventTimer.calledOnce).to.be.true;

        await drinkLargeRedPotions(4);

        expect(points[PointsEnum.HP_RECOVERY]).to.equal(6000);
        expect(playerStub.addEventTimer.calledOnce).to.be.true;
    });

    it('should apply at most 7% of max mana per tick from the mana recovery pool', async () => {
        await handler.execute(playerStub, createItem({ values: [0, 1200], count: 2 }) as any);
        await handler.execute(playerStub, createItem({ values: [0, 1200], count: 2 }) as any);

        expect(points[PointsEnum.MANA_RECOVERY]).to.equal(2400);
        expect(playerStub.sendSpecialEffect.calledWith(SpecialEffectTypeEnum.SP_UP_BLUE)).to.be.true;

        const timerOptions = playerStub.addEventTimer.firstCall.args[0].options;
        expect(timerOptions.interval).to.equal(1_000);
        expect(timerOptions.duration).to.equal(undefined);

        playerStub.addEventTimer.firstCall.args[0].eventFunction();

        expect(points[PointsEnum.MANA]).to.equal(1700);
        expect(points[PointsEnum.MANA_RECOVERY]).to.equal(1700);
    });
});
