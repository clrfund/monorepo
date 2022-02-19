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

contract QuadVoteTallyVerifierCustom {

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
        vk.alpha1 = Pairing.G1Point(uint256(16943336223702478034729513866374796851228809856161008919800913520856468181573),uint256(2995090004627639065569871279932395584911899798711981190091501417285102191177));
        vk.beta2 = Pairing.G2Point([uint256(16224714118819881643530609308327988952043965596591357129331660443749437880225),uint256(18713080770238836914085757668180363883442449561648958290173009680301883643312)], [uint256(22349732573235212308155999603848231077445494488349558443704557051018923559),uint256(10320633006958853808156951459730803259989331403375988741484169048853496829865)]);
        vk.gamma2 = Pairing.G2Point([uint256(13754685977183525838201298718645487522999887715054765691404125733830578085397),uint256(6942074706854035824685190568710272703891322307475144729076362801105779834805)], [uint256(5140158617774088963306972183201877929593031398407933973109566549607124831751),uint256(13035987335313190818598467074385857301795834547346013393313010045759712554988)]);
        vk.delta2 = Pairing.G2Point([uint256(8060558336832861646731122586124893496721636529597338211955002623228447877246),uint256(11266091873376325088415037049219024114103234301565804309675027383590258801637)], [uint256(14778268722321702691286210615443377029665021234872720602744008230960335632554),uint256(159950337696748857596651038995043496935979997396302102605500326482927324500)]);
        vk.IC[0] = Pairing.G1Point(uint256(16066585270605647433163972725844364442561475974556889399601021622371369271144),uint256(12676191990324881131751023451007364920714885702228311161299501530006872841519));
        vk.IC[1] = Pairing.G1Point(uint256(8741724346703266580019385312120367474943720529314996811441101272835876516470),uint256(17031176066038457326863997348851727124563803542303563511325983859631762911934));
        vk.IC[2] = Pairing.G1Point(uint256(18066750137770170845946733820200480964706781331673770545419839050076884756612),uint256(9347679342275024796450198445411694201271359973979853238013376665002795681996));
        vk.IC[3] = Pairing.G1Point(uint256(12615311434592602984490157419406590901170885801626249228431749604898753676825),uint256(14923844847934190225877627597124089862553879390935260800034269416514426560258));
        vk.IC[4] = Pairing.G1Point(uint256(20169822918031976507682131782892646776809554001149512021190639599804349326690),uint256(16500262714506045360275229153359308289644927300370679736657829361303433615345));
        vk.IC[5] = Pairing.G1Point(uint256(17087302943942300743176792228086268327696285793900716344408973607382655072319),uint256(18235408216267296600740961289869198243767504308584360263468406970385003239783));
        vk.IC[6] = Pairing.G1Point(uint256(19545026119096666217656647361860838923223293971001406747125714826757828149809),uint256(6559080491999014353344865620771583944769725829299641810721028046777843584264));
        vk.IC[7] = Pairing.G1Point(uint256(19060100374012958103958897290158267767597513329256041185857758273030309802587),uint256(9555898096763236508022594162106408962958705890577795983031819651275877959038));
        vk.IC[8] = Pairing.G1Point(uint256(11259424594567992022915148822616114808210551795687973599385042152935186891352),uint256(8847372443318686693647511285032355230775674903720747383283857986227997292264));
        vk.IC[9] = Pairing.G1Point(uint256(20034938052071061170101345512267783478448487278351248710639589348238685776221),uint256(20456838147183647185441901749475039833247081714013147449136222686509036222717));
        vk.IC[10] = Pairing.G1Point(uint256(14726963331140212908790922462256415603139476517884646197732123280907881194129),uint256(19499071686152952417621806302814788689759796377680900572072370183655072718752));

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
