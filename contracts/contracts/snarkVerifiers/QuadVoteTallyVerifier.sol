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
        vk.alpha1 = Pairing.G1Point(uint256(478592870202004608407700946626510860825148547055186999737325427570268071144),uint256(9157751337584079183052823489385089906467596264238255675172315388015682209774));
        vk.beta2 = Pairing.G2Point([uint256(6301620314605447452471250663439393534638947012799820621609105749783745560238),uint256(12341502659983370456526803525767300996895322973579878805909946779444016389895)], [uint256(17916035858196687513208189237457342837320151929236378973691981190169390281199),uint256(16444228891791804865508709572623644561615935374209966906478869289655940086819)]);
        vk.gamma2 = Pairing.G2Point([uint256(5681708471910945625508468623962396133764094578948387511590294581780247636017),uint256(12118744368887744070277905720785727027721900792460533412560115235173516007908)], [uint256(19143226185719422706551432871778581754615352286078150770379633722946728087125),uint256(8771291206027627376480902628253800619076104193002741604312297889777140358543)]);
        vk.delta2 = Pairing.G2Point([uint256(9183444025997791469483933628505481094940229831191936388841069110540752769781),uint256(8121628155109074152882719504614154410527219019551879405875845762324393116130)], [uint256(8325138441882418069414030057991625671383402127217529829084370835890202514000),uint256(9700306852366593120852495830825669684287132235431702544754680617352512454780)]);
        vk.IC[0] = Pairing.G1Point(uint256(4473856644216221607948987814014926389720185629882460701333813122776100635359),uint256(6956131460421571269545707696409648145308526664212416140417363000095589815957));
        vk.IC[1] = Pairing.G1Point(uint256(19726295696846084173995518778637603505432011392669350104762042298570929316346),uint256(13684462422305003621518551338570850725671233410625819322646002682428910339429));
        vk.IC[2] = Pairing.G1Point(uint256(1793827834727029479223351236835013187707179140888477179764044490904850639387),uint256(9312618810000293440910138801600864403438208853566431650456704114136859489280));
        vk.IC[3] = Pairing.G1Point(uint256(11299035697656742275163765506077278401047329066124730515593035905313819503632),uint256(8322913632991975622972935760048898137909505419420978665497880611712700540401));
        vk.IC[4] = Pairing.G1Point(uint256(13280602119776390452472714232270236887712223629882412086729691920155671150647),uint256(9540967200702169920405239453575495565944466677486003725855919012643557907267));
        vk.IC[5] = Pairing.G1Point(uint256(12200560943472216911056438915706858784124211911450075427378114042676593812259),uint256(17363473751896243640122786159552908959774140510742843930466234747339374414344));
        vk.IC[6] = Pairing.G1Point(uint256(12464095219545033179030609307332889165874320294995310908043756072470336241120),uint256(18572326813401808505761456164543655416444739586565502040584417514349858243117));
        vk.IC[7] = Pairing.G1Point(uint256(15305793898268890519676908327637239309682558965763582917391906664096155448814),uint256(9329976234288148300706215406568623952682983727826487364179817651003418007797));
        vk.IC[8] = Pairing.G1Point(uint256(4350651078029810241597622803746393469046970908830068946962238954577441679407),uint256(20824581855206441124855000731935153775549323660729469647725245043549733300013));
        vk.IC[9] = Pairing.G1Point(uint256(16275960615024373983571481323744994250709112408244262892442567264765482858200),uint256(5739458670378731325014841645966986236597983834936517804475078311820134531416));
        vk.IC[10] = Pairing.G1Point(uint256(4795536229571555988834795837284084799723912608501169725196781157502877593631),uint256(9268532769594658382717845783893860710430840681661979231328300443942186410276));

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
