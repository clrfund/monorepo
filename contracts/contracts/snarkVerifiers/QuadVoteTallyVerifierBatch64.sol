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

contract QuadVoteTallyVerifierBatch64 {

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
        vk.alpha1 = Pairing.G1Point(uint256(8998677785356475976681729551581748241325038364445707399605311153715193285192),uint256(16532093260476468234284235622994996263894019866786993774689525941531486715280));
        vk.beta2 = Pairing.G2Point([uint256(14479696864247948470811129902981074107577880260267988466643697895429700862357),uint256(7673508468962275876822578116767566306007923040617408204893910425294482718359)], [uint256(3025794662125932744461510313664354244361345886188220954268088904152332320651),uint256(18992001603150737150609170655111529043323918325565233843250080825070227900741)]);
        vk.gamma2 = Pairing.G2Point([uint256(4774442582759577548845273460482286945247270845418250880380173808037730007146),uint256(19632998816417277057191816929078931508219443286363999553420436712667847802509)], [uint256(8918484860111856084885536772945733139126131932286560515976472672010960012834),uint256(12728669449444166995903623839504592322409504301832398134300330772308607917073)]);
        vk.delta2 = Pairing.G2Point([uint256(15785059851343798028684598751378759057245187772163751398827510094565061725238),uint256(21118128021055465323522140883656695832878555508305373434189121269701766235730)], [uint256(13568894355304319876421253464785911878212017214379681164608971423414503706203),uint256(13159583370455092481079763163823460297963250255523361267085961821806615709492)]);
        vk.IC[0] = Pairing.G1Point(uint256(17565231262536262059880953057168652920760564268967484995833449932868505425453),uint256(12188686363387894404482877921579809555738089118150529762262500832547425324413));
        vk.IC[1] = Pairing.G1Point(uint256(11189327955398716455357578100208632792320136054341850974581633926389276968439),uint256(13346042944044822030526526592409317594222810159017045773876902868540767926789));
        vk.IC[2] = Pairing.G1Point(uint256(4841917664084834927763896883310585967014384374505892074230796208068284173617),uint256(18170939148620637269090232661132873974208089448822352559672713479981933524597));
        vk.IC[3] = Pairing.G1Point(uint256(18819966500293660402531086354419973912066562695742018658017872617474355110586),uint256(21777120900100859259925548526006244513934409052108418268054046593333988632979));
        vk.IC[4] = Pairing.G1Point(uint256(16090571137665417344860949919114298372447642825525030792688149453160603275973),uint256(11028345007100474884743109999990340096930987561377988366283061948118635256399));
        vk.IC[5] = Pairing.G1Point(uint256(8565376255290633678674898949265672764671797704000889552605773658404947597356),uint256(8134113217715388235372429381559636053722293848617705894690514518674228042182));
        vk.IC[6] = Pairing.G1Point(uint256(14563576887421649746847610551642066185997940451407657996153162281658269151338),uint256(3006545207325771542831873992663481302506804502922484994752738879448954888593));
        vk.IC[7] = Pairing.G1Point(uint256(2945281449524289396587806467221452974974132513125923527213072377993572783955),uint256(16114859942947305831498266256190478085152888824338102881853989411303260441326));
        vk.IC[8] = Pairing.G1Point(uint256(17535290294201239551318275539559369129483399986530054025564198618381997235450),uint256(4670423088334897050397605971773705631924741154427292154782933204365329751809));
        vk.IC[9] = Pairing.G1Point(uint256(17614334556994749443749549798035358239179553133825558482478045411777802484523),uint256(7094754689901925867819232494399619412173023860803836457804265404702369434376));
        vk.IC[10] = Pairing.G1Point(uint256(7390265632726797438431040125237407305009017950382543022039201491896546184823),uint256(17970645195573822913849013220214770354709981129727702271146338010115720135385));

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
