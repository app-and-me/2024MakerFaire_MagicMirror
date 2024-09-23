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

async function capturePhoto() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataURL = canvas.toDataURL('image/png');

  try {
    await fetch('http://localhost:5500/picture/saveImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: dataURL }),
    });
    await generateCharacterName();
  } catch (error) {
    console.error('이미지 저장 실패:', error);
    alert('이미지 저장에 실패했습니다.');
  }
}

async function fetchImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.blob();
}

async function generateCharacterName() {
  try {
    const lastNumber = await fetch(
      'http://localhost:5500/picture/getLastImageNumber',
    ).then((res) => res.text());
    const imageUrl = `../../pages/assets/results/${lastNumber}.png`;
    const blob = await fetchImage(imageUrl);

    const formData = new FormData();
    formData.append('image', blob, `${lastNumber}.png`);

    const result = await fetch(
      'http://localhost:5500/picture/generateCharacterName',
      {
        method: 'POST',
        body: formData,
      },
    ).then((res) => res.text());

    await applySticker(result);
  } catch (error) {
    console.error('캐릭터 이름 생성 실패:', error);
    alert('캐릭터 이름 생성에 실패했습니다.');
  }
}

async function applySticker(name) {
  try {
    const lastNumber = await fetch(
      'http://localhost:5500/picture/getLastImageNumber',
    ).then((res) => res.text());
    const imageUrl = `../../pages/assets/results/${lastNumber}.png`;
    const blob = await fetchImage(imageUrl);

    const formData = new FormData();
    formData.append('image', blob, `${lastNumber}.png`);
    formData.append('stickerNames', name.replace(/\W/g, ''));
    formData.append('hairData', 'default');

    await fetch('http://localhost:5500/picture/applySticker', {
      method: 'POST',
      body: formData,
    });

    goToNextPage();
  } catch (error) {
    console.error('스티커 적용 실패:', error);
    alert('스티커 적용에 실패했습니다.');
  }
}

function goToNextPage() {
  window.location.href = 'descriptionPage.html';
}

// 웹캠 초기화 및 프로세스 시작
initializeWebcam().then(capturePhoto).catch(console.error);
