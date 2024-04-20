let dissipatingTimer;
let dissipatingStartTime;
let dissipatingDuration = 800;

document.getElementById('dissipatingButton').addEventListener('click', function() {
  var button = document.getElementById('dissipatingButton');
  var buttonText = button.querySelector('span');

  if (!dissipatingTimer || new Date().getTime() - dissipatingStartTime >= dissipatingDuration) {
    button.classList.add('image');
    buttonText.classList.add('hidden');
    dissipatingStartTime = new Date().getTime();
    dissipatingTimer = setTimeout(function() {
      button.classList.remove('image');
      buttonText.classList.remove('hidden');
    }, dissipatingDuration);
  } else {

  }
});
