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

pragma solidity ^0.5.0;

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
            success := staticcall(sub(gas, 2000), 6, input, 0xc0, r, 0x60)
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
            success := staticcall(sub(gas, 2000), 7, input, 0x80, r, 0x60)
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
            success := staticcall(sub(gas, 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-opcode-failed");

        return out[0] != 0;
    }
}

contract QuadVoteTallyVerifierSmall {

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
        vk.alpha1 = Pairing.G1Point(uint256(11864421997626308621737197370680052311896145516646957787412054200590306558280),uint256(7120239010102393838850304497924066491138218644775568648679402317743369698899));
        vk.beta2 = Pairing.G2Point([uint256(14816238325391857269156182976198625717303533540915656313628452863897943815706),uint256(17302662719468239179298495857785789259854967451607436697118275217896372565398)], [uint256(20818077938974009503119546822583564712481612775175227412258536667787587579842),uint256(17382067811436302045440541486844070097444386258159703634338305828264930542706)]);
        vk.gamma2 = Pairing.G2Point([uint256(10359869501156693784648875332947622005773803374456476132185215559045825960396),uint256(19709034605062944902568307521809437950811088876431158330405830403128456770439)], [uint256(7251708916269765912621246930741824516399358883093945611100976535488279469374),uint256(3585631687077508206832572076293134983677215973685242814835038797236713806931)]);
        vk.delta2 = Pairing.G2Point([uint256(11844142819159093547916424478780545043316393514729078450488711265768388040809),uint256(10208226297689928545241253925085106687448294504830863690320166396594419194614)], [uint256(169225507690081341975299448171644678050344563385947384584633680616806164128),uint256(12026378321266788476840921406920550182328644317333728547214038275686391279484)]);
        vk.IC[0] = Pairing.G1Point(uint256(11160411138808886406725413055064673211241851292776678842603741433014003863189),uint256(12045051457154081721769550430620333148909539207133051655668301327650520804130));
        vk.IC[1] = Pairing.G1Point(uint256(21414809048043950204175409572285583875690248274131782375828580695569964172973),uint256(10290115518699301011193018433204320235184988912601751307692516618376298878707));
        vk.IC[2] = Pairing.G1Point(uint256(12303380013200069331334803404586359411731786360448395051374203036582109817305),uint256(19830899610583132256262826108814826063314737543374151854333330328379160977784));
        vk.IC[3] = Pairing.G1Point(uint256(14671499868827432339792937780444347877854733682342484626069309891664837002648),uint256(2209880611231788766958113269018926359544730224276988251182963243067919274742));
        vk.IC[4] = Pairing.G1Point(uint256(16990914691449723004885956785663260284389982974052215253398758703526687813985),uint256(11243965610000705390718667958695973782430124176403776029695560332023323905369));
        vk.IC[5] = Pairing.G1Point(uint256(5489221431619859282809178812619255014905034881681682315799410242961305649895),uint256(17713462541896700983807102392654565708232385829822245596233151388626084331818));
        vk.IC[6] = Pairing.G1Point(uint256(3267710295382845682951716005162791254119246161949903037372106983817214245291),uint256(8617003933682405249190330295603009646788526586195309672821066758615424492673));
        vk.IC[7] = Pairing.G1Point(uint256(17294736648373359372569914797687932235322160584327147144500017178969990428258),uint256(17678859673096187500445369924817819537880683925786114998376026911869502037221));
        vk.IC[8] = Pairing.G1Point(uint256(1123824607322750711941845123576448738342895315883016121121460604886319096461),uint256(12000312208269618723855201774577007190568363498218660236852828213171024869343));
        vk.IC[9] = Pairing.G1Point(uint256(18657369399957015450701112811096520702997716414671844523145076185788206970401),uint256(5498723815699290039298635461700394289526319358988560988886785682863166517855));
        vk.IC[10] = Pairing.G1Point(uint256(15605709166243729662592538680270637173571150650813811365783520170029334798567),uint256(4345473546780187573696151628194422341215917155792411747260297969138473728308));

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
