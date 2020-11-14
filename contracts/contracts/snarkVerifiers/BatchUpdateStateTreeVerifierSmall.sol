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

contract BatchUpdateStateTreeVerifierSmall {

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
        vk.alpha1 = Pairing.G1Point(uint256(16583938912798357867337365680645490945981557109369454180505842114308066785186),uint256(20757853840804934747929226034774154442541633971318863331800390606646606025466));
        vk.beta2 = Pairing.G2Point([uint256(5354211930222392331268842548771975814530806089479797964197427880271989421511),uint256(4968281061914355069725144181562861610613982917439314273280548954133453497301)], [uint256(12035947561935720523496667016709705196292996437795022838077910411303785686533),uint256(16079226534539334773336773482371912036234729143595908478453324236020236439887)]);
        vk.gamma2 = Pairing.G2Point([uint256(9712523846117928141588156514399784766496101555105705485395051052064402193567),uint256(2241817746781364062120326250585472035052519034421741157519505381194689286366)], [uint256(13697494508951944803338897872283492305185662876639179909034133651567238684462),uint256(5572595615558866953587505236329478119392163024045038943611587753490466818060)]);
        vk.delta2 = Pairing.G2Point([uint256(18115650704376235385370480997786995541070696376503210213701452914337018689762),uint256(18476593100016373277138021698247640422238760717119016246553919458641256794376)], [uint256(18328410860266063929212714519960187221271601138795113986214153459251396487646),uint256(17830636401446366248305925261955692419030811037343914073774245089570058204816)]);
        vk.IC[0] = Pairing.G1Point(uint256(3105743762471496710290515055939609897246982937684129867553835021883530495284),uint256(5775475865603324687116541339746372000460752568190948236127716345133930946008));
        vk.IC[1] = Pairing.G1Point(uint256(13381106124549339190226051643361226352208086686852619350899494989951995165229),uint256(9551279751719992209393777869618332024593659037913442110676477019093336542396));
        vk.IC[2] = Pairing.G1Point(uint256(2052298766207343563340598843916725106021284627365324976621746560935890359228),uint256(21327055154581654203655037002620357430196819084537036273716603014075899579090));
        vk.IC[3] = Pairing.G1Point(uint256(20581870196603457906578003242348568222283386262980518403326210287310944720452),uint256(5465484007726939955842681771126376927556047060229264643604764943015198628940));
        vk.IC[4] = Pairing.G1Point(uint256(21660844096247794612314577409584990203482750906723799955808833406802637219405),uint256(17027722275860534834136807215616178847987175509289393923309318487795690054468));
        vk.IC[5] = Pairing.G1Point(uint256(17482044811508911017018997237012399211432315124813196346850120032350873519482),uint256(12459575097675183077125922240392601342024896556491493807720620962990084961577));
        vk.IC[6] = Pairing.G1Point(uint256(9905760825582796064753319801866339398497520045195821096613500622882688350114),uint256(20595430202071332357466630106039871351435634628470974414623621376036056029055));
        vk.IC[7] = Pairing.G1Point(uint256(13524105871168428582929137726783488656588125146031568692916335167155760690313),uint256(1565334639198013533051013918862193448732548650345189167119900189657078423103));
        vk.IC[8] = Pairing.G1Point(uint256(7558561241624168950710673315666104822141019280035091794726363799232780508152),uint256(11341973238039887112824323124954729755093559020192930218175760765953366282883));
        vk.IC[9] = Pairing.G1Point(uint256(10031306598742050384421184106839275426352483810745545102667988996985373077889),uint256(12494340940484058840704391849557267756851196494763777065726553217481732559978));
        vk.IC[10] = Pairing.G1Point(uint256(14711792710652155791379699938990241560409187386345013634823329071801097101688),uint256(2827641495317293024690164430429026513205853716719635892283633013215896756064));
        vk.IC[11] = Pairing.G1Point(uint256(4084851069007237880287866909959012008506817356427754983021817962638652529861),uint256(18493274979941494058772436252943758297851000973683100821680504375823944654818));
        vk.IC[12] = Pairing.G1Point(uint256(21751036910040733319318588571581249034639650125210236549920305503729148822587),uint256(1874735309075676549287638147280830439151379054286839624629799027242814084346));
        vk.IC[13] = Pairing.G1Point(uint256(15513515978910948133730093407261641079842360214839766696170557217380721718663),uint256(21005443222464009510035271124522685836104033221498792689549724148154531090579));
        vk.IC[14] = Pairing.G1Point(uint256(18834627083868891908995311572811831589398363484962277081959386240589428686498),uint256(312085109456128333556831663883657160827068724442658583549371961191193904293));
        vk.IC[15] = Pairing.G1Point(uint256(166305728605763205834777245017059919070519356907557220426306469098995174837),uint256(18939000766743056309853291866131205650809906335195504505668969372688240847326));
        vk.IC[16] = Pairing.G1Point(uint256(17556452942397133693419032160015656011592286344419508203011307575515832755894),uint256(7413225909684712702682551364754669593480691013420553327166717489810031746524));
        vk.IC[17] = Pairing.G1Point(uint256(3394714965279517624354067762935201681938198121612921317346581782862791287606),uint256(12854859510680434303809258079140466092609125262021277235555399670452692459659));
        vk.IC[18] = Pairing.G1Point(uint256(13439415310854451589099742781777066530204358292337938456565531920087426659142),uint256(1720302805958671684306016859364426816691368924632518514468096409691915651572));
        vk.IC[19] = Pairing.G1Point(uint256(21729451407777426291636528006449849940822354038721105154713822700088568821083),uint256(14489374982979388910883759028028883679999120685438717311935993967420660027749));
        vk.IC[20] = Pairing.G1Point(uint256(1876399965866804740543527668364407300210858993648033819579101332412569635997),uint256(19990619256484609678830063554269256407087013744540193474689542385972486296683));

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
