const fs = require('fs');
const vm = require('vm');

function makeElement(value = '') {
  return {
    value,
    checked: false,
    textContent: '',
    options: [],
    addEventListener() {},
  };
}

const selectors = {
  '#mazeType': makeElement('rect'),
  '#variation': makeElement('perfect'),
  '#difficulty': makeElement('medium'),
  '#theme': makeElement('space'),
  '#size': makeElement('12'),
  '#houseCount': makeElement('4'),
  '#rotation': makeElement('0'),
  '#seed': makeElement('smoke-test'),
  '#showSolution': makeElement(''),
  '#decorate': makeElement(''),
  '#sizeLabel': makeElement(''),
  '#houseCountLabel': makeElement(''),
  '#generateBtn': makeElement(''),
  '#randomBtn': makeElement(''),
  '#downloadBtn': makeElement(''),
  '#mazeTitle': makeElement(''),
  '#mazeMeta': makeElement(''),
};

selectors['#showSolution'].checked = true;
selectors['#decorate'].checked = true;

const optionValues = {
  '#mazeType': ['rect', 'circle', 'triangle', 'hex', 'honey', 'islands', 'picture', 'houses'],
  '#variation': ['perfect', 'braid', 'long', 'rooms'],
  '#difficulty': ['easy', 'medium', 'hard', 'expert'],
  '#theme': ['space', 'jungle', 'sea', 'candy', 'dino', 'fairy'],
  '#rotation': ['0', '45', '-45', '90'],
};

Object.entries(optionValues).forEach(([selector, values]) => {
  selectors[selector].options = values.map((value) => ({ value }));
});

const canvasContext = new Proxy({}, {
  get(target, prop) {
    if (prop === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (prop === 'measureText') return () => ({ width: 0 });
    return target[prop] ?? (() => {});
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
});

selectors['#mazeCanvas'] = {
  width: 1100,
  height: 1100,
  getContext: () => canvasContext,
  toDataURL: () => 'data:image/png;base64,',
};

const context = {
  document: { querySelector: (selector) => selectors[selector] },
  Math,
  console,
  Date,
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);

for (const type of optionValues['#mazeType']) {
  selectors['#mazeType'].value = type;
  selectors['#variation'].value = type === 'houses' ? 'long' : 'braid';
  selectors['#rotation'].value = type === 'triangle' ? '45' : '0';
  vm.runInContext('render()', context);
}

console.log('Smoke-rendered all maze types with solution enabled.');
