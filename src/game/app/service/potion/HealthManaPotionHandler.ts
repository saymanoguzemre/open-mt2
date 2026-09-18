import Item from '@/core/domain/entities/game/item/Item';
import Player from '@/core/domain/entities/game/player/Player';
import ItemManager from '@/core/domain/manager/ItemManager';
import { PointsEnum } from '@/core/enum/PointsEnum';
import { SpecialEffectTypeEnum } from '@/core/enum/SpecialEffectTypeEnum';
import { TimedEventsEnum } from '@/core/enum/TimedEventsEnum';
import Logger from '@/core/infra/logger/Logger';
import PotionHandler from './PotionHandler';

export default class HealthManaPotionHandler extends PotionHandler {
    constructor({ logger, itemManager }: { logger: Logger; itemManager: ItemManager }) {
        super({ logger, itemManager });
    }

    async execute(player: Player, item: Item): Promise<void> {
        if (item.getCount() <= 0) {
            this.logger.debug(
                `[HealthManaPotionHandler] Item count invalid, this should never happen, playerId: ${player.getId()}, playerName: ${player.getName()}`,
            );
            return;
        }

        const isMpPotion = item.getValues()[1] > 0;
        if (isMpPotion) {
            await this.useManaPotion(player, item);
            return;
        }

        const isHpPotion = item.getValues()[0] > 0;
        if (isHpPotion) {
            await this.useHealthPotion(player, item);
        }
    }

    private async useManaPotion(player: Player, item: Item) {
        const hasUsedPotionUntilMaxMana =
            player.getPoint(PointsEnum.MANA_RECOVERY) + player.getPoint(PointsEnum.MANA) >=
            player.getPoint(PointsEnum.MAX_MANA);
        if (hasUsedPotionUntilMaxMana) return;

        const amount = (item.getValues()[1] * Math.min(200, 100 + player.getPoint(PointsEnum.POTION_BONUS))) / 100;
        player.addPoint(PointsEnum.MANA_RECOVERY, amount);
        player.sendSpecialEffect(SpecialEffectTypeEnum.SP_UP_BLUE);

        await this.consume(player, item, 1);

        if (player.isEventTimerActive(TimedEventsEnum.MANA_POTION)) return;

        player.addEventTimer({
            id: TimedEventsEnum.MANA_POTION,
            eventFunction: () => {
                const manaIsFull = player.getPoint(PointsEnum.MANA) >= player.getPoint(PointsEnum.MAX_MANA);
                if (manaIsFull) return;

                const amount = player.getPoint(PointsEnum.MANA_RECOVERY);

                if (amount <= 0) return;

                player.addPoint(PointsEnum.MANA, amount);
                player.addPoint(PointsEnum.MANA_RECOVERY, -amount);
            },
            options: {
                interval: 1_000,
                duration: 1_000,
            },
        });
    }

    private async useHealthPotion(player: Player, item: Item) {
        const hasUsedPotionUntilMaxMana =
            player.getPoint(PointsEnum.HP_RECOVERY) + player.getPoint(PointsEnum.HEALTH) >=
            player.getPoint(PointsEnum.MAX_HEALTH);
        if (hasUsedPotionUntilMaxMana) return;

        const amount = (item.getValues()[0] * Math.min(200, 100 + player.getPoint(PointsEnum.POTION_BONUS))) / 100;
        player.addPoint(PointsEnum.HP_RECOVERY, amount);
        player.sendSpecialEffect(SpecialEffectTypeEnum.HP_UP_RED);
        await this.consume(player, item, 1);

        if (player.isEventTimerActive(TimedEventsEnum.HEALTH_POTION)) return;

        player.addEventTimer({
            id: TimedEventsEnum.HEALTH_POTION,
            eventFunction: () => {
                const healthIsFull = player.getPoint(PointsEnum.HEALTH) >= player.getPoint(PointsEnum.MAX_HEALTH);
                if (healthIsFull) return;

                const amount = player.getPoint(PointsEnum.HP_RECOVERY);

                if (amount <= 0) return;

                player.addPoint(PointsEnum.HEALTH, amount);
                player.addPoint(PointsEnum.HP_RECOVERY, -amount);
            },
            options: {
                interval: 1_000,
                duration: 1_000,
            },
        });
    }
}
