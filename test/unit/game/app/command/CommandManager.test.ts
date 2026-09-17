import { expect } from 'chai';
import sinon from 'sinon';
import CommandManager from '@/game/app/command/CommandManager';
import { ChatMessageTypeEnum } from '@/core/enum/ChatMessageTypeEnum';
import SkillUpCommand from '@/game/domain/command/command/skillUp/SkillUpCommand';
import StatCommand from '@/game/domain/command/command/stat/StatCommand';

describe('CommandManager', () => {
    let commandManager: CommandManager;
    let loggerStub;
    let playerStub;
    let containerStub;
    let commandStub;
    let commandHandlerStub;

    beforeEach(() => {
        loggerStub = {
            info: sinon.stub(),
            debug: sinon.stub(),
        };
        playerStub = {
            chat: sinon.stub(),
            getName: () => 'TestPlayer',
            isChatAllowed: sinon.stub().returns(true),
        };
        commandStub = class {
            static getName = sinon.stub().returns('testCommand');
            static getDescription = sinon.stub().returns('Test command description');
            static getExample = sinon.stub().returns('Example usage');
            static requiresChatAllowed = sinon.stub().returns(true);
        };
        commandHandlerStub = {
            execute: sinon.stub().resolves(),
        };
        containerStub = {
            logger: loggerStub,
            commands: new Map([['/test', { command: commandStub, createHandler: () => commandHandlerStub }]]),
        };

        commandManager = new CommandManager(containerStub);
    });

    afterEach(() => sinon.restore());

    it('should list all commands when /help is used', async () => {
        await commandManager.execute({ message: '/help', player: playerStub });

        expect(playerStub.chat.calledOnce).to.be.true;
        expect(
            playerStub.chat.calledWith({
                message: `Command: ${commandStub.getName()} - Description: ${commandStub.getDescription()} - Example: ${commandStub.getExample()} `,
                messageType: ChatMessageTypeEnum.INFO,
            }),
        ).to.be.true;
    });

    it('should handle invalid command', async () => {
        await commandManager.execute({ message: '/invalid', player: playerStub });

        expect(loggerStub.info.calledOnce).to.be.true;
        expect(loggerStub.info.calledWith('[CommandManager] Invalid command: /invalid')).to.be.true;
        expect(playerStub.chat.calledOnce).to.be.true;
        expect(
            playerStub.chat.calledWith({
                message: 'Invalid command: /invalid',
                messageType: ChatMessageTypeEnum.INFO,
            }),
        ).to.be.true;
    });

    it('should execute valid command', async () => {
        await commandManager.execute({ message: '/test arg1 arg2', player: playerStub });

        expect(commandHandlerStub.execute.calledOnce).to.be.true;
        expect(commandHandlerStub.execute.calledOnce).to.be.true;
    });

    it('should drop a command that requires chat to be allowed when the player is flooding (issue #67)', async () => {
        playerStub.isChatAllowed.returns(false);

        await commandManager.execute({ message: '/test arg1 arg2', player: playerStub });

        expect(commandHandlerStub.execute.called).to.be.false;
    });

    it('should run a command that does not require chat to be allowed while the player is flooding', async () => {
        commandStub.requiresChatAllowed.returns(false);
        playerStub.isChatAllowed.returns(false);

        await commandManager.execute({ message: '/test arg1 arg2', player: playerStub });

        expect(commandHandlerStub.execute.calledOnce).to.be.true;
        expect(playerStub.isChatAllowed.called, 'the command must not spend a flood token').to.be.false;
    });

    it('should drop /help when the player is flooding', async () => {
        playerStub.isChatAllowed.returns(false);

        await commandManager.execute({ message: '/help', player: playerStub });

        expect(playerStub.chat.called).to.be.false;
    });

    it('should drop an invalid command when the player is flooding', async () => {
        playerStub.isChatAllowed.returns(false);

        await commandManager.execute({ message: '/invalid', player: playerStub });

        expect(playerStub.chat.called).to.be.false;
        expect(loggerStub.info.called).to.be.false;
    });

    it('should not require chat to be allowed for /skillup and /stat', () => {
        expect(SkillUpCommand.requiresChatAllowed()).to.equal(false);
        expect(StatCommand.requiresChatAllowed()).to.equal(false);
    });
});
