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

contract BatchUpdateStateTreeVerifierMedium {

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
        vk.alpha1 = Pairing.G1Point(uint256(8127368723535166419632247524465558331085902869555340986059718511989533877903),uint256(20751332113681994095650238414495480904944949506381825493965392781178871266400));
        vk.beta2 = Pairing.G2Point([uint256(9685355385772429669466876586032950444529073715446288295667192086154215757045),uint256(7956626864936620944123193484482287319258088339178359422012222341945141262220)], [uint256(19277014037627504374082945717900190531762317571436581847505825764213853980686),uint256(1908967219375266398782153786533621521966321545716402064661821836653497251741)]);
        vk.gamma2 = Pairing.G2Point([uint256(5702317503459074564121810512849723904030883133659602462895207227676159457073),uint256(9752411496072907857511096469537907301675968143151763666915902954766029820649)], [uint256(15311638672119697109635568189096163980728853237572158000887687187767443065721),uint256(1467949219797428504423330776372868631685191022967660814672971291349981326453)]);
        vk.delta2 = Pairing.G2Point([uint256(10042644312445726099186680195135610911154557846368466839914514090420315363196),uint256(5953242661240745376894723690499081179580713522533109505888896972170548423447)], [uint256(10432007173047800436393448146423908598229591402975125688897148668885988436869),uint256(12761943683328572443702167247603024646278392963300375768416341208640194440024)]);
        vk.IC[0] = Pairing.G1Point(uint256(11684292448093409938749262856593257593265415990315799375441434818225669117513),uint256(17354060169699583056385031768553520066269419437930441355141323183474193288344));
        vk.IC[1] = Pairing.G1Point(uint256(18978804233362855254748336240885798166167145695925971316209016129430982996836),uint256(257858084308660882579741098452103505697546993991481243530058803272769410057));
        vk.IC[2] = Pairing.G1Point(uint256(17649396753598836169644322173305297636595195297224350400248366524982692230220),uint256(2165143809338451531595352410274439369578304210861736455028198355991881901890));
        vk.IC[3] = Pairing.G1Point(uint256(12743475133933567838181095413456793317278787317007224370983379018748448880439),uint256(17387113142283371215066240407634247412819690889126818223090569191529216359300));
        vk.IC[4] = Pairing.G1Point(uint256(1973511551104436924982643118293031400664941922560734295520380902778965063251),uint256(21423512037659270408296674189055636682814308571306415638667681949212670378307));
        vk.IC[5] = Pairing.G1Point(uint256(12777475795556421867594783452639673004232530111226584159211744735927472586255),uint256(7326014169312842413471118740148351952862820599657458623242388398534338006363));
        vk.IC[6] = Pairing.G1Point(uint256(5216469969299120528732608160349918061249907501767043565375615161147976215332),uint256(989946861370125382242158047375361790746368218462907689336263579770837836807));
        vk.IC[7] = Pairing.G1Point(uint256(1682411899235644827727477309775512902504716511759651526016668337120108984926),uint256(21769687491878374021041256695129294708083537029426461275027954222572060532876));
        vk.IC[8] = Pairing.G1Point(uint256(5947652013068851029927893718347327362975416962746360721614242282675280018208),uint256(19799444121016126892140192037794264125999664316205188958742024257185442352276));
        vk.IC[9] = Pairing.G1Point(uint256(21375424700580426268242254401461692906048911765321104036248562923057326547366),uint256(9129515758103210983440731412054967409022512154388896010243757658363345066677));
        vk.IC[10] = Pairing.G1Point(uint256(5181083872326425277095701295102437078618842182808106432882453866402826205563),uint256(3909589691497505586347501966012568332505459927841506312555163682171624999043));
        vk.IC[11] = Pairing.G1Point(uint256(10937238241723729230999281548237275936689326872031049956988113144871249285169),uint256(908961722856783819279957126760115378461171320446208214965651116245467045331));
        vk.IC[12] = Pairing.G1Point(uint256(3340262943862885831954653074465395723752665498076653211793977667293737939299),uint256(10595003636105707362809228404198822880051256440874866938066599528736642232113));
        vk.IC[13] = Pairing.G1Point(uint256(17733118154261984975207903210356648996459746363268039856505287526450143633061),uint256(10229172354780818691484249140658139755710494926977826788534554464077750899291));
        vk.IC[14] = Pairing.G1Point(uint256(15606780348017354284133115125836593111691468822472478900734443507129354597871),uint256(7527502697349561903585389719636612489476423980435833597073323824095560676366));
        vk.IC[15] = Pairing.G1Point(uint256(20637507020360298247108263518839712916953032459692536666602324578797100233564),uint256(3551825909610153987714265190158118462865969018102364275668450938716744737389));
        vk.IC[16] = Pairing.G1Point(uint256(15117627238918034193896927328047801718793634367825184271113223515449162451314),uint256(5616304170205753474662337142730909509040421377018706342325018229476514760803));

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
