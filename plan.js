// Based on http://www.z80.info/decoding.htm

const tableR = ["B", "C", "D", "E", "H", "L", "(HL)", "A"];
const tableRP = ["BC", "DE", "HL", "SP"];
const tableRP2 = ["BC", "DE", "HL", "AF"];
const tableCC = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"];
const tableALU = [
  "ADD A,",
  "ADC A,",
  "SUB",
  "SBC A,",
  "AND",
  "XOR",
  "OR",
  "CP"
];

const tableROT = ["RLC", "RRC", "RL", "RR", "SLA", "SRA", "SLL", "SRL"];
const tableIM = ["0", "0/1", "1", "2", "0", "0/1", "1", "2"];
const tableBLI = [
    ['LDI','CPI','INI','OUTI'],
    ['LDD','CPD','IND','OUTD'],
    ['LDIR','CPIR','INIR','OTIR'],
    ['LDDR','CPDR','INDR','OTDR'],
]

const code = [
    '0x21','0x4D','0x34','0x22','0x4B','0x34','0x22','0x49',
    '0x34','0x21','0x1A','0x33','0x22','0x7A','0x35','0xC3','0xD1',
    '0x17','0x33','0x3A','0x20','0x64','0x75','0x6D','0x70',
    '0x20','0x31','0x36','0x20','0x62','0x61','0x73','0x65','0x09',
    '0x20','0x21','0x20','0x6F','0x76','0x65','0x72','0x20',
    '0x2B','0x20','0x73','0x77','0x61','0x70','0x20','0x62','0xD0',
    '0x65','0x67','0x69','0x6E','0x20','0x6F','0x76','0x65',
    '0x72','0x20','0x6F','0x76','0x65','0x72','0x20','0x73','0x97',
    '0x77','0x61','0x70','0x20','0x3C','0x20','0x77','0x68',
    '0x69','0x6C','0x65','0x20','0x64','0x75','0x70','0x20','0x0F',
    '0x37','0x20','0x61','0x6E','0x64','0x20','0x30','0x3D',
    '0x20','0x69','0x66','0x20','0x63','0x72','0x20','0x64','0xE6',
    '0x75','0x70','0x20','0x2E','0x20','0x74','0x68','0x65',
    '0x6E','0x20','0x64','0x75','0x70','0x20','0x63','0x40','0x27',
    '0x20','0x2E','0x20','0x31','0x2B','0x20','0x72','0x65',
    '0x70','0x65','0x61','0x74','0x20','0x63','0x72','0x20','0xC5',
    '0x31','0x30','0x20','0x62','0x61','0x73','0x65','0x20',
    '0x21','0x20','0x3B','0x0D','0x0A','0xFF','0x0D','0x0A','0x50',
    '0x98','0x33','0xE8'
];

const getX = opcode => opcode >> 6;
const getY = opcode => opcode >> 3 & 7;
const getZ = opcode => opcode & 7;
const getQ = opcode => opcode >> 3 & 1;
const getP = opcode => opcode >> 4 & 2;

const byteIter = code[Symbol.iterator]();
const IP = 0;

function nextByte() {
    let {value, done} = iterator.next();
    if (done) {
        return null;
    }
    else {
        IP++;
        return value;
    }
}

function nextWord() {
    const bl = nextByte();
    const bh = nextByte();
    return (bl == null || bh == null) ? null : bh << 8 | bl;
}

function decode(iterator) {
    const byte = nextByte();
    if (byte === 0xCB)
        decodeCB();
    else if (byte === 0xED)
        decodeED();
    else if (byte === 0xDD)
        decodeDD();
    else
        decodeOpcode(byte);
}

function decodeCB() {
    const opcode = nextByte();
    const x = getX(opcode)
    const y = getY(opcode)
    const z = getZ(opcode)
    if (x === 0) {
        print(tableROT[y])
        printSpace();
        print(tableR[z]);
    }
    else {
        const tableCB = ['BIT', 'RES', 'SET'];
        print(tableCB[x - 1]);
        print(y);
        printComma();
        print(tableR[z]);
    }
}

function decodeED() {
    const opcode = nextByte();
    const x = getX(opcode)
    const y = getY(opcode)
    const z = getZ(opcode)
    if (x === 1) {
        if (z === 0){
            if (y === 6) {
                print('IN (C)');
            }
            else {
                print('IN ');
                print(tableR[y],',(C)');
            }
        }
        else if (z === 1){
            if (y === 6) {
                print('OUT (C),0');
            }
            else {
                print('OUT (C),');
                print(tableR[y]);
            }
        }
        else if (z === 2){
            const q = getQ(opcode);
            const p = getP(opcode);
            if (q === 0) {
                print("SBC HL, ");
            }
            else {
                print("ADC HL, ");
            }
            print(tableRP[p]);
        }
        else if (z === 3){
            const q = getQ(opcode);
            const p = getP(opcode);
            const word = nextWord();
            print("LD ");
            if (q === 0) {
                print("(");
                printAddr(word);
                print(")");
                printComma();
                print(tableRP[p]);
            }
            else {
                print(tableRP[p]);
                printComma();
                print("(");
                printAddr(word);
                print(")");
            }
        }
        else if (z === 4){
            print("NEG");
        }
        else if (z === 5){
            if (y === 1) {
                print("RETI");
            }
            else {
                print("RETN");
            }
        }
        else if (z === 6) {
            print("IM ");
            print(tableIM[y]);
        }
        else if (z === 7) {
            const tableEDX1Z7 = ["LD I, A","LD R, A","LD A, I","LD A, R","RRD","RLD","NOP","NOP"];
            print(tableEDX1Z7[y]);
        }
    }
    else if (x === 2) {
        if (z <== 3 && y >== 4) {
            print(tableBLI[y - 4][z]);
        }
    }
}

