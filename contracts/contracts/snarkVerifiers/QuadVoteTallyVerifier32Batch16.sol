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

contract QuadVoteTallyVerifier32Batch16 {

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
        vk.alpha1 = Pairing.G1Point(uint256(3931802286032916768722587566330261370902955393767942929056531203487688137529),uint256(10293105233586296031473050653492052327805448683376110761534611791713915549265));
        vk.beta2 = Pairing.G2Point([uint256(21113959492300078886023582393043413128535975125428858805958839308822991748856),uint256(12222282698476210310273536080661281164688722800089362655366747391082242682958)], [uint256(20739573447354048976161197946493569928714465565589532971602923073536082697608),uint256(12941541312444627642958656716514029404685754754869818026526533196090365546374)]);
        vk.gamma2 = Pairing.G2Point([uint256(14670836137271604202540255380769830849745744579684969689183516705496317922507),uint256(12178657156513808651243577987886528335149661869282225179912079606061386989744)], [uint256(1125902728883689137508324551765647737011904363437526425591650949891310723812),uint256(15919834918458423371681379777897287057084498811382451098590568497815773165692)]);
        vk.delta2 = Pairing.G2Point([uint256(2231852960373618563799433391860999041123211180191070579878255252716013298732),uint256(14291274065364399133654336098495355501982202302398283580502954673818060696633)], [uint256(3168628806727684542778047539988455291220201924183716864807010176642260685841),uint256(12606002808572759608577415926932586006638023328815450374325080704700677189688)]);
        vk.IC[0] = Pairing.G1Point(uint256(12848020380718535565089853534681145843006092696634142199856299025847321502371),uint256(6468756580219346512614969481554956146762400832923090074339557565951026058536));
        vk.IC[1] = Pairing.G1Point(uint256(789092430114940371944840041796419370450123967868354406244601329700742570445),uint256(11703230415288173665088837798624967250284180660322246777462631600764972864812));
        vk.IC[2] = Pairing.G1Point(uint256(16252197430844492890521435281772316410665185290137018091020232186750112907512),uint256(20861485175504002710376158881527553699531789728793309486150649246737774028347));
        vk.IC[3] = Pairing.G1Point(uint256(16969171625806775801891191965047460974818115969312194891897374689668597542196),uint256(14389419046525510722177847778450425484834864589330386321604392542455541983572));
        vk.IC[4] = Pairing.G1Point(uint256(13928883789499754049998767198742842124977905594692254232979837689918838899511),uint256(6757216204221511030872544186493375503384465407204524181513380457112801460878));
        vk.IC[5] = Pairing.G1Point(uint256(12615105472464956174046705416720445236758313003314061110048664932376957788951),uint256(1115476865907623432334995719744390855110066393577587591466560011685797098103));
        vk.IC[6] = Pairing.G1Point(uint256(12126180897004602060892141406139130628195608764592739755066384985876875328223),uint256(837414672224275155302376389224725114262382901229023048656048324984574980028));
        vk.IC[7] = Pairing.G1Point(uint256(721442001352764820041409242091349606527760014067614573870735409795650532250),uint256(5871690341119940542207233131936464616602051666920986699510353544932455895913));
        vk.IC[8] = Pairing.G1Point(uint256(11936590707137322489603100954274435093115715779097755089203405884503252799861),uint256(5832382048375298946996376174464817616061448358844675910441699738844607159400));
        vk.IC[9] = Pairing.G1Point(uint256(1150487096467611973629613424410317323826245588905051816727229632029031650443),uint256(19621934380117246037511579161242972091034040331100068879508644849318614270487));
        vk.IC[10] = Pairing.G1Point(uint256(14447725242028063610944438927433683612461991907837633029384208510392253681728),uint256(15642702797143402072429225245488363130997179355079100914641555016655302069615));

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
