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
        Pairing.G1Point[21] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(17929591374673664937609722229763664544949429546647874017985017244941264362135),uint256(13753881031392390930712932959690944836605118544384621403514908856941706027730));
        vk.beta2 = Pairing.G2Point([uint256(13333878060402123856028649178112751534974185663859863043194228752692824054787),uint256(11468413312159353807342819948658488255314270419888767842991152985928788023963)], [uint256(7206302074225645294185849941357025947360519490389078502700434946671302730804),uint256(17432079944912637199817952024156613787874981991313715386517241644317555033121)]);
        vk.gamma2 = Pairing.G2Point([uint256(7677906051184588311971379718075282772047448242517389299820294597651954826183),uint256(7799590699603573048015465897000435665016918600287846073142779222100482114894)], [uint256(6566255235758067434126637824025391769134049179764466871772783994548547703131),uint256(5075136695597621962883001570289244657724793623223579888454512913589543516349)]);
        vk.delta2 = Pairing.G2Point([uint256(10653475256750862751089771125603118816194372257121973868417821054246206231491),uint256(8872148348360078074582810748217254801828706804813136496062160780742539823318)], [uint256(14257797252168606759726264714840146494708692553226680318019231627881920847977),uint256(18305436137857726599588911275250867133397287663782012540899873379574348492157)]);
        vk.IC[0] = Pairing.G1Point(uint256(1432421697263796558714620369315052877776782320335671894679927899753311453167),uint256(12842510608713606276106932845443873829541023833470974440469180168262793860021));
        vk.IC[1] = Pairing.G1Point(uint256(9870548226176139058945014040853510811958107121278282140239986963230570676269),uint256(5239133835658787624815379508747039203445899400112473252339251777820881101404));
        vk.IC[2] = Pairing.G1Point(uint256(14963051518070915792408755122290969890339421919384402427203934792464365508570),uint256(19302596763123488952560756947221295220411355253070334231233388338347018922788));
        vk.IC[3] = Pairing.G1Point(uint256(6606987022139926508351544257338215994584313020605277766183630096975018827394),uint256(21227117794489940480268738454992107170356058722542424829297764295582533414351));
        vk.IC[4] = Pairing.G1Point(uint256(17386755292483173411429196555337582193893289867476440784733028698135067344161),uint256(8300876777298656998889190616258180856382426160291625145812317157377433601839));
        vk.IC[5] = Pairing.G1Point(uint256(2245547308647475673924050963325077945844446019171977015144579260340895645600),uint256(13872738124168636438856152408421740765401219251120446807729187496125924642826));
        vk.IC[6] = Pairing.G1Point(uint256(13975605721448577874472104825674730643641547706343058801182987567729669790751),uint256(17047212079832856135846797589217317599189317862341459538942205070582281058880));
        vk.IC[7] = Pairing.G1Point(uint256(5919281358871779378691356018099237192750842401946888650808049741988726004388),uint256(13220518238096497984192701274871935931584892498496375740699732819318497127233));
        vk.IC[8] = Pairing.G1Point(uint256(5837631880667518243621304504821838447642263924871290360195062684772299672863),uint256(21248231355985036483138263362634341055658610562108000525602703932001833034479));
        vk.IC[9] = Pairing.G1Point(uint256(8741468005514025369089353388505708562879274795829537714560071652874235077261),uint256(8940021911268642476514183441663485302418673908884972776108752462290151720431));
        vk.IC[10] = Pairing.G1Point(uint256(539235835657960438640632781863556586638700094766692173946953834410930429733),uint256(9505325107356129515374398454441234603448925341425262514982465446200003590969));
        vk.IC[11] = Pairing.G1Point(uint256(8861351168458746039020318819757927940644368951652224121304245206166171431262),uint256(6771186501281257875325248159184595534035440619961499857629368637107963353385));
        vk.IC[12] = Pairing.G1Point(uint256(14466405031244544492723931509694040761264713145206394843092942098969586977118),uint256(14897916719023220574151068146175787909707645447137680147588334244093260962053));
        vk.IC[13] = Pairing.G1Point(uint256(14251500636685340363354353247158245855102598282854510506636646119175351921064),uint256(8164749126054369952611551728181820544684160394024484268822279406764137808887));
        vk.IC[14] = Pairing.G1Point(uint256(21551058868593065749664905407978394814273846064379189437650996408602812294441),uint256(14656225487130901370609611056487172088691730633452550340640445463357344704324));
        vk.IC[15] = Pairing.G1Point(uint256(9708721035046143073019024612848366238158424792986742985695866235762599819547),uint256(15786588913780280110626683207215120416205075489815096876061883300016137753024));
        vk.IC[16] = Pairing.G1Point(uint256(10489180639838417377635701381895219165458636316549384943845126815968460848191),uint256(16321960073313389774966122003744269317681472661765868186955104075528602430955));
        vk.IC[17] = Pairing.G1Point(uint256(12545381147759454014374771634925255805991772915309422548150945978648837347186),uint256(1948888353248017992724538137432059479497937798199692673869613664210775964502));
        vk.IC[18] = Pairing.G1Point(uint256(15987339137151893524181321043807679308965687312337037464356616241662241797147),uint256(8100221986411519987340137877358506833383673167802486594059713301564176939423));
        vk.IC[19] = Pairing.G1Point(uint256(20909284149238259978979292022051561056579367853026314998214156715661162815587),uint256(18412466532397077754798736481119808830789560506169801610567932404323985215229));
        vk.IC[20] = Pairing.G1Point(uint256(5012337472710033877295210153464541828642893527552982858492398491028232863908),uint256(10807812202446734741475023012277716139408670757647928973300254473793138838531));

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
