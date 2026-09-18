import Command from '../../Command';
import YangCommandValidator from './YangCommandValidator';

export default class YangCommand extends Command {
    constructor({ args }: { args: Array<string> }) {
        super({ args, validator: YangCommandValidator });
    }

    static getName() {
        return '/yang';
    }
    static getDescription() {
        return 'add yang to other player or to yourself';
    }
    static getExample() {
        return '/yang <number> <targetName>';
    }
}
