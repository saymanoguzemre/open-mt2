import Item from '@/core/domain/entities/game/item/Item';
import Player from '@/core/domain/entities/game/player/Player';
import ItemManager from '@/core/domain/manager/ItemManager';
import { WindowTypeEnum } from '@/core/enum/WindowTypeEnum';
import Logger from '@/core/infra/logger/Logger';

export default abstract class PotionHandler {
    protected readonly logger: Logger;
    protected readonly itemManager: ItemManager;

    constructor({ logger, itemManager }: { logger: Logger; itemManager: ItemManager }) {
        this.logger = logger;
        this.itemManager = itemManager;
    }

    abstract execute(player: Player, item: Item): Promise<void>;

    protected async consume(player: Player, item: Item, quantity: number = 1): Promise<boolean> {
        if (quantity <= 0 || item.getCount() < quantity) return false;

        if (item.getCount() <= quantity) {
            player.getInventory().removeItem(item.getPosition(), item.getSize());
            player.sendItemRemoved({
                window: WindowTypeEnum.INVENTORY,
                position: item.getPosition(),
            });
            await this.itemManager.delete(item);
            return true;
        }

        item.decreaseCount(quantity);
        player.sendItemUpdate(item);
        await this.itemManager.update(item);
        return true;
    }
}
