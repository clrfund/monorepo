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

contract BatchUpdateStateTreeVerifier {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[17] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(8023132588245056084381987891043043826461059931552067709318264903932815879902),uint256(20072067851748979121302437451512078645507459299862790013260601133436067250465));
        vk.beta2 = Pairing.G2Point([uint256(8776596780152580357834840947065367090564266719231738843486831492239088702100),uint256(2098827568933174633712729957680147811785957638905260881625028047649430733771)], [uint256(1130324400703569007398482292422739226029714121302716930443655414806452244008),uint256(1554496725893928866280515501351891090468601616517791807104132296822506230517)]);
        vk.gamma2 = Pairing.G2Point([uint256(21794722627530163121147384785101259127251796988635526940447761027019620560972),uint256(11669013075857287569223852428104990419865728508084310588647896924443753946529)], [uint256(15828404727526159041305269942916979015767199749419876382138938787379138353861),uint256(16921028011300782447540886372408595679184740957930030652147189744368546964176)]);
        vk.delta2 = Pairing.G2Point([uint256(16646191542604346123327435753992512532664508997347585759523033467482490319366),uint256(6819165626942119296453703452126524750228221553152178520014430208549277713815)], [uint256(20312793436173935311163054260433832834896569638350210076984340502892459883640),uint256(9080934942556385525524491630289963306626673521237345563698519561297434531834)]);
        vk.IC[0] = Pairing.G1Point(uint256(6609326620954095817109632797503036595250289984857450481377675131055944802600),uint256(15859067641801156980777534991665682656006004134138068528483628963811028416754));
        vk.IC[1] = Pairing.G1Point(uint256(3903320927682210738161083802535431772598063750158785961648242885790966139469),uint256(4429510984459177683020064460887315850131860884766699907715305368364626401635));
        vk.IC[2] = Pairing.G1Point(uint256(3307149862238849309914312752245920173095022640711582456468131961831613690776),uint256(8145223865063717565333216223585297645345943654657586031504888952424901781284));
        vk.IC[3] = Pairing.G1Point(uint256(19296072903728731042202145346428898058857592158609590440144311325860237323153),uint256(12977234920410315015814854235224756124501494692244524183110551515312999703489));
        vk.IC[4] = Pairing.G1Point(uint256(2299549407402768923578080434233820923944747549401550307146244096230024835670),uint256(11454697293315626493838496992744496466082696246432496722179154517672750769080));
        vk.IC[5] = Pairing.G1Point(uint256(21192730793045330155651857270767390717318825191928566003294021743259676417861),uint256(7093439151393904093289832341188263198948385224748550753184465907421274356034));
        vk.IC[6] = Pairing.G1Point(uint256(7322112701877331586155695931503722791895934394402888693228431947224746813450),uint256(17608636909643581023593273284330934738444803210282260020662372751950293467017));
        vk.IC[7] = Pairing.G1Point(uint256(8565761666468354108215670411297787212097194512901300330707993080786520064887),uint256(19326513294735896092860626310371491818475871321565576202102049804578162595238));
        vk.IC[8] = Pairing.G1Point(uint256(7009716517681001749502905632106645200200352405976728673849244044650802951044),uint256(12689923035544327591908917071809007904541929903630474075278588980657428353897));
        vk.IC[9] = Pairing.G1Point(uint256(3635203484529678196898445813259680685496623497256426121016430200381357762607),uint256(13660571790696161319245879172053049256833052258646825926537270127620946385943));
        vk.IC[10] = Pairing.G1Point(uint256(4167025165720389586384528203304296796499392386159326353029913764015033483912),uint256(6888529101598262407705659066244378839074671181134986592699568442015065332304));
        vk.IC[11] = Pairing.G1Point(uint256(8428357466052237489230030108794940178402799970448759180676563906944650125168),uint256(8554341726262538325447106648220228120946216259516589560322516767079031334825));
        vk.IC[12] = Pairing.G1Point(uint256(13615988994639247876470242912645583420712560408764847159007423005893922551963),uint256(10354477135650598617547179938476622334380578461807517777945621840307824887747));
        vk.IC[13] = Pairing.G1Point(uint256(11244887424743242134790362492888034102721010830375948210137064822934977326952),uint256(17684187313026489492597429802881293612871932656553906991947013304148278603540));
        vk.IC[14] = Pairing.G1Point(uint256(13392824161217052157628920383952851932198250600058517703105246603679131515622),uint256(13943914136051075406125306264869359397235472689493773270207541760515998856232));
        vk.IC[15] = Pairing.G1Point(uint256(18178226072249078502407888038847995091511471370429326449078455540186037496452),uint256(160690850339346681295704186048821942090651855750485321276656089035394429567));
        vk.IC[16] = Pairing.G1Point(uint256(14884616765097466375757598441061965217839403493063361590848540040873391299658),uint256(5453307143362355367485616386262822946337860281980306853111269260524673153786));

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
        for (uint256 i = 0; i < 16; i++) {
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
