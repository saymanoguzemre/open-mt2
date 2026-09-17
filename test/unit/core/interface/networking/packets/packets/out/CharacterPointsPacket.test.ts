import { expect } from 'chai';
import CharacterPointsPacket from '@/core/interface/networking/packets/packet/out/CharacterPointsPacket';
import PacketHeaderEnum from '@/core/enum/PacketHeaderEnum';
import { PointsEnum } from '@/core/enum/PointsEnum';

describe('CharacterPointsPacket', () => {
    it('initializes with the CHARACTER_POINTS header', () => {
        const packet = new CharacterPointsPacket();
        expect(packet.getHeader()).to.equal(PacketHeaderEnum.CHARACTER_POINTS);
        expect(packet.getName()).to.equal('CharacterPointsPacket');
    });

    it('packs 255 uint32 points without throwing when needed exp exceeds 2^32', () => {
        const packet = new CharacterPointsPacket();
        packet.addPoint(PointsEnum.NEEDED_EXPERIENCE, 15015455823);

        const buffer = packet.pack();

        expect(buffer).to.have.lengthOf(1021);
        expect(buffer.readUInt32LE(1 + PointsEnum.NEEDED_EXPERIENCE * 4)).to.equal(15015455823 >>> 0);
    });
});
