
import os
import requests
import xml.etree.ElementTree as ET
import pandas as pd
import openai
from openai import OpenAI
import json
import torch
import re
from haversine import haversine
from tqdm import tqdm
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments, EarlyStoppingCallback
import folium
from io import BytesIO

path = '/content/drive/MyDrive/# KT aivle school/# 수업 코드/#17 Mini Project 6th-2/취합/'

# 0. load key file------------------
def load_file(filepath):
    with open(filepath, 'r') as file:
        return file.readline().strip()

# 1-1 audio2text--------------------
## Whisper API로 mp3파일 > 텍스트로 변환
def audio_to_text(audio_path, filename):
    openai_api_key = load_file(audio_path + 'api_key.txt')
    # OpenAI 클라이언트 생성
    client = OpenAI(api_key=openai_api_key)
    # 음성파일 경로 지정
    audio_file = open(audio_path + filename, "rb")
    # 오디오 파일을 읽어서, 위스퍼를 사용한 변환
    transcript = client.audio.transcriptions.create(
        file=audio_file,
        model="whisper-1",
        language="ko",
        response_format="text",
    )

    print('*'*50)
    print("STT RESULT: ",transcript)
    print('*'*50)
    # 결과 반환
    return transcript

# 1-2 text2summary------------------
## GPT로 텍스트에서 요약문과 리스트 추출
def summ_list_extract(user_message):
    path = '/content/drive/MyDrive/# KT aivle school/# 수업 코드/#17 Mini Project 6th-2/취합/'
    openai_api_key = load_file(path + 'api_key.txt')
    # OpenAI 클라이언트 생성
    client = OpenAI(api_key=openai_api_key)
    #append if I say YES!
    messages = [
        {"role": "system", "content": "Act as a text summarizer, and word extractor. For any text given, your job is to summarize it into two sentecnes, and extract a word list from it."},
        {"role":"user","content": "아까 가다가 머리를 박았는데, 처음에는 괜찮다가 지금 세시간 정도 지났는데 머리가 어지럽고 속이 메스꺼워요 어떻게 해야할까요?"},
        {"role":"assistant","content": """#
가다가 머리를 박아 처음에는 괜찮았으나, 세시간 후부터 머리가 어지럽고 속이 메스꺼워진 상황
##
['머리', '박았다', '처음에', '괜찮다','세시간', '정도', '지났는데', '머리', '어지럽고', '속', '메스꺼워요', '어떻게', '해야할까요']"""},
    ]

    ##Generate response
    messages_with_user_input = messages + [{"role": "user", "content": user_message}]

    completion_response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages_with_user_input,
        max_tokens=2500
    )
    response_message = completion_response.choices[0].message.content

    ##Extract text
    summ_text = re.findall(r"#\n(.*)\n##", response_message, re.DOTALL)[0]
    print("Text: ", summ_text)
    print("#"*50)

    ##Extract list
    list_string = re.findall(r"\n##\n(\[.*\])", response_message, re.DOTALL)[0]
    list_data = eval(list_string)
    print("List: ", list_data)
    print("#"*50)

    return summ_text, list_data

# 2. model prediction------------------
# 데이터 예측 함수
def predict(text, model, tokenizer):
    # 입력 문장 토크나이징
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)

    # 입력 텐서를 모델과 동일한 장치로 이동
    device = next(model.parameters()).device  # 모델의 현재 장치
    inputs = {key: value.to(device) for key, value in inputs.items()}

    # 모델 예측
    with torch.no_grad():
        outputs = model(**inputs)

    # 로짓을 소프트맥스로 변환하여 확률 계산
    logits = outputs.logits
    probabilities = logits.softmax(dim=1)

    # 가장 높은 확률을 가진 클래스 선택
    pred = torch.argmax(probabilities, dim=-1).item()

    return pred, probabilities

# 3-1. get_distance------------------
def get_dist(start_lat, start_lng, dest_lat, dest_lng,):
    url = "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving"
    headers = {
        "X-NCP-APIGW-API-KEY-ID": 'nf30b2d7do',
        "X-NCP-APIGW-API-KEY": 'Ao1BZYROhTsZ72MeOCJgtAeoAZbqbzGFy2UXMo5h',
    }
    params = {
        "start": f"{start_lng},{start_lat}",  # 출발지 (경도, 위도)
        "goal": f"{dest_lng},{dest_lat}",    # 목적지 (경도, 위도)
        "option": "trafast"  # 실시간 빠른 길 옵션
    }

    # 요청하고, 답변 받아오기
    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        response = response.json()
    else:
        raise Exception(f"API 요청 실패: {response.status_code} - {response.text}")
    #print(response)
 #   dist = response['route']['trafast'][0]['summary']['duration']  # m(미터)
 #   dist = dist / 1000  # km로 변환
    duration = response['route']['trafast'][0]['summary']['duration']  # m(미터)
    response = response['route']['trafast'][0]

    return response, duration

