const video = document.getElementById('camera');
const countdown = document.getElementById('countdown');

async function initializeWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    video.srcObject = stream;
    await video.play();
    video.style.transform = 'scaleX(-1)';
    await startCountdown();
  } catch (err) {
    console.error('웹캠 접근 실패:', err);
    alert('웹캠에 접근할 수 없습니다. 브라우저 권한을 확인하세요.');
  }
}

function startCountdown() {
  return new Promise((resolve) => {
    let countdownValue = 3;
    countdown.textContent = countdownValue;
    countdown.style.display = 'block';

    const countdownTimer = setInterval(() => {
      countdownValue--;
      countdown.textContent = countdownValue;

      if (countdownValue === 0) {
        clearInterval(countdownTimer);
        countdown.style.display = 'none';
        resolve();
      }
    }, 1000);
  });
}

function capturePhoto() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataURL = canvas.toDataURL('image/png');

  localStorage.setItem('capturedImage', dataURL);

  window.location.href = 'loadingPage.html';
}

initializeWebcam()
  .then(() => {
    capturePhoto();
  })
  .catch(console.error);
