window.MazeStudio = window.MazeStudio || {};

window.MazeStudio.downloadSvg = function downloadSvg(svgText, filename) {
  var blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename || 'maze-worksheet.svg');
};

window.MazeStudio.downloadPng = function downloadPng(svgText, filename) {
  var image = new Image();
  var svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  var url = URL.createObjectURL(svgBlob);

  image.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1180;
    var context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    canvas.toBlob(function (blob) {
      downloadBlob(blob, filename || 'maze-worksheet.png');
    }, 'image/png');
  };

  image.onerror = function () {
    URL.revokeObjectURL(url);
    alert('Не удалось создать PNG. Попробуйте скачать SVG.');
  };

  image.src = url;
};

function downloadBlob(blob, filename) {
  if (!blob) return;
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 250);
}
