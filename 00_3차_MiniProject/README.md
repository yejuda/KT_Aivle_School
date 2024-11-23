## 주제 
스마트폰 센서 기반 데이터를 활용한 행동 인식

## 중점사항
1. 561개 feature에 대한 데이터 탐색
2. 6개 class 관계를 고려한 모델링

## 과제 수행 흐름
- **데이터 탐색**
  1. 트리 모델을 생성한 후 변수 중요도를 구합니다. (Random Forest 알고리즘 사용 권장)
  2. 중요한 feature 상위 N개를 선정하고, 이들을 대상으로 EDA 수행
- **Target을 정적/동적 행동으로 구분**
  1. 6개의 행동은 2개의 그룹(정적행동, 동적행동)으로 나뉩니다.
  2. 정적/동적 행동으로 구분되는 Target 변수를 생성하고,
  3. 어떤 feature(혹은 feature 그룹)이 2개 class 그룹(정적, 동적)을 구분하는데 중요한 지 EDA를 통해 찾아봅니다.
     
## 데이터 수집 방식
<img src="https://github.com/user-attachments/assets/9e85ab77-6ad0-4006-a62a-46acdd8e591d" width="600" height="300"/>

## 데이터 출처
UCI Machine Learning Repository   
https://archive.ics.uci.edu/ml/datasets/human+activity+recognition+using+smartphones
