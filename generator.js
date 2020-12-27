paper.install(window);
const HIGHLIGHT_COLORS = [
  '#B239FF',
  '#6800E7',
  '#26BEFF',
  '#FFF900',
  '#02FAE0',
  '#0BCB60',
  '#E500FC ',
  '#751DE7',
  '#46EED5',
  '#FD294F',
  '#160AFE',
  '#FFEBD8',
];
// const colors = [
//   ['black', '#240038', '#440069', '#670295', '#B239FF'],
//   ['black', '#12002F', '#2A005E', '#41008B', '#6800E7'],
//   ['black', '#002A3A', '#025D84', '#0076A9', '#05B9EC'],
//   ['black', '#001B18', '#01564D', '#1FA08E', '#02FAE0'],
// ];
const colors = HIGHLIGHT_COLORS.map(function (value) {
  return ['black', 'grey', 'white', value];
});
const squareSizeInPixels = 15;
const pixelSize = 25;
let currentColor = 0;

let font;
// svg elements
let pixels;
let title;
let desc;
let frame;
let highlight;
let indicator;

// text variables
let textContent;

let templates;
let templatesJSON;

window.onload = function () {
  addColorOptions();
  paper.setup('paperCanvas');

  //Helper Box on bottom left
  let helpButton = document.getElementById('helpbutton');
  let helpContent = document.getElementById('helpcontent');
  helpButton.onclick = function () {
    console.log('jo');
    helpContent.style.visibility =
      helpContent.style.visibility == 'visible' ? 'hidden' : 'visible';
    helpButton.innerHTML = helpButton.innerHTML == '?' ? 'Ok, thanks' : '?';
  };

  //generation process
  initPixels();
  simplexPixels();
  loadOpenType(function () {
    arrangeElements();
  });

  // view.onClick = function (event) {
  //   simplexPixels();
  // };
  view.onMouseUp = function (event) {
    dragging = false;
  };

  templates = document.getElementById('templates');

  // TODO: reenable
  loadTemplates();
};
function arrangeElements() {
  frame = new paper.Path.Rectangle(
    [0, 0],
    [
      pixelSize * (squareSizeInPixels + 10),
      pixelSize * (squareSizeInPixels + 10),
    ]
  );
  frame.strokeWidth = 6;
  frame.strokeColor = 'white';
  frame.bounds.center = paper.project.view.bounds.center;
  frame.position.y -= 30;

  pixels.bounds.topCenter = frame.bounds.topCenter;
  pixels.position.y += 2 * pixelSize;
  pixels.sendToBack();
  let length = frame.bounds.width + 1 * pixelSize;
  highlight = new paper.Path([
    new Point(0, length),
    new Point(length, length),
    new Point(length, 0),
  ]);
  highlight.bounds.bottomRight = frame.bounds.bottomRight.add(50);
  highlight.strokeWidth = 50;
  highlight.strokeColor = HIGHLIGHT_COLORS[currentColor];

  title = new paper.Layer();
  desc = new paper.Layer();
  setTitle('e.g. assembly name');
  setDesc('some additional description');
}
// TODO: adjust
//load templates from json
function loadTemplates() {
  let url = window.location.href + '/templates.json';
  console.log(url);
  fetch(url)
    .then((res) => res.json())
    .then((out) => {
      out.forEach(function (temp, idx) {
        let template = document.createElement('div');
        template.classList.add('template');
        template.addEventListener('click', function (event) {
          templatePixels(idx);
        });
        for (let y = 0; y < squareSizeInPixels; y++) {
          for (let x = 0; x < squareSizeInPixels; x++) {
            let pixel = document.createElement('div');
            pixel.style.backgroundColor = colors[currentColor][temp.data[y][x]];
            pixel.classList.add('pixel');
            template.appendChild(pixel);
          }
        }

        templates.appendChild(template);
      });

      templatesJSON = out;
    })
    .catch((err) => {
      throw err;
    });
}

//Set one of 3 colors via radio buttons
function selectColor(e) {
  const el = e.target;
  el.checked = 'checked';
  setColor(e.target.value);
}
function setColor(colNr) {
  currentColor = colNr;
  highlight.strokeColor = HIGHLIGHT_COLORS[currentColor];
  pixels.children.forEach((pixel) => {
    pixel.tweenTo(
      {
        fillColor: colors[currentColor][pixel.colStep],
        strokeColor: colors[currentColor][pixel.colStep],
      },
      { duration: _.random(200, 1000) }
    );
  });
}
function setTitle(text) {
  text = text.substr(0, 24);
  if (title) title.removeChildren();
  addText(text, 32, title);
  title.bounds.topCenter = pixels.bounds.bottomCenter;

  title.position.y += 2 * pixelSize;
  title.fillColor = 'white';
  title.strokeColor = null;
  textContent = text;
}

