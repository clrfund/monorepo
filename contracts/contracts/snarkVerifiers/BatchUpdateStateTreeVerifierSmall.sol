// SPDX-License-Identifier: MIT

// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// 2019 OKIMS

pragma solidity ^0.6.12;

library Pairing {

    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    /*
     * @return The negation of p, i.e. p.plus(p.negate()) should be zero. 
     */
    function negate(G1Point memory p) internal pure returns (G1Point memory) {

        // The prime q in the base field F_q for G1
        if (p.X == 0 && p.Y == 0) {
            return G1Point(0, 0);
        } else {
            return G1Point(p.X, PRIME_Q - (p.Y % PRIME_Q));
        }
    }

    /*
     * @return The sum of two points of G1
     */
    function plus(
        G1Point memory p1,
        G1Point memory p2
    ) internal view returns (G1Point memory r) {

        uint256[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-add-failed");
    }

    /*
     * @return The product of a point on G1 and a scalar, i.e.
     *         p == p.scalar_mul(1) and p.plus(p) == p.scalar_mul(2) for all
     *         points p.
     */
    function scalar_mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {

        uint256[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }

    /* @return The result of computing the pairing check
     *         e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
     *         For example,
     *         pairing([P1(), P1().negate()], [P2(), P2()]) should return true.
     */
    function pairing(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {

        G1Point[4] memory p1 = [a1, b1, c1, d1];
        G2Point[4] memory p2 = [a2, b2, c2, d2];

        uint256 inputSize = 24;
        uint256[] memory input = new uint256[](inputSize);

        for (uint256 i = 0; i < 4; i++) {
            uint256 j = i * 6;
            input[j + 0] = p1[i].X;
            input[j + 1] = p1[i].Y;
            input[j + 2] = p2[i].X[0];
            input[j + 3] = p2[i].X[1];
            input[j + 4] = p2[i].Y[0];
            input[j + 5] = p2[i].Y[1];
        }

        uint256[1] memory out;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-opcode-failed");

        return out[0] != 0;
    }
}

contract BatchUpdateStateTreeVerifierSmall {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[21] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(10424504682237547740788959032227257505994143518149993134309222244530453247979),uint256(12516526828496862166243726877237935064874711231518697034166525079699144170332));
        vk.beta2 = Pairing.G2Point([uint256(4231144185815930275961386925009702577475226109480694790538465773188494236468),uint256(4142150588506859212091711305441364571274434886375518318190551236185780429206)], [uint256(16541229667518576736008617349728536996259046354181799711924056179675003962807),uint256(12624112621034023476243800671708545199664582194232272746481604449315579262897)]);
        vk.gamma2 = Pairing.G2Point([uint256(12369528534805903882788844707550824443922094137540963000228952800415435872055),uint256(19127283997289948172497859266513888731480203229623074237355099921704077438088)], [uint256(18819773211255073939830378459821205970221366773311298031369955730338594388497),uint256(8356844313358531622455018950071054740206444591767264578145152378548747944313)]);
        vk.delta2 = Pairing.G2Point([uint256(6032415197033141367926408113349779877979837899423614877349203868801030147506),uint256(21324776781809368878015006873835792968585002458937771677100574919300368302849)], [uint256(20421286058463460909809136718619604341084552075104815996804439166983434013895),uint256(5651546208568506022627109126661316773824582262143199959612777680288921793363)]);
        vk.IC[0] = Pairing.G1Point(uint256(1994632212010096662598788071213849992516589979518602186052689890121046466864),uint256(875367741824741271712002495012229854239669943391477492275405672601520755357));
        vk.IC[1] = Pairing.G1Point(uint256(20312526534691895780290989651578118908242181608578898505327487606243761659701),uint256(13030644363930178378299609043615126620164473582155581193513790872869973821153));
        vk.IC[2] = Pairing.G1Point(uint256(10625996118412106766506252577480649514826155263885693394832294403873895121112),uint256(21465580205464167940518435889890623426645629208683909687889622398439447901210));
        vk.IC[3] = Pairing.G1Point(uint256(18020249479719787435854074836660269170184574202543196891638538180116295708766),uint256(2208386080730707632837896414768887773927098098549489434317173999449634454844));
        vk.IC[4] = Pairing.G1Point(uint256(9876273928760451211949910447628368238311232217167015909800036192199295001130),uint256(20089981782939615817383749396406074543586992327130847838843335855249882375154));
        vk.IC[5] = Pairing.G1Point(uint256(16948447680572539124448474613234481792762760959809733668628866244889889565230),uint256(18449951717627855393699770231315556583446260480683219658358050471797563270360));
        vk.IC[6] = Pairing.G1Point(uint256(1670544336914498750536106274188162008886139662712051965783460919427993797664),uint256(1638296624727115004986869024885342383594386466537750372798554076755483089884));
        vk.IC[7] = Pairing.G1Point(uint256(4864332009749210992012706270563774409937216503591051547256097131786276278343),uint256(14978746741661206176161626241795728103718416523005462830490005787498095520640));
        vk.IC[8] = Pairing.G1Point(uint256(12583894694926382009243999962378635584179900776304772009538292476707254678210),uint256(14818919377413445439758874182540967893526097485055634303953632119229026160782));
        vk.IC[9] = Pairing.G1Point(uint256(9312934742195337993934370697392662461471673284205037781051236401874507722795),uint256(18135205835101086829969269989842059633959442371885232217594163746010504488675));
        vk.IC[10] = Pairing.G1Point(uint256(19929848353599191302081198530457133757517378527984546297026401316793636893775),uint256(7923400580198896366530884663526872824167143716954511021209110062096541126293));
        vk.IC[11] = Pairing.G1Point(uint256(3815626758747112402482387723953289560414148585776496575224025446019797100051),uint256(8160183353093983505370450323264356597895262168507690572635534260376911422575));
        vk.IC[12] = Pairing.G1Point(uint256(13235695209764122721024297575615725653801303811282151100184350055095725329476),uint256(13762659658667381183860967238034334429176756019576659040367573563759503420362));
        vk.IC[13] = Pairing.G1Point(uint256(10224923567160114324581418445349360319217581624351560684873676177211105116394),uint256(13981507168868676943966493742338472073341884646162229550554384838461347251352));
        vk.IC[14] = Pairing.G1Point(uint256(10962702323741099045095171223383671236653917848511755738542508544862575259580),uint256(6690598540720816975822065914957503947665899755754179230995404800753518501908));
        vk.IC[15] = Pairing.G1Point(uint256(8036925540396023530781309590046187710701051339812699606393885349356238619764),uint256(2456463294307747324261312718113205507274339042590221890811507459892054404158));
        vk.IC[16] = Pairing.G1Point(uint256(12467095243211176023406433518649578338844130344441684355723539518265957311801),uint256(11913158137985651344112545457849308214836585535847307293198817475736192181853));
        vk.IC[17] = Pairing.G1Point(uint256(2292343469860234533149837606055432060139722211780654029721447341088913970189),uint256(3732940203109522020912116043818935757941660692350524678110944457127393284583));
        vk.IC[18] = Pairing.G1Point(uint256(171234665984105323503022562031409513294526819653571558257000884558142078251),uint256(14775673687443174243090473590145349345707430969574561318912863008662591208868));
        vk.IC[19] = Pairing.G1Point(uint256(20864105987011801383049339122520640807128844698724580073818255488077644858347),uint256(20878444677780372306316961434245441671524519945960767121056005522157992250668));
        vk.IC[20] = Pairing.G1Point(uint256(21600147402444662535975879615094997719493978689531968898218871737811634292446),uint256(21877320531388645975303242779140223403518914750495567930082492470906431924673));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) public view returns (bool) {

        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);

        VerifyingKey memory vk = verifyingKey();

        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

        // Make sure that proof.A, B, and C are each less than the prime q
        require(proof.A.X < PRIME_Q, "verifier-aX-gte-prime-q");
        require(proof.A.Y < PRIME_Q, "verifier-aY-gte-prime-q");

        require(proof.B.X[0] < PRIME_Q, "verifier-bX0-gte-prime-q");
        require(proof.B.Y[0] < PRIME_Q, "verifier-bY0-gte-prime-q");

        require(proof.B.X[1] < PRIME_Q, "verifier-bX1-gte-prime-q");
        require(proof.B.Y[1] < PRIME_Q, "verifier-bY1-gte-prime-q");

        require(proof.C.X < PRIME_Q, "verifier-cX-gte-prime-q");
        require(proof.C.Y < PRIME_Q, "verifier-cY-gte-prime-q");

        // Make sure that every input is less than the snark scalar field
        //for (uint256 i = 0; i < input.length; i++) {
        for (uint256 i = 0; i < 20; i++) {
            require(input[i] < SNARK_SCALAR_FIELD,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }

        vk_x = Pairing.plus(vk_x, vk.IC[0]);

        return Pairing.pairing(
            Pairing.negate(proof.A),
            proof.B,
            vk.alpha1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
