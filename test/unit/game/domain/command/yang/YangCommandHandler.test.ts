import { expect } from 'chai';
import sinon from 'sinon';
import Player from '@/core/domain/entities/game/player/Player';
import WinstonLoggerAdapter from '@/core/infra/logger/WinstonLoggerAdapter';
import YangCommandHandler from '@/game/domain/command/command/yang/YangCommandHandler';
import YangCommand from '@/game/domain/command/command/yang/YangCommand';
import World from '@/core/domain/World';
import { PointsEnum } from '@/core/enum/PointsEnum';
import { ChatMessageTypeEnum } from '@/core/enum/ChatMessageTypeEnum';

describe('YangCommandHandler', () => {
    let logger: sinon.SinonStubbedInstance<WinstonLoggerAdapter>;
    let world: sinon.SinonStubbedInstance<World>;
    let handler: YangCommandHandler;
    let player: sinon.SinonStubbedInstance<Player>;
    let command: sinon.SinonStubbedInstance<YangCommand>;

    beforeEach(() => {
        logger = sinon.createStubInstance(WinstonLoggerAdapter);
        world = sinon.createStubInstance(World);
        handler = new YangCommandHandler({ logger, world });
        player = sinon.createStubInstance(Player);
        command = sinon.createStubInstance(YangCommand);
    });

    afterEach(() => sinon.restore());

    it('should log an error and send command errors if the command is invalid', async () => {
        command.isValid.returns(false);
        command.errors.returns([{ name: 'Invalid command', errors: [], value: '' }]);
        command.getErrorMessage.returns('Invalid yang command');

        await handler.execute(player, command);

        expect(logger.error.calledOnceWith('Invalid yang command')).to.be.true;
        expect(player.sendCommandErrors.calledOnceWith([{ name: 'Invalid command', errors: [], value: '' }])).to.be
            .true;
        expect(player.addPoint.called).to.be.false;
    });

    it('should add yang to the player when no target is given', async () => {
        command.isValid.returns(true);
        command.getArgs.returns(['1500']);

        await handler.execute(player, command);

        expect(player.addPoint.calledOnceWith(PointsEnum.GOLD, 1500)).to.be.true;
        expect(world.getPlayerByName.called).to.be.false;
    });

    it('should add yang to another player when the target exists', async () => {
        const target = sinon.createStubInstance(Player);
        world.getPlayerByName.returns(target);
        command.isValid.returns(true);
        command.getArgs.returns(['2500', 'otherPlayer']);

        await handler.execute(player, command);

        expect(world.getPlayerByName.calledOnceWith('otherPlayer')).to.be.true;
        expect(target.addPoint.calledOnceWith(PointsEnum.GOLD, 2500)).to.be.true;
        expect(player.addPoint.called).to.be.false;
    });

    it('should chat an error when the target player is not found', async () => {
        world.getPlayerByName.returns(undefined);
        command.isValid.returns(true);
        command.getArgs.returns(['2500', 'missingPlayer']);

        await handler.execute(player, command);

        expect(
            player.chat.calledOnceWith({
                message: 'Target: missingPlayer not found.',
                messageType: ChatMessageTypeEnum.INFO,
            }),
        ).to.be.true;
        expect(player.addPoint.called).to.be.false;
    });
});