function setDesc(text) {
  if (desc) desc.removeChildren();
  addText(text.substr(0, 40), 24, desc);
  desc.bounds.topCenter = frame.bounds.bottomCenter;
  desc.position.y -= 4 * pixelSize;
  desc.fillColor = 'white';
  desc.strokeColor = null;
}
function addText(text, fontSize, ref) {
  let fontPath = font.getPath(text || '', 0, 0, fontSize);
  let paperPath = ref.importSVG(fontPath.toSVG());
}
//generate text
function loadOpenType(callback) {
  opentype.load('Orbitron-Black.ttf', function (err, value) {
    if (err) {
      console.log(err.toString());
      return;
    }
    font = value;
    callback();
  });
}
//create pixel paths
function initPixels() {
  indicator = new paper.Path.Rectangle([0, 0], [pixelSize, pixelSize]);
  indicator.strokeWidth = 3;
  indicator.strokeCap = 'round';
  indicator.dashArray = [5, 7.5];
  indicator.dashOffset = 2.5;

  let bgRect = new paper.Path.Rectangle(
    [0, 0],
    [pixelSize * squareSizeInPixels, pixelSize * squareSizeInPixels]
  );
  bgRect.fillColor = 'black';

  pixels = new Group();
  pixels.addChild(bgRect);

  _.range(squareSizeInPixels * squareSizeInPixels).forEach(function (
    _val,
    idx
  ) {
    let x = idx % squareSizeInPixels;
    let y = Math.floor(idx / squareSizeInPixels);
    let rect = new paper.Path.Rectangle(
      [pixelSize * x, pixelSize * y],
      [pixelSize, pixelSize]
    );
    rect.fillColor = colors[currentColor][0];
    rect.applyMatrix = false;
    rect.colStep = 0;
    rect.strokeColor = colors[currentColor][0];
    rect.strokeCap = 'round';
    rect.onClick = function (event) {
      event.stop();
      this.colStep = (this.colStep + 1) % colors[0].length;
      this.tweenTo(
        {
          fillColor: colors[currentColor][this.colStep],
          strokeColor: colors[currentColor][this.colStep],
        },
        { duration: _.random(0, 200) }
      );
    };
    rect.onMouseEnter = function (event) {
      // if (!dragging) {
      indicator.strokeColor = 'lightgrey';
      rect.dashArray = [4, 10];

      indicator.position = this.position;
      // }
    };
    rect.onMouseLeave = function (event) {
      indicator.strokeColor = undefined;
      rect.dashArray = null;
    };
    pixels.addChild(rect);
  });
}

//generate pixel grid using simplex noise
function simplexPixels() {
  let simplex = new SimplexNoise();
  let values = [];

  for (let x = 0; x < squareSizeInPixels; x++) {
    for (let y = 0; y < squareSizeInPixels; y++) {
      values.push(simplex.noise2D(x / 10, y / 10));
    }
  }

  //scale noise to complete range
  let min = _.min(values),
    max = _.max(values);

  let strechedValues = values.map((value) =>
    translateValue(value, min, max, -1, 1)
  );
  strechedValues = strechedValues.map((val) =>
    val < 0 ? 0 : Math.ceil(val / 0.25)
  );

  strechedValues.forEach(function (val, idx) {
    pixels.children[idx + 1].scale(
      (pixelSize * 1.01) / pixels.children[idx + 1].bounds.width
    );
    pixels.children[idx + 1].fillColor = colors[currentColor][val];
    pixels.children[idx + 1].strokeColor = colors[currentColor][val];

    pixels.children[idx + 1].colStep = val;
    pixels.children[idx + 1].tweenFrom(
      { scaling: 0.0001 },
      { duration: _.random(0, 200) + val * 200 }
    );
  });
}

// TODO: adjust to match variable pixel width
//color pixels based on template
function templatePixels(id) {
  let template = templatesJSON[id];
  let width = template.data[0].length;
  let height = template.data.length;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let val = template.data[y][x];
      let idx = width * y + x;
      pixels.children[idx + 1].scale(
        (pixelSize * 1.01) / pixels.children[idx + 1].bounds.width
      );
      pixels.children[idx + 1].fillColor = colors[currentColor][val];
      pixels.children[idx + 1].strokeColor = colors[currentColor][val];

      pixels.children[idx + 1].colStep = val;
      pixels.children[idx + 1].tweenFrom(
        { scaling: 0.0001 },
        { duration: _.random(0, 200) + val * 200 }
      );
    }
  }
}

function clampValue(value, min, max) {
  return Math.max(Math.min(value, max), min);
}

function translateValue(value, leftMin, leftMax, rightMin, rightMax) {
  leftSpan = leftMax - leftMin;
  rightSpan = rightMax - rightMin;

  return rightMin + ((value - leftMin) / leftSpan) * rightSpan;
}

function removeBlackPixels() {
  pixels.children
    .filter((pixel) => pixel.colStep == 0)
    .forEach((pixel) => (pixel.fillColor = null));
}

function restoreBlackPixels() {
  pixels.children
    .filter((pixel) => pixel.fillColor == null)
    .forEach((pixel) => (pixel.fillColor = 'black'));
}

//let user download canvas content as SVG
function downloadSVG() {
  removeBlackPixels();
  project.view.update();
  var svg = project.exportSVG({ asString: true, bounds: 'content' });
  var svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement('a');
  downloadLink.href = svgUrl;
  downloadLink.download = textContent + '.svg';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  restoreBlackPixels();
}

//let user download canvas content as PNG
function downloadPNG() {
  removeBlackPixels();
  project.view.update();
  var canvas = document.getElementById('paperCanvas');
  var downloadLink = document.createElement('a');
  downloadLink.href = canvas.toDataURL('image/png;base64');
  downloadLink.download = textContent + '.png';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  restoreBlackPixels();
}

function addColorOptions() {
  let container = document.getElementById('color-options');
  if (!container) return;
  HIGHLIGHT_COLORS.forEach(function (color, i) {
    let wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');
    let input = document.createElement('input');
    input.type = 'radio';
    input.id = 'col' + i;
    input.name = 'radio-group';
    input.value = i.toString();
    input.onchange = function (el) {
      selectColor(el);
    };

    input.checked = i === 0 ? 'checked' : false;
    input.autocomplete = 'off';
    let label = document.createElement('label');
    label.htmlFor = 'col' + i;
    wrapper.style.border = '2px solid ' + color;
    label.style.background = color;
    wrapper.append(input, label);
    container.append(wrapper);
  });
}
