import Item from '@/core/domain/entities/game/item/Item';
import Player from '@/core/domain/entities/game/player/Player';
import ItemManager from '@/core/domain/manager/ItemManager';
import { AffectBitsTypeEnum } from '@/core/enum/AffectBitsTypeEnum';
import { ApplyTypeEnum } from '@/core/enum/ApplyTypeEnum';
import { PointsEnum } from '@/core/enum/PointsEnum';
import Logger from '@/core/infra/logger/Logger';
import PotionHandler from './PotionHandler';

const ABILITY_UP_APPLY: ReadonlyMap<ApplyTypeEnum, { point: PointsEnum; flag: AffectBitsTypeEnum }> = new Map([
    [ApplyTypeEnum.MOV_SPEED, { point: PointsEnum.MOVE_SPEED, flag: AffectBitsTypeEnum.MOV_SPEED_POTION }],
    [ApplyTypeEnum.ATT_SPEED, { point: PointsEnum.ATTACK_SPEED, flag: AffectBitsTypeEnum.ATT_SPEED_POTION }],
    [ApplyTypeEnum.STR, { point: PointsEnum.ST, flag: AffectBitsTypeEnum.NONE }],
    [ApplyTypeEnum.DEX, { point: PointsEnum.DX, flag: AffectBitsTypeEnum.NONE }],
    [ApplyTypeEnum.CON, { point: PointsEnum.HT, flag: AffectBitsTypeEnum.NONE }],
    [ApplyTypeEnum.INT, { point: PointsEnum.IQ, flag: AffectBitsTypeEnum.NONE }],
    [ApplyTypeEnum.CAST_SPEED, { point: PointsEnum.CASTING_SPEED, flag: AffectBitsTypeEnum.NONE }],
    [ApplyTypeEnum.ATT_GRADE_BONUS, { point: PointsEnum.ATT_GRADE_BONUS, flag: AffectBitsTypeEnum.NONE }],
    [ApplyTypeEnum.DEF_GRADE_BONUS, { point: PointsEnum.DEF_GRADE_BONUS, flag: AffectBitsTypeEnum.NONE }],
]);

export default class AbilityUpPotionHandler extends PotionHandler {
    constructor({ logger, itemManager }: { logger: Logger; itemManager: ItemManager }) {
        super({ logger, itemManager });
    }

    async execute(player: Player, item: Item): Promise<void> {
        if (item.getCount() <= 0) {
            this.logger.debug(
                `[AbilityUpPotionHandler] Item count invalid, this should never happen, playerId: ${player.getId()}, playerName: ${player.getName()}`,
            );
            return;
        }

        const [applyType, durationSeconds, amount] = item.getValues();
        const apply = ABILITY_UP_APPLY.get(applyType);

        if (!apply) {
            this.logger.info(
                `[AbilityUpPotionHandler] unknown apply type ${applyType} - vnum: ${item.getId()}, player: ${player.getName()}`,
            );
            return;
        }

        const duration = durationSeconds === 0 ? 1 : durationSeconds;
        player.addAffect({
            flag: apply.flag,
            point: apply.point,
            value: amount,
            duration,
        });
        await this.consume(player, item, 1);
    }
}
