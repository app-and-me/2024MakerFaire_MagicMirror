import cv2
import dlib
import os
import sys
import json
import numpy as np

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

def crop_and_combine_faces(image, faces):
    padding = 100  # 픽셀 단위 여백
    left_x = min([face.left() for face in faces]) - (padding - 0)
    right_x = max([face.right() for face in faces]) + (padding - 0)
    y1 = min([face.top() for face in faces]) - (padding * 5)
    y2 = max([face.bottom() for face in faces]) + (padding * 8)

    # 얼굴 영역의 중앙 x 좌표 계산
    faces_center_x = (left_x + right_x) // 2
    
    # 이미지의 중앙 x 좌표 계산
    image_center_x = image.shape[1] // 2

    # 왼쪽/오른쪽 여백 계산 (사람들이 이미지 가운데 오도록)
    left_padding = max(0, image_center_x - faces_center_x)  # 왼쪽 여백이 음수가 되지 않도록 수정
    right_padding = left_padding 

    x1 = left_x - left_padding
    x2 = right_x + right_padding

    # 이미지 범위를 벗어나지 않도록 조정
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(image.shape[1], x2)
    y2 = min(image.shape[0], y2)

    combined_image = image[y1:y2, x1:x2]

    # 배경 부분 추출
    background_left = image[0:image.shape[0], 0:max(0, left_x - padding // 2)]
    background_right = image[0:image.shape[0], min(image.shape[1], right_x + padding // 2):image.shape[1]]

    # 왼쪽/오른쪽 여백이 부족하면 배경 평균 색상으로 채우기
    if left_padding > left_x:
        combined_image = cv2.copyMakeBorder(combined_image, 0, 0, left_padding - left_x, 0, cv2.BORDER_CONSTANT, value=(255, 255, 255))  # 흰색으로 변경
    if right_padding > image.shape[1] - right_x:
        combined_image = cv2.copyMakeBorder(combined_image, 0, 0, 0, right_padding - (image.shape[1] - right_x), cv2.BORDER_CONSTANT, value=(255, 255, 255))  # 흰색으로 변경

    return combined_image

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
        sticker_path = os.path.join(sticker_folder, f"{sticker_name}.png")
        if os.path.exists(sticker_path):
            sticker = cv2.imread(sticker_path, cv2.IMREAD_UNCHANGED)
            stickers.append(sticker)
        else:
            print(f"Warning: Sticker not found: {sticker_path}", file=sys.stderr)

    if not stickers:
        print("Error: No valid stickers found.", file=sys.stderr)
        sys.exit(1)

    output_folder = "pages/assets/results/"
    existing_files = [f for f in os.listdir(output_folder) if f.endswith(".png")]
    if existing_files:
        existing_numbers = [int(f.split('.')[0]) for f in existing_files if f.split('.')[0].isdigit()]
        next_number = max(existing_numbers) if existing_numbers else 1
    else:
        next_number = 1

    # 이미지 로드
    image = cv2.imread(os.path.join(output_folder, f"{next_number}.png"))

    # 얼굴 감지
    faces = face_detector(image)

    # 얼굴들을 왼쪽에서 오른쪽으로 정렬
    sorted_faces = sorted(faces, key=lambda rect: rect.left())

    # 각 얼굴에 스티커 적용
    for face, sticker_name in zip(sorted_faces, sticker_names):
        landmarks = landmark_predictor(image, face)
        sticker_path = os.path.join(sticker_folder, f"{sticker_name}.png")
        if os.path.exists(sticker_path):
            sticker = cv2.imread(sticker_path, cv2.IMREAD_UNCHANGED)
            image = apply_sticker(image, landmarks, sticker)
        else:
            print(f"Warning: Sticker not found: {sticker_path}", file=sys.stderr)
                
    combined_image = crop_and_combine_faces(image, sorted_faces)

    # 결과 저장
    output_path = os.path.join(output_folder, f"{next_number}.png")
    cv2.imwrite(output_path, combined_image)