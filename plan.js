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
