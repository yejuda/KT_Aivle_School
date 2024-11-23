## 주제
얼굴 인식(Face Recognition)
## 데이터
유명인 얼굴 데이터 및 개인 얼굴 데이터
## 중점사항
1. 데이터에 대한 적절한 전처리 및 Keras를 이용한 학습 및 추론
2. 데이터에 대한 적절한 전처리 및 YOLO를 이용한 학습 및 추론

## 프로젝트 개요
- 사내 출입 과정에서의 오랜 대기 시간 발생
  - 사원의 출입이 많은 시간, 즉 출퇴근 또는 점심 시간에는 기존의 카드키 태그 방식으로는 낭비되는 시간이 많습니다.
  - 해당 문제를 해결하기 위해 다른 대안이 필요합니다.
  
- **새로운 해결책: 실시간 얼굴 인식 모델 이용**
  - 고속도로 하이패스와 같이 출입하는 과정에서 얼굴을 인식하여 출입 여부를 실시간으로 해결하는 아이디어가 제시되었습니다.
  - 해당 아이디어가 구현되면 출퇴근 및 점심 시간에 낭비되는 시간을 줄일 수 있습니다.
## 문제 해결 프로세스
<img src="https://github.com/user-attachments/assets/a1973d59-ef6c-4f11-98fb-4daa4a3a6ee8" width="500" height="200"/>

## 결론
세 가지 모델 중 YOLO 모델이 성능이 가장 좋았습니다.
<img src="https://github.com/user-attachments/assets/3f52c133-e79d-41f1-89d9-ea348d9abb9a" width="600" height="350"/>

## 데이터 출처
Kaggle, Roboflow Universe   
https://www.kaggle.com/datasets/jessicali9530/lfw-dataset
https://universe.roboflow.com/new-workspace-kuixc/face-recognition-dataset/dataset/1
https://universe.roboflow.com/td-vgaen/test-uiodm/dataset/2
