import { expect } from 'chai';
import sinon from 'sinon';
import { ItemUseSubTypeEnum } from '@/core/enum/ItemUseSubTypeEnum';
import AbilityUpPotionHandler from '@/game/app/service/potion/AbilityUpPotionHandler';
import HealthManaPotionHandler from '@/game/app/service/potion/HealthManaPotionHandler';
import PotionService from '@/game/app/service/potion/PotionService';

describe('PotionService', () => {
    let healthManaPotionHandler;
    let abilityUpPotionHandler;
    let service: PotionService;
    let playerStub;
    let itemStub;

    beforeEach(() => {
        healthManaPotionHandler = sinon.createStubInstance(HealthManaPotionHandler);
        abilityUpPotionHandler = sinon.createStubInstance(AbilityUpPotionHandler);
        service = new PotionService({
            healthManaPotionHandler,
            abilityUpPotionHandler,
        });
        playerStub = {};
        itemStub = { getSubType: sinon.stub() };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should handle USE_POTION and USE_ABILITY_UP', () => {
        expect(service.handles(ItemUseSubTypeEnum.USE_POTION)).to.be.true;
        expect(service.handles(ItemUseSubTypeEnum.USE_ABILITY_UP)).to.be.true;
    });

    it('should not handle an unknown subtype', () => {
        expect(service.handles(ItemUseSubTypeEnum.USE_SPECIAL)).to.be.false;
    });

    it('should dispatch USE_POTION to the health/mana handler', async () => {
        itemStub.getSubType.returns(ItemUseSubTypeEnum.USE_POTION);

        const result = await service.execute(playerStub as any, itemStub as any);

        expect(result).to.be.true;
        expect(healthManaPotionHandler.execute.calledOnceWith(playerStub, itemStub)).to.be.true;
        expect(abilityUpPotionHandler.execute.notCalled).to.be.true;
    });

    it('should dispatch USE_ABILITY_UP to the ability-up handler', async () => {
        itemStub.getSubType.returns(ItemUseSubTypeEnum.USE_ABILITY_UP);

        const result = await service.execute(playerStub as any, itemStub as any);

        expect(result).to.be.true;
        expect(abilityUpPotionHandler.execute.calledOnceWith(playerStub, itemStub)).to.be.true;
        expect(healthManaPotionHandler.execute.notCalled).to.be.true;
    });

    it('should return false for an unknown subtype without executing a handler', async () => {
        itemStub.getSubType.returns(ItemUseSubTypeEnum.USE_SPECIAL);

        const result = await service.execute(playerStub as any, itemStub as any);

        expect(result).to.be.false;
        expect(healthManaPotionHandler.execute.notCalled).to.be.true;
        expect(abilityUpPotionHandler.execute.notCalled).to.be.true;
    });
});
