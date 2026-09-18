import Logger from '@/core/infra/logger/Logger';
import CommandHandler from '../../CommandHandler';
import YangCommand from './YangCommand';
import World from '@/core/domain/World';
import Player from '@/core/domain/entities/game/player/Player';
import { ChatMessageTypeEnum } from '@/core/enum/ChatMessageTypeEnum';
import { PointsEnum } from '@/core/enum/PointsEnum';

export default class YangCommandHandler extends CommandHandler<YangCommand> {
    private readonly logger: Logger;
    private readonly world: World;

    constructor({ logger, world }: { logger: Logger; world: World }) {
        super();
        this.logger = logger;
        this.world = world;
    }

    async execute(player: Player, yangCommand: YangCommand) {
        if (!yangCommand.isValid()) {
            const errors = yangCommand.errors();
            this.logger.error(yangCommand.getErrorMessage());
            player.sendCommandErrors(errors);
            return;
        }

        const [value, targetName] = yangCommand.getArgs();

        if (!targetName) {
            player.addPoint(PointsEnum.GOLD, Number(value));
            return;
        }

        const target = this.world.getPlayerByName(targetName);

        if (!target) {
            player.chat({
                message: `Target: ${targetName} not found.`,
                messageType: ChatMessageTypeEnum.INFO,
            });
            return;
        }

        target.addPoint(PointsEnum.GOLD, Number(value));
    }
}