function decodeDD() {
    const byte = nextByte();
}

function decodeOpcode(opcode) {
    const x = getX(opcode)
    const z = getZ(opcode)
    if (x === 0) {
        if (z === 0){
            const tableX0Z0 = ["NOP", "EX AF, AF'",	"DJNZ ", "JR ", "JR ", "JR ", "JR ", "JR "];
            const y = getY(opcode)
            const s = tableX0Z0[y];
            print(s);
            if (y >= 2) {
                const disp = nextByte();
                if (y < 4) {
                    printDispAddr(disp);
                }
                else {
                    const y4 = y - 4;
                    const cc = tableCC[y -4];
                    printCondition(cc);
                    printDispAddr(disp)
                }
            }
        } else if (z === 1){
            const tableX0Z1 = ["LD", "ADD HL"];
            const q = getQ(opcode);
            const p = getP(opcode);
            print(tableX0Z1[q]);
            print(rp[p]);
            if (q === 0) {
                printComma();
                const byte = nextByte();
                printByte(byte);
            }
        } else if (z === 2){
            const q = getQ(opcode);
            const p = getP(opcode);
            print("LD ");
            if (q === 0) {
                printRegPairOrAddr(p)
                printComma();
                printAOrHL(p === 2)
            }
            else {
                printAOrHL(p === 2)
                printComma();
                printRegPairOrAddr(p)
            }
        } else if (z === 3){
            const q = getQ(opcode);
            const p = getP(opcode);
            print(q === 0 ? "INC " : "DEC ");
            print(tableRP[p]);
        } else if (z === 4 && z === 5){
            const y = getY(opcode);
            print(z === 4 ? "INC " : "DEC ");
            print(tableR[y])
        } else if (z === 6){
            const y = getY(opcode);
            print("LD ");
            print(tableR[y])
            printComma();
            const byte = nextByte();
            printByte(byte);
        } else if (z === 7){
            const tableX0Z7 = ["RLCA","RRCA","RLA","RRA","DAA","CPL","SCF","CCF"];
            const y = getY(opcode);
            print(tableX0Z7[y])
        }
    }
    else if (x === 1) {
        const y = getY(opcode);
        if (z === 6 && y === 6) {
            print("HALT");
        }
        else {
            print("LD ");
            print(tableR[y]);
            printComma();
            print(tableR[z]);
        }
    }
    else if (x === 2) {
        const y = getY(opcode);
        print(tableALU[y]);
        printSpace();
        print(tableR[z]);
    }
    else if (x === 3) {
        if (z === 0) {
            const y = getY(opcode);
            print("RET ");
            print(tableCC[y]);
        }
        else if (z === 1) {
            const y = getY(opcode);
            const q = getQ(opcode);
            const p = getP(opcode);
            if (q === 0) {
                print("RET ");
                print(tableCC[y]);
            }
            else {
                const tableX3Z1 = ["RET","EXX","JP HL","LD SP, HL"];
                print(tableX3Z1[p]);
            }
        }
        else if (z === 2) {
            print("JP ");
            print(tableCC[y]);
            printComma();
            const word = nextWord();
            printAddr(word);
        }
        else if (z === 3) {
            const y = getY(opcode);
            if (y === 0) {
                print("JP ");
                const word = nextWord();
                printAddr(word);
            }
            else if (y === 2) {
                print("OUT (");
                const byte = nextByte();
                printByte(byte);
                print("),A");
            }
            else if (y === 3) {
                print("IN A,(");
                const byte = nextByte();
                printByte(byte);
                print(")");
            }
            else {
                const tableX3Z3 = ["EX (SP), HL","EX DE, HL","DI","EI"];
                print(tableX3Z3[y - 4])
            }
        }
        else if (z === 4) {
            const y = getY(opcode);
            print("CALL ");
            print(tableCC[y]);
            printComma();
            const word = nextWord();
            printAddr(word);
        }
        else if (z === 5) {
            const q = getQ(opcode);
            const p = getP(opcode);
            if (q === 0) {
                print("PUSH ");
                print(tableRP2[p]);
            }
            else {
                if (p === 0) {
                    print("CALL ");
                    const q = getQ(opcode);
                    const p = getP(opcode);
                }
            }
        }
        else if (z === 6) {
            const y = getY(opcode);
            print(tableALU[y])
            printSpace();
            const byte = nextByte();
            printByte(byte);
        }
        else if (z === 7)
            const y = getY(opcode);
            print("RST ");
            print(y * 8);
        }
    }
}

function printRegPairOrAddr(p) {
    print("(");
    if (p === 0)
        print("BC");
    else if (p === 1)
        print("DE");
    else {
        const word = nextWord();
        printAddress(word);
    }
    print(")");
}

function printAOrHL(b) {
    print(b ? "HL" : "A");
}
