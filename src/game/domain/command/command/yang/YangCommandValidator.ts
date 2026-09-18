import MathUtil from '@/core/domain/util/MathUtil';
import CommandValidator from '../../CommandValidator';

export default class YangCommandValidator extends CommandValidator {
    build() {
        this.createRule(this.command.getArgs(), 'args').isRequired().isArray().build();
        this.createRule(this.command.getArgs()[0], 'value')
            .isNumber()
            .isBetween(0, MathUtil.MAX_UINT + 1)
            .build();
        this.createRule(this.command.getArgs()[1], 'targetName').isOptional().isString().build();
    }
}
