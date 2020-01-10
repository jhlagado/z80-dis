// Based on http://www.z80.info/decoding.htm

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
        decodeCB(0);
    else if (byte === 0xED)
        decodeED();
    else if (byte === 0xDD)
        decodeDD();
    else
        decodeOpcode(byte, 0);
}

function decodeED() {
    const opcode = nextByte();
    const x = getX(opcode)
    const y = getY(opcode)
    const z = getZ(opcode)
    const q = getQ(opcode);
    const p = getP(opcode);
    if (x === 1) {
        if (z === 0){
            if (y === 6) {
                print2('IN','(C)');
            }
            else {
                print3('IN',R(y),',(C)');
            }
        }
        else if (z === 1){
            if (y === 6) {
                print3('OUT','(C)','0');
            }
            else {
                print3('OUT','(C)',R(y));
            }
        }
        else if (z === 2){
            if (q === 0) {
                print3("SBC", HL(0),RP(p,0,0));
            }
            else {
                print3("ADC",HL(0),RP(p,0,0));
            }
        }
        else if (z === 3){
            const word = nextWord();
            const a = '(' + Addr() + ')';
            if (q === 0) {
                print3("LD",a,RP(p,0,0));
            }
            else {
                print3("LD",RP(p,0,0),a);
            }
        }
        else if (z === 4){
            print1("NEG");
        }
        else if (z === 5){
            if (y === 1) {
                print1("RETI");
            }
            else {
                print1("RETN");
            }
        }
        else if (z === 6) {
            print2("IM ",tableIM[y]);
        }
        else if (z === 7) {
            if (y < 4) {
                let a1, a2;
                if (y === 0) {
                    a1 = "I";
                    a2 = "A";
                } else if (y === 1) {
                    a1 = "R";
                    a2 = "A";
                } else if (y === 2) {
                    a1 = "A";
                    a2 = "I";
                } else {
                    a1 = "A";
                    a2 = "R";
                }
                print3("LD", a1, a2);
            } else {
                const tableEDX1Z7 = ["RRD","RLD","NOP","NOP"];
                print1(tableEDX1Z7[y - 4]);
            }
        }
    }
    else if (x === 2) {
        if (z <== 3 && y >== 4) {
            print1(tableBLI[y - 4][z]);
        }
    }
}

function decodeDD() {
    const opcode = nextByte();
    if (opcode === 0xCB) {
        decodeCB(opcode, 1);
    }
    else {
        decodeOpcode(opcode, 1)
    }
}

function decodeFD() {
    const opcode = nextByte();
    if (opcode === 0xCB) {
        decodeCB(opcode, 2);
    }
    else {
        decodeOpcode(opcode, 2)
    }
}

