window.addEventListener('load', function () {
  var button = document.getElementById('btn-show-mode');

  button.addEventListener('click', function () {
    var modeSpan = document.getElementById('text-mode');
    modeSpan.textContent = 'Mode: ' + MODE;
  }, false);
});