# Extra1
def get_information(response):
    path  = response['path']
    path = [[lat, lng] for lng, lat in path]
    section = response['section']
    guide = response['guide']

    guide_df = pd.DataFrame(guide)
    guide_df.sort_values(by='pointIndex', inplace=True)
    guide_df.set_index('pointIndex', inplace=True)

    section_df = pd.DataFrame(section)
    section_df.sort_values(by='pointIndex', inplace=True)
    section_df.set_index('pointIndex', inplace=True)

    guide_df['congestion'] = np.NaN
    j = 0
    temp = []
    for i in guide_df.index:
        if i >= section_df.index[j] and j < len(section_df)-1:
            j += 1
        val = section_df['congestion'].iloc[j]
        temp.append(val)
    guide_df['congestion'] = temp
    Dep = response['summary']['start']['location']
    Arr = response['summary']['goal']['location']
    bbox = response['summary']['bbox']

    return path, guide_df, section_df, Dep, Arr, bbox

# Extra2
def get_basic_map(path, bbox):
    center_num = int(len(path)/2)
    center = path[center_num]
    min_lat = bbox[0][1]
    max_lat = bbox[1][1]
    min_lon = bbox[0][0]
    max_lon = bbox[1][0]
    m = folium.Map(location=center, control_scale=True, width = 400, height = 400)
    m.fit_bounds([[min_lat, min_lon], [max_lat, max_lon]])
    return m

# Extra3
def visualization_optimal_path(path, guide_df, m):
    start_point = 0
    # 경로 표시 (Polyline)
    for i in guide_df.index:
        statu = guide_df['congestion'].loc[i]
        if statu == 0 or statu == 1:
            clr = 'blue'
            statu_ = '원활'
        elif statu == 2:
            clr = 'orange'
            statu_ = '서행'
        else:
            clr = 'red'
            statu_ = '혼잡'

        input_path = path[start_point:i+1]
        inst_ = guide_df['instructions'].loc[i]
        dist_ = guide_df['distance'].loc[i]
        dura_ = guide_df['duration'].loc[i]

        tooltip_ = f'상태: {statu_} 설명: {inst_} 거리: {dist_}, 시간: {dura_}'
        folium.PolyLine(locations=input_path, color=clr, weight=5,tooltip=tooltip_,crs='EPS3857').add_to(m)
        start_point = i

# Extra4
def visualization_section(path, section_df, m, Dep, Arr):
    for i in section_df.index:
        input_path = path[i]
        section_name = section_df['name'].loc[i]
        folium.Marker(input_path, tooltip=section_name, crs='EPS3857').add_to(m)
    folium.Marker([Dep[1], Dep[0]], tooltip='출발지', icon=folium.Icon(color='red'), crs='EPS3857').add_to(m)
    folium.Marker([Arr[1], Arr[0]], tooltip='도착지', icon=folium.Icon(color='green'), crs='EPS3857').add_to(m)

def get_lat_long(filename, excel_file_path):
    df = pd.read_excel(excel_file_path)
    row = df[df['filename'] == filename]

    # Check if the filename exists in the DataFrame
    if not row.empty:
        # Extract latitude and longitude
        latitude = row['위도'].values[0]
        longitude = row['경도'].values[0]
        return latitude, longitude
    else:
        return None, None

# 3-2. recommendation------------------
def recommend_hospital(start_lat, start_lng): #a_lat a_lng는 0.2로해도됨
  path = '/content/drive/MyDrive/# KT aivle school/# 수업 코드/#17 Mini Project 6th-2/취합/'
  df_emerg = pd.read_csv(path + 'er_loc.csv')
  df_emerg.reset_index(drop=True, inplace=True)
  a_lat = 0.2
  a_lng = 0.2
  coord = []
  df_emerg.reset_index(drop=True, inplace=True)
  df_emerg['harversine'] = np.NaN
  df_emerg['optimal path'] = np.NaN

  # a_lat, a_lng을 활용한 제한 설정
  df_emerg = df_emerg[(start_lat -  a_lat < df_emerg['위도']) &
   (df_emerg['위도'] < start_lat +  a_lat) &
   (start_lng -  a_lng < df_emerg['경도']) &
    (df_emerg['경도'] < start_lng +  a_lng)]
  df_emerg.reset_index(drop=True, inplace=True)

  # Haversine 거리
  for i in range(len(df_emerg)):
    dest_lat, dest_lng = df_emerg.loc[i, ['위도', '경도']]
    df_emerg.loc[i, 'harversine'] = haversine((start_lat, start_lng), (dest_lat, dest_lng), unit='km')
  df_emerg = df_emerg.sort_values(by='harversine')
  df_emerg = df_emerg.head(10)
  df_emerg.reset_index(drop=True, inplace=True)

  m_list = []
  # 거리 계산
  for i in tqdm(range(10), ):
    dest_lat, dest_lng = df_emerg.loc[i, ['위도', '경도']]
    response_, df_emerg.loc[i, 'optimal path'] = get_dist(start_lat, start_lng, dest_lat, dest_lng)
    path_, guide_df, section_df, Dep, Arr, bbox = get_information(response_)
    m = get_basic_map(path_, bbox)
    visualization_optimal_path(path_, guide_df, m)
    visualization_section(path_, section_df, m, Dep, Arr)
    m_list.append(m)
  df_emerg = df_emerg.sort_values(by='optimal path')
  df_emerg.reset_index(drop=True, inplace=True)
  coord = [(i, j) for i, j in zip(df_emerg['위도'].iloc[:3], df_emerg['경도'].iloc[:3])]
  names = df_emerg['병원이름'].iloc[:3]
  '''for i in range(3):
    m = m_list[i]
    m.save(f'Recommand path{i}.html')'''

  return coord, names, m_list
