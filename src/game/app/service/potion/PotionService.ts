import Item from '@/core/domain/entities/game/item/Item';
import Player from '@/core/domain/entities/game/player/Player';
import { ItemUseSubTypeEnum } from '@/core/enum/ItemUseSubTypeEnum';
import AbilityUpPotionHandler from './AbilityUpPotionHandler';
import HealthManaPotionHandler from './HealthManaPotionHandler';
import PotionHandler from './PotionHandler';

export default class PotionService {
    private readonly handlers: Map<ItemUseSubTypeEnum, PotionHandler>;

    constructor({
        healthManaPotionHandler,
        abilityUpPotionHandler,
    }: {
        healthManaPotionHandler: HealthManaPotionHandler;
        abilityUpPotionHandler: AbilityUpPotionHandler;
    }) {
        this.handlers = new Map([
            [ItemUseSubTypeEnum.USE_POTION, healthManaPotionHandler],
            [ItemUseSubTypeEnum.USE_ABILITY_UP, abilityUpPotionHandler],
        ]);
    }

    handles(subType: ItemUseSubTypeEnum): boolean {
        return this.handlers.has(subType);
    }

    async execute(player: Player, item: Item): Promise<boolean> {
        const handler = this.handlers.get(item.getSubType());
        if (!handler) return false;

        await handler.execute(player, item);
        return true;
    }
}
