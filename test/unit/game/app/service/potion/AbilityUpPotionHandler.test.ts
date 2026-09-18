import { expect } from 'chai';
import sinon from 'sinon';
import { AffectBitsTypeEnum } from '@/core/enum/AffectBitsTypeEnum';
import { ApplyTypeEnum } from '@/core/enum/ApplyTypeEnum';
import { PointsEnum } from '@/core/enum/PointsEnum';
import { WindowTypeEnum } from '@/core/enum/WindowTypeEnum';
import WinstonLoggerAdapter from '@/core/infra/logger/WinstonLoggerAdapter';
import AbilityUpPotionHandler from '@/game/app/service/potion/AbilityUpPotionHandler';

describe('AbilityUpPotionHandler', () => {
    let loggerStub;
    let itemManagerStub;
    let handler: AbilityUpPotionHandler;
    let playerStub;
    let inventoryStub;

    const createItem = ({ values, count = 1 }: { values: number[]; count?: number }) => ({
        getValues: sinon.stub().returns(values),
        getCount: sinon.stub().returns(count),
        getPosition: sinon.stub().returns(2),
        getSize: sinon.stub().returns(1),
        getId: sinon.stub().returns(27115),
        decreaseCount: sinon.stub(),
    });

    beforeEach(() => {
        loggerStub = sinon.createStubInstance(WinstonLoggerAdapter);
        itemManagerStub = {
            delete: sinon.stub().resolves(),
            update: sinon.stub().resolves(),
        };
        handler = new AbilityUpPotionHandler({
            logger: loggerStub,
            itemManager: itemManagerStub,
        });
        inventoryStub = { removeItem: sinon.stub() };
        playerStub = {
            addAffect: sinon.stub(),
            getInventory: sinon.stub().returns(inventoryStub),
            sendItemRemoved: sinon.stub(),
            sendItemUpdate: sinon.stub(),
            getId: sinon.stub().returns(1),
            getName: sinon.stub().returns('tester'),
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should apply a purple move-speed potion and consume it', async () => {
        const item = createItem({ values: [ApplyTypeEnum.MOV_SPEED, 600, 30] });

        await handler.execute(playerStub, item as any);

        expect(
            playerStub.addAffect.calledOnceWith({
                flag: AffectBitsTypeEnum.MOV_SPEED_POTION,
                point: PointsEnum.MOVE_SPEED,
                value: 30,
                duration: 600,
            }),
        ).to.be.true;
        expect(inventoryStub.removeItem.calledOnceWith(2, 1)).to.be.true;
        expect(playerStub.sendItemRemoved.calledOnceWith({ window: WindowTypeEnum.INVENTORY, position: 2 })).to.be.true;
        expect(itemManagerStub.delete.calledOnceWith(item)).to.be.true;
    });

    it('should apply a green attack-speed potion and consume it', async () => {
        const item = createItem({ values: [ApplyTypeEnum.ATT_SPEED, 600, 20] });

        await handler.execute(playerStub, item as any);

        expect(
            playerStub.addAffect.calledOnceWith({
                flag: AffectBitsTypeEnum.ATT_SPEED_POTION,
                point: PointsEnum.ATTACK_SPEED,
                value: 20,
                duration: 600,
            }),
        ).to.be.true;
        expect(itemManagerStub.delete.calledOnceWith(item)).to.be.true;
    });

    it('should apply sushi att-grade bonus with no affect flag and consume it', async () => {
        const item = createItem({ values: [ApplyTypeEnum.ATT_GRADE_BONUS, 300, 50] });

        await handler.execute(playerStub, item as any);

        expect(
            playerStub.addAffect.calledOnceWith({
                flag: AffectBitsTypeEnum.NONE,
                point: PointsEnum.ATT_GRADE_BONUS,
                value: 50,
                duration: 300,
            }),
        ).to.be.true;
        expect(itemManagerStub.delete.calledOnceWith(item)).to.be.true;
    });

    it('should not consume an unknown apply type', async () => {
        const item = createItem({ values: [999, 600, 30] });

        await handler.execute(playerStub, item as any);

        expect(playerStub.addAffect.notCalled).to.be.true;
        expect(itemManagerStub.delete.notCalled).to.be.true;
        expect(itemManagerStub.update.notCalled).to.be.true;
        expect(loggerStub.info.calledOnce).to.be.true;
    });

    it('should treat a zero duration as 1 second', async () => {
        const item = createItem({ values: [ApplyTypeEnum.MOV_SPEED, 0, 30] });

        await handler.execute(playerStub, item as any);

        expect(playerStub.addAffect.calledOnce).to.be.true;
        expect(playerStub.addAffect.firstCall.args[0].duration).to.equal(1);
        expect(itemManagerStub.delete.calledOnceWith(item)).to.be.true;
    });
});
