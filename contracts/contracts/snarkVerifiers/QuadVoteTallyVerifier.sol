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

contract QuadVoteTallyVerifier {

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
        vk.alpha1 = Pairing.G1Point(uint256(14764239906034612343732810785877386685032627241260055616415716963900572049738),uint256(20694688205970438196282082952010434916278156760319020425854056157045387672626));
        vk.beta2 = Pairing.G2Point([uint256(16412533941203728452129441696816523116564828292025262111331713615310541866603),uint256(20898121668098611987579364087942559311857663195172985857531534462752046865600)], [uint256(295792692898276633120394025292202551472156668516411479364469774467627759245),uint256(13002221388590749645849392730035728545708292856719223141763190810615553423566)]);
        vk.gamma2 = Pairing.G2Point([uint256(2302124447139642788468036708027862597878170347394327163786658260293680202097),uint256(6283701424845114518623455687925493095130857294526099343074791996843299178123)], [uint256(2838086362409608445270191502836940203904243772978063401796517488504369789526),uint256(17240244409797163915960364419303469885341147533445268855477716490682323487368)]);
        vk.delta2 = Pairing.G2Point([uint256(14645799563570499643593691562259440236100657554921509039502017862404111203431),uint256(20272524525673177092318601041210232339990793052904055632408565760622255825909)], [uint256(1036441929304564743113017565139487791253430106019157295633368428080452983973),uint256(16927500681354865803299997838694746370492840236721856666868182892976389578185)]);
        vk.IC[0] = Pairing.G1Point(uint256(19788880987114102347242154741966930130018580654647035215066756968816007941539),uint256(8856540061239065624116447606061812500220327765275701753877268343642828765207));
        vk.IC[1] = Pairing.G1Point(uint256(919893932348084507504812181335840064049574894050883834709605853610151589659),uint256(6278422195071816047409785173994599183111895882927486658998534482176442448397));
        vk.IC[2] = Pairing.G1Point(uint256(10881089081327183106845484025549538363505339363256717327229127914728791912282),uint256(11537735588332499187127412728896538403393341467840716991388050119011429194784));
        vk.IC[3] = Pairing.G1Point(uint256(273838121594264153118789976478133957150100656467244644911360390883303932687),uint256(13743007933413375642093188553691873943655968813042373428881567821911598187580));
        vk.IC[4] = Pairing.G1Point(uint256(4845501117154159537190849573801514728088558672896865636503060369107104390548),uint256(5314959678711849181139418397327058610494784956027282547276549271999522027412));
        vk.IC[5] = Pairing.G1Point(uint256(1666192423500687714571615351276960436607238237784261004163302984712641773750),uint256(21701602423528511413391805823243555095647455178828105223071649967918210359205));
        vk.IC[6] = Pairing.G1Point(uint256(5009797854082015692185123552983034031338437938465740921693806700142539507363),uint256(5581403320600644421276146562256518675963518836744841471242723132888434077453));
        vk.IC[7] = Pairing.G1Point(uint256(12301013124073148586352202354335404275673935205802732752208000819994402791059),uint256(18431295806461166213770796185234340675716136713864294659806107232311161608269));
        vk.IC[8] = Pairing.G1Point(uint256(17434260347272173533853628320444597554525309317550722630201958847915574385595),uint256(3949030557009655844574685548351539209631555806994101280661051477894337634640));
        vk.IC[9] = Pairing.G1Point(uint256(8333799157934867973636304624428606893387413542916932491992057326150941009758),uint256(9648898274346759011560374420632532565668232206345454003523203647234919322160));
        vk.IC[10] = Pairing.G1Point(uint256(7513635531410640200549691599436769773105806237064887152637510266751082065834),uint256(13027959231550283548551213791139637644988594429827672265245165373148495104154));

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
