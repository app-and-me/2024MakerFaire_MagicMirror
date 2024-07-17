const video = document.getElementById('camera');
const snapshotContainer = document.getElementById('snapshot-container');
const countdown = document.getElementById('countdown');

// 웹캠 스트림 가져오기
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
    startCountdown();
  })
  .catch((err) => {
    console.error('웹캠 접근 실패:', err);
    alert('웹캠에 접근할 수 없습니다. 브라우저 권한을 확인하세요.');
  });

function startCountdown() {
  let timeLeft = 3;
  countdown.textContent = timeLeft;
  countdown.style.display = 'block';

  const timer = setInterval(() => {
    timeLeft--;
    countdown.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      countdown.style.display = 'none';

      // 사진 캡처 및 저장
      capturePhoto();
    }
  }, 1000);
}

function capturePhoto() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 캡처된 이미지 데이터 URL 생성
  const dataURL = canvas.toDataURL('image/png');

  // 새로운 스냅샷 엘리먼트 생성
  const snapshot = document.createElement('div');
  snapshot.className = 'snapshot';

  const img = document.createElement('img');
  img.src = dataURL;

  const saveButton = document.createElement('a');
  saveButton.className = 'save-button';
  saveButton.href = dataURL;
  saveButton.download = `captured_image_${Date.now()}.png`;
  saveButton.textContent = '사진 저장';

  snapshot.appendChild(img);
  snapshot.appendChild(saveButton);
  snapshotContainer.appendChild(snapshot);

  // 자동으로 사진 저장
  saveButton.click();
}
