import cv2
import dlib
import os
import sys
import json

# 얼굴 감지기와 랜드마크 예측기 초기화
face_detector = dlib.get_frontal_face_detector()
landmark_predictor = dlib.shape_predictor("src/assets/models/shape_predictor_68_face_landmarks.dat")

def apply_sticker(image, landmarks, sticker):
    # 얼굴 영역 계산
    x, y = landmarks.part(0).x, landmarks.part(0).y
    x_end, y_end = landmarks.part(16).x, landmarks.part(8).y
    face_width = x_end - x
    face_height = y_end - y

    # 스티커 크기 조정
    sticker_width = int(face_width * 2)
    aspect_ratio = sticker.shape[1] / sticker.shape[0]
    sticker_height = int(sticker_width / aspect_ratio)
    resized_sticker = cv2.resize(sticker, (sticker_width, sticker_height))

    # 스티커 위치 계산
    forehead_y = int(landmarks.part(21).y - sticker_height * 0.45) 
    forehead_x = int(landmarks.part(27).x - sticker_width // 2)
    x = forehead_x
    y = forehead_y

    if y < 0:
        sticker_overflow = -y
        resized_sticker = resized_sticker[sticker_overflow:, :, :]
        y = 0

    # 스티커가 이미지 범위를 벗어나지 않도록 조정
    y = max(y, 0)
    x = max(x, 0)
    if y + resized_sticker.shape[0] > image.shape[0]:
        resized_sticker = resized_sticker[:image.shape[0]-y, :, :]
    if x + resized_sticker.shape[1] > image.shape[1]:
        resized_sticker = resized_sticker[:, :image.shape[1]-x, :]

    # 스티커 적용
    if resized_sticker.shape[2] == 4:
        alpha_s = resized_sticker[:, :, 3] / 255.0
        alpha_l = 1.0 - alpha_s

        for c in range(0, 3):
            image[y:y+resized_sticker.shape[0], x:x+resized_sticker.shape[1], c] = \
                (alpha_s * resized_sticker[:, :, c] +
                 alpha_l * image[y:y+resized_sticker.shape[0], x:x+resized_sticker.shape[1], c])
    else:
        image[y:y+resized_sticker.shape[0], x:x+resized_sticker.shape[1]] = resized_sticker

    return image


if __name__ == "__main__":
    try:
        # js에서 값 받기
        sticker_names = json.loads(sys.argv[1])["stickerNames"].replace(" ", "").split(',') 
    except (IndexError, json.JSONDecodeError) as e:
        print(f"Error: Invalid input arguments. {e}", file=sys.stderr)
        sys.exit(1) 

    sticker_folder = "src/assets/stickers/"
    stickers = []
    for sticker_name in sticker_names:
        # 스티커 위치 지정
        sticker_path = os.path.join(sticker_folder, f"{sticker_name}.png")
        if os.path.exists(sticker_path):
            # 스티커 지정
            sticker = cv2.imread(sticker_path, cv2.IMREAD_UNCHANGED)
            stickers.append(sticker)
        else:
            print(f"Warning: Sticker not found: {sticker_path}", file=sys.stderr)

    if not stickers:
        print("Error: No valid stickers found.", file=sys.stderr)
        sys.exit(1)

    # 이미지 로드
    image = cv2.imread("src/assets/image.png")

    # 얼굴 감지
    faces = face_detector(image)

    # 얼굴들을 왼쪽에서 오른쪽으로 정렬
    sorted_faces = sorted(faces, key=lambda rect: rect.left())

    # 각 얼굴에 스티커 적용
    for face, sticker_name in zip(sorted_faces, sticker_names):
        # 얼굴 랜드마크 찾기
        landmarks = landmark_predictor(image, face)

        # 스티커 적용
        sticker_path = os.path.join(sticker_folder, f"{sticker_name}.png")
        if os.path.exists(sticker_path):
            sticker = cv2.imread(sticker_path, cv2.IMREAD_UNCHANGED)
            image = apply_sticker(image, landmarks, sticker)
        else:
            print(f"Warning: Sticker not found: {sticker_path}", file=sys.stderr)
                
    # 결과 저장
    output_folder = "pages/assets/results/"
    existing_files = [f for f in os.listdir(output_folder) if f.endswith(".png")]
    if existing_files:
        existing_numbers = [int(f.split('.')[0]) for f in existing_files if f.split('.')[0].isdigit()]
        next_number = max(existing_numbers) if existing_numbers else 1
    else:
        next_number = 1

    print(next_number)
    # 결과 저장
    output_path = os.path.join(output_folder, f"{next_number}.png")
    cv2.imwrite(output_path, image)