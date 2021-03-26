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

contract QuadVoteTallyVerifierMedium {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[11] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(13319089463234179848573002558390225549925881544844229526026924163697823868217),uint256(16969301351798186988714599867637580075355998123297360899531464320382608917823));
        vk.beta2 = Pairing.G2Point([uint256(884135738813217152621098145714294997398020017370840732264237360992258561447),uint256(19265421094608053372816753968184963865893506095669353940268571978837240754173)], [uint256(6012149136709364348511994415938926021699699739179211173438016183904359873348),uint256(18991863387357993343955782395887020515221469647499376150856526155670788249449)]);
        vk.gamma2 = Pairing.G2Point([uint256(21706235430892367859879218182417991464200104199464192769968420709969064082182),uint256(9915925245823821340262119200814211466249968283712127067494733663581717141808)], [uint256(8014379982653295859045609354888939159136652087530005163017336188856076697895),uint256(2588603844529736152444998937030017992055831391004763507477228242434048551536)]);
        vk.delta2 = Pairing.G2Point([uint256(21672490495356192161771534456050409753676928730042015138105659729884181401296),uint256(11689585908171101387988657019546096291792404055572652014148290715892557767130)], [uint256(17715373485732263146801654162487114729339353301382818364817626786331552897670),uint256(7696588916204722756361279480504273602458100892781940413610616014966001317247)]);
        vk.IC[0] = Pairing.G1Point(uint256(17087295223641082531404079553051944993373273715611908012655503993166473305754),uint256(6182736911358003151475000767360161120209489648201280392864464064000417014535));
        vk.IC[1] = Pairing.G1Point(uint256(21858953054392112643557291820558011932152397351662137062152873307837243226369),uint256(274645877754130014813042509232530378175318856440973274077059796717639658430));
        vk.IC[2] = Pairing.G1Point(uint256(14548545129502259069026547328012710742416048860809889195881907206952252416017),uint256(3228019127016928543942878181040938702662111374432682887727142995462783476447));
        vk.IC[3] = Pairing.G1Point(uint256(14373384695365988284659515115291314982184320080618552455788003283931361168551),uint256(8036736519216864070653705682127086068109886836500549090511686027151133616841));
        vk.IC[4] = Pairing.G1Point(uint256(16675333368700753066857800168703829812516465703476953717896334935892560689090),uint256(21608453333300419224392882163943662578792079956113795409183520246170299650376));
        vk.IC[5] = Pairing.G1Point(uint256(15736222309742563960248671973021862579667636851297012518581665096370726236454),uint256(21335199829751875203976028398898650985868040373956185059024547759260250305410));
        vk.IC[6] = Pairing.G1Point(uint256(16015435326083107624534169308129329045670274526456331351092633532436693939936),uint256(7453357474723762629421327112394063535945396093961872225177306831806502964062));
        vk.IC[7] = Pairing.G1Point(uint256(20800366726240207296493046386720608820175660231494817648971335534167674634983),uint256(2240276722181725673183741162820624252693987652993756341839102628211641338510));
        vk.IC[8] = Pairing.G1Point(uint256(21685869598701747502602869356260040072202071791936602760677041477453356238587),uint256(1570490528987142417400349354081659284444484408158915693119127128346469764684));
        vk.IC[9] = Pairing.G1Point(uint256(14687796710661759670182543591397320527000297314362566109212833620898352944810),uint256(14435809464288477390543880429818949557411637937848005232403789999458897870591));
        vk.IC[10] = Pairing.G1Point(uint256(4062878755941944424289598715546694691639070862682597049472966026221368157214),uint256(16596126292359214329416908692838229109530151425321455496930453385135619684735));

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
        for (uint256 i = 0; i < 10; i++) {
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
