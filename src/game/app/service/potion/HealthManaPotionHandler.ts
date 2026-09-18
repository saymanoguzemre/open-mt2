import Item from '@/core/domain/entities/game/item/Item';
import Player from '@/core/domain/entities/game/player/Player';
import ItemManager from '@/core/domain/manager/ItemManager';
import { PointsEnum } from '@/core/enum/PointsEnum';
import { SpecialEffectTypeEnum } from '@/core/enum/SpecialEffectTypeEnum';
import { TimedEventsEnum } from '@/core/enum/TimedEventsEnum';
import Logger from '@/core/infra/logger/Logger';
import PotionHandler from './PotionHandler';

const RECOVERY_TICK_INTERVAL_MS = 1_000;
/** Original UpdateAffect: min(pool, max HP/SP * 7 / 100) each second. */
const RECOVERY_TICK_MAX_PERCENT = 7;

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

        this.startRecoveryTimer(player, TimedEventsEnum.MANA_POTION, () =>
            this.applyRecoveryTick(
                player,
                PointsEnum.MANA_RECOVERY,
                PointsEnum.MANA,
                PointsEnum.MAX_MANA,
                TimedEventsEnum.MANA_POTION,
            ),
        );
    }

    private async useHealthPotion(player: Player, item: Item) {
        const hasUsedPotionUntilMaxHealth =
            player.getPoint(PointsEnum.HP_RECOVERY) + player.getPoint(PointsEnum.HEALTH) >=
            player.getPoint(PointsEnum.MAX_HEALTH);
        if (hasUsedPotionUntilMaxHealth) return;

        const amount = (item.getValues()[0] * Math.min(200, 100 + player.getPoint(PointsEnum.POTION_BONUS))) / 100;
        player.addPoint(PointsEnum.HP_RECOVERY, amount);
        player.sendSpecialEffect(SpecialEffectTypeEnum.HP_UP_RED);
        await this.consume(player, item, 1);

        this.startRecoveryTimer(player, TimedEventsEnum.HEALTH_POTION, () =>
            this.applyRecoveryTick(
                player,
                PointsEnum.HP_RECOVERY,
                PointsEnum.HEALTH,
                PointsEnum.MAX_HEALTH,
                TimedEventsEnum.HEALTH_POTION,
            ),
        );
    }

    private startRecoveryTimer(player: Player, timerId: TimedEventsEnum, eventFunction: () => void) {
        if (player.isEventTimerActive(timerId)) return;

        player.addEventTimer({
            id: timerId,
            eventFunction,
            options: {
                interval: RECOVERY_TICK_INTERVAL_MS,
            },
        });
    }

    private applyRecoveryTick(
        player: Player,
        recoveryPoint: PointsEnum,
        currentPoint: PointsEnum,
        maxPoint: PointsEnum,
        timerId: TimedEventsEnum,
    ) {
        const pool = player.getPoint(recoveryPoint);
        if (player.getPoint(currentPoint) >= player.getPoint(maxPoint)) {
            if (pool > 0) {
                player.addPoint(recoveryPoint, -pool);
            }
            player.removeEventTimer(timerId);
            return;
        }

        if (pool <= 0) {
            player.removeEventTimer(timerId);
            return;
        }

        const tickAmount = Math.min(pool, Math.floor((player.getPoint(maxPoint) * RECOVERY_TICK_MAX_PERCENT) / 100));
        player.addPoint(currentPoint, tickAmount);
        player.addPoint(recoveryPoint, -tickAmount);

        if (player.getPoint(recoveryPoint) <= 0) {
            player.removeEventTimer(timerId);
        }
    }
}
