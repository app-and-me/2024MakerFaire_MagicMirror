const video = document.getElementById('camera');
const snapshotContainer = document.getElementById('snapshot-container');
const countdown = document.getElementById('countdown');

// 웹캠 스트림 가져오기
navigator.mediaDevices
  .getUserMedia({ video: { facingMode: 'user' } }) // 거울 모드로 변경
  .then((stream) => {
    video.srcObject = stream;
    video.play();
    video.style.transform = 'scaleX(-1)'; // 거울 모드로 변경
    startCountdown();
  })
  .catch((err) => {
    console.error('웹캠 접근 실패:', err);
    alert('웹캠에 접근할 수 없습니다. 브라우저 권한을 확인하세요.');
  });

let countdownTimer;

function startCountdown() {
  let countdownValue = 3;
  countdown.textContent = countdownValue;
  countdown.style.display = 'block';

  countdownTimer = setInterval(() => {
    countdownValue--;
    countdown.textContent = countdownValue;

    if (countdownValue === 0) {
      clearInterval(countdownTimer);
      countdown.style.display = 'none';
      capturePhoto();
    }
  }, 1000);
}

async function capturePhoto() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // 거울 모드로 이미지 그리기
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 캡처된 이미지 데이터 URL 생성
  const dataURL = canvas.toDataURL('image/png');

  // 새로운 스냅샷 엘리먼트 생성
  const snapshot = document.createElement('div');
  snapshot.className = 'snapshot';

  const img = document.createElement('img');
  img.src = dataURL;
  img.style.width = `${canvas.width}px`;
  img.style.height = `${canvas.height}px`;

  snapshot.appendChild(img);
  snapshotContainer.appendChild(snapshot);

  await fetch(`http://192.168.1.171:5500/picture/saveImage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: dataURL,
    }),
  });
}