function decodeOpcode(opcode, mode) {
    const x = getX(opcode)
    const z = getZ(opcode)
    const y = getY(opcode);
    const q = getQ(opcode);
    const p = getP(opcode);
    if (x === 0) {
        if (z === 0){
            if (y === 0){
                print1('NOP');
            } else if (y === 1) {
                print3('EX','AF',"AF'")
            } else {
                const disp = nextByte();
                if (y === 2){
                    print2('DJNZ',dispAddr(disp));
                } else if (y === 3){
                    print2('JR',dispAddr(disp));
                } else {
                    print3('JR', condition(y - 4), dispAddr(disp))
                }
            }
        } else if (z === 1){
            const word = nextWord();
            const rp1 = RP(p,0,mode);
            if (q === 0) {
                print3('LD', rp1, wordNum(word));
            } else {
                print3('ADD', hl(mode), rp1);
            }
        } else if (z === 2){
            const a = AOorHL(p === 2, mode);
            const r = RPorAddr(p);
            if (q === 0) {
                print3('LD',r,a);
            }
            else {
                print3('LD',a,r);
            }
        } else if (z === 3){
            print2(q === 0 ? "INC " : "DEC ", RP(p,0,mode));
        } else if (z === 4 && z === 5){
            const y = getY(opcode);
            print2(z === 4 ? "INC " : "DEC ",R(y))
        } else if (z === 6){
            const y = getY(opcode);
            const byte = nextByte();
            print3('LD',R(y),byteNum(byte))
        } else if (z === 7){
            const tableX0Z7 = ["RLCA","RRCA","RLA","RRA","DAA","CPL","SCF","CCF"];
            const y = getY(opcode);
            print1(tableX0Z7[y])
        }
    }
    else if (x === 1) {
        if (z === 6 && y === 6) {
            print1("HALT");
        }
        else {
            print3('LD',R(y),R(z))
        }
    }
    else if (x === 2) {
        const y = getY(opcode);
        print2(tableALU[y], R(z));
    }
    else if (x === 3) {
        if (z === 0) {
            print2("RET", tableCC[y]);
        }
        else if (z === 1) {
            const y = getY(opcode);
            if (q === 0) {
                print2("POP",RP(p,1,mode));
            }
            else {
                const tableX3Z1 = ["RET","EXX","JP HL","LD SP, HL"];
                if (p === 0){
                    print1('RET');
                }
                else if (p === 1){
                    print1('EXX');
                }
                else if (p === 2){
                    print2('JP', HL(mode));
                }
                else if (p === 3){
                    print3('LD', SP, HL(mode));
                }
            }
        }
        else if (z === 2) {
            print3("JP",tableCC[y],Addr(word))
        }
        else if (z === 3) {
            const y = getY(opcode);
            if (y === 0) {
                print2('JP',Addr(word))
            }
            else if (y === 2) {
                const byte = nextByte();
                const a = '(' + byteNum(byte) + ')';
                print3('OUT',a,'A')
            }
            else if (y === 3) {
                const byte = nextByte();
                const a = '(' + byteNum(byte) + ')';
                print3('IN','A',a)
            }
            else if (y === 4) {
                print3('EX', '(SP)', HL(mode));
            }
            else if (y === 5) {
                print3('EX','DE', 'HL');
            }
            else if (y === 6) {
                print1('DI');
            }
            else if (y === 7) {
                print1('EI');
            }
        }
        else if (z === 4) {
            const word = nextWord();
            print3('CALL',tableCC[y],Addr(word))
        }
        else if (z === 5) {
            if (q === 0) {
                print2('PUSH', RP(p,1,mode));
            }
            else {
                if (p === 0) {
                    const word = nextWord();
                    print2("CALL", Addr(word));
                }
            }
        }
        else if (z === 6) {
            const byte = nextByte();
            print2(tableALU[y], byteNum(byte));
        }
        else if (z === 7)
            print2("RST ", decimal(y * 8));
        }
    }
}

function decodeCB(mode) {
    const opcode = nextByte();
    const x = getX(opcode)
    const y = getY(opcode)
    const z = getZ(opcode)
    const m = (mode > 0 && z !== 6);
    if (x === 0) {
        if (m) {
            print4('LD',R(z,mode),tableROT[y],parenHL(mode));
        } else {
            print2(tableROT[y], R(z,mode));
        }
    }
    else if (x === 1) {
        print3('BIT',y,R(z,mode));
    }
    else if (x === 2) {
        if (m) {
            print5('LD',R(z,mode),'RES',y,R(z,mode));
        } else {
            print3('RES',y,R(z,mode));
        }
    }
    else {
        if (m) {
            print5('LD',R(z,mode),'SET',y,R(z,mode));
        } else {
            print3('SET',y,R(z,mode));
        }
    }
}

function R(i,mode) {
    const tableR = ["B", "C", "D", "E", "H", "L", "(HL)", "A"];
    if (i === 6 && mode > 0) {
        const x = HL(mode);
        const disp = nextByte();
        return '(' + x + '+' + byteNum(disp) + ')';
    }
    return tableR[i];
}

function RPorAddr(p) {
    let arg;
    if (p === 0)
        return "(BC)";
    else if (p === 1)
        return "(DE)";
    else {
        const word = nextWord();
        return "(" + word + ")";
    }
}

function RP(i, j, mode) {
    let rp;
    if (i === 0) {
        rp = 'BC'
    } else if (i === 1) {
        rp = 'DE'
    } else if (i === 2) {
        rp = HL(mode);
    } else if (i === 3) {
        if (j === 0) {
            rp = 'SP'
        } else {
            rp = 'AF'
        }
    }
    return rp;
}

function AorHL(b, mode) {
    return b ? HL(mode) : "A";
}

function HL(mode) {
    if (mode === 0) {
        rp = 'HL'
    } else if (mode === 1) {
        rp = 'IX'
    } else {
        rp = 'IY'
    }
}