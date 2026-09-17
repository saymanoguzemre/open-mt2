import Player from '@/core/domain/entities/game/player/Player';
import { ChatMessageTypeEnum } from '@/core/enum/ChatMessageTypeEnum';
import Logger from '@/core/infra/logger/Logger';
import Command from '@/game/domain/command/Command';
import { CommandMapValue } from '@/game/domain/command/Commands';

export default class CommandManager {
    private readonly logger: Logger;
    private readonly commands: Map<string, CommandMapValue<Command>>;
    private readonly container;

    constructor(container: { logger: Logger; commands: Map<string, CommandMapValue<Command>>; [key: string]: any }) {
        this.logger = container.logger;
        this.commands = container.commands;
        this.container = container;
    }

    async execute({ message, player }: { message: string; player: Player }) {
        //TODO: validate ban words
        if (message.startsWith('/help')) {
            if (!this.allowCommand(player, true)) return;

            for (const { command } of this.commands.values()) {
                const example = command.getExample() ? `- Example: ${command.getExample()}` : '';
                player.chat({
                    message: `Command: ${command.getName()} - Description: ${command.getDescription()} ${example} `,
                    messageType: ChatMessageTypeEnum.INFO,
                });
            }
            return;
        }

        const [commandName, ...args] = message.split(' ');

        const commandBuilder = this.commands.get(commandName);

        if (!commandBuilder) {
            if (!this.allowCommand(player, true)) return;

            this.logger.info(`[CommandManager] Invalid command: ${commandName}`);
            player.chat({
                message: `Invalid command: ${commandName}`,
                messageType: ChatMessageTypeEnum.INFO,
            });
            return;
        }

        const { command: Command, createHandler } = commandBuilder;

        if (!this.allowCommand(player, Command.requiresChatAllowed())) return;

        const command = new Command({ args });
        const commandHandler = createHandler(this.container);
        await commandHandler.execute(player, command);
    }

    private allowCommand(player: Player, requiresChatAllowed: boolean) {
        if (!requiresChatAllowed || player.isChatAllowed()) return true;

        this.logger.debug(`[CommandManager] Chat flood from ${player.getName()}, command dropped`);
        return false;
    }
}
