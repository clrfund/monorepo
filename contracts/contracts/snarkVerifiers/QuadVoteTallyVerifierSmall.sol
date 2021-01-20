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
        vk.alpha1 = Pairing.G1Point(uint256(22825003036761700397808240063945706722931664551639437894569548939935030149),uint256(15382532610766958774076970334324854685065402846386885121226878251585692091511));
        vk.beta2 = Pairing.G2Point([uint256(17249159930299965222272202124036234793737737923941805027673739662759394403533),uint256(18879914595698273034765815859825530547132634285446349906010840606397938629869)], [uint256(16410964412397292352341203920538158156260801577187224295588661052447519047531),uint256(5992611309029225358768247741607462026645365545155616140330695743505593583211)]);
        vk.gamma2 = Pairing.G2Point([uint256(8978941882490730764177805685172105694082446779958502430844979263980020642873),uint256(12852918568117103172859530012988360823634164808736129643844697723464037643433)], [uint256(7561024398143639543616522646944220433142035776712409751871706216940134253641),uint256(20991668678714650071323411881047393801280154586077970261793437391357288911149)]);
        vk.delta2 = Pairing.G2Point([uint256(17817918944857047860045993492092675005112242605018913713010133418969390999650),uint256(1555172178914232588686524382987870532944928992388469339337689900732308853571)], [uint256(11850126353478266345067570546672545477061767886655333384178548249266422146116),uint256(12961046612093746498494409121542531725860859165416401450754287788910940010727)]);
        vk.IC[0] = Pairing.G1Point(uint256(14869639003245549517785716259348342139607780302468496998708466830353460285854),uint256(18966011814129999783568749471849994162605528552526368572829432674520278080588));
        vk.IC[1] = Pairing.G1Point(uint256(11621037228623948261801021495220249950317626989933872492587282490991613253978),uint256(1361966032891062714930219229861859359787434220319659405078500987094631486314));
        vk.IC[2] = Pairing.G1Point(uint256(4214841906138132970832312146357392333868840812057300600615171318062718352734),uint256(10710688136658895949795609073931470851690231166416422020587218877150044710236));
        vk.IC[3] = Pairing.G1Point(uint256(2364489330435772497241456131537545576692879171418310208339760521882758923115),uint256(16546933013742150736084689505186746735939109971419487530198628816446349972831));
        vk.IC[4] = Pairing.G1Point(uint256(15242517138888526962390599609356115774193810966083817371451411406875322490237),uint256(21093949245360194812069320064365373447939559835511653502308370423587310699010));
        vk.IC[5] = Pairing.G1Point(uint256(5428188398696815445599781549027757370633928339100788063261913391373036900208),uint256(14809376626930001355610298118568145738508571918658384533332512956354068142921));
        vk.IC[6] = Pairing.G1Point(uint256(5740821428603189180504671309402176234456798955564790294530332827792349783048),uint256(7995866433295653571560522212371538186463095552173060065914194401380521779682));
        vk.IC[7] = Pairing.G1Point(uint256(17421593953325752640755012372009390589715864534540728643109277966612002295105),uint256(15507806902646449592604416607772307578778068343497511827015265440616005371880));
        vk.IC[8] = Pairing.G1Point(uint256(11839257398496663502823452949625256281322346325687118909684282785381728354255),uint256(8925630661075255692651633187026934236687855774767010644990353794234306750884));
        vk.IC[9] = Pairing.G1Point(uint256(9079495873760987734492663079749164027783598737242084185726425303539745883441),uint256(12839680542115711156910631943100478019295614348479799248854388931674194942175));
        vk.IC[10] = Pairing.G1Point(uint256(7065510145157280952110773505384007069992053457928882721570336106492297005539),uint256(15670397745768416511708501457383508687475870001731938212186564726929616503428));

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
