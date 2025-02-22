import openai
import pyodbc
import torch
import pandas as pd
import numpy as np
import json
import os
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from haversine import haversine
import requests
import xml.etree.ElementTree as ET

path = os.path.dirname(os.path.abspath(__file__))

# 데이터베이스 연결 설정
def connect_to_db(server, database, username, password):
    connection_string = (
        f"DRIVER={'{ODBC Driver 17 for SQL Server}'};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
    )
    return pyodbc.connect(connection_string)

# load OPENAI API 
def load_file(filepath):
    with open(filepath, 'r') as file:
        return file.readline().strip()

# Summary Request
def text_summary(input_text):
    api_key = load_file("api_key.txt")
    openai.api_key = api_key

    system_role = '''당신은 응급상황에 대한 텍스트에서 핵심 내용을 훌륭하게 요약해주는 어시스턴트입니다.
    응답은 다음의 형식을 지켜주세요.

    {"summary": \"텍스트 요약\",
    "keyword" : "핵심 키워드(3가지)",
    "department": "추천 진료과"
    }

    - 추천 진료과(department)에 대해 다음 규칙을 따르세요:
    1. '내과' 또는 '외과'에 해당하는 세부 진료과는 각각 '내과' 또는 '외과'로만 출력하세요.
        - 예: '심장내과', '소화기내과'는 '내과'로 출력.
        - 예: '흉부외과', '일반외과'는 '외과'로 출력.
    2. '내과'와 '외과'를 제외한 다른 진료과는 '신경외과'로만만 출력하세요.
        
    이를 준수하여 응답을 생성하세요.
'''
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": system_role
            },
            {
                "role": "user",
                "content": input_text
            }
        ]
    )

    # 응답 처리
    answer = response['choices'][0]['message']['content']
    parsed_answer = json.loads(answer)
    summary = parsed_answer.get("summary", "요약 없음")
    keywords = parsed_answer.get("keyword", "").split(", ")
    department = parsed_answer.get("department", "추천 진료과 없음")
    return summary, keywords, department

def get_dist(start_lat, start_lng, dest_lat, dest_lng):
    map_key = load_file(os.path.join(path, 'map_key.txt'))
    map_key = json.loads(map_key)
    url = "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving"
    
    headers = {
        "X-NCP-APIGW-API-KEY-ID": "frtqiwq092",
        "X-NCP-APIGW-API-KEY": "eKzaZmdIT4lsaa53DqneOw8jEkX0Oy1jsFz9ZAkh",
    }
    params = {
        "start": f"{start_lng},{start_lat}",  # 출발지 (경도, 위도)
        "goal": f"{dest_lng},{dest_lat}",    # 목적지 (경도, 위도)
        "option": "trafast"  # 실시간 빠른 길 옵션
    }

    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    # 'route'와 'trafast' 키가 존재하는지 확인하고 예외 처리
    try:
        dist = data['route']['trafast'][0]['summary']['distance']  # m(미터)
        dist = dist / 1000  # km로 변환
        dura = data['route']['trafast'][0]['summary']['duration']
    except KeyError as e:
        print(f"응답 데이터에서 예상되는 키를 찾을 수 없음: {e}")
        return pd.Series([None, None])

    return pd.Series([float(dist), float(dura)])

def predict_severity(text, model, tokenizer):
    if not isinstance(text, str):
        text = str(text)

    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    device = next(model.parameters()).device
    inputs = {key: value.to(device) for key, value in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
    predicted_class = torch.argmax(probabilities, dim=-1).item() + 1

    return predicted_class, probabilities.tolist()

def recommend_hospital(emergency, start_lat, start_lng, num):
    
    hospital_data=emergency.loc[emergency['latitude'].between(start_lat-0.05, start_lat+0.05) & emergency['longuitude'].between(start_lng-0.05, start_lng+0.05)].copy()
    hospital_data[["distance", "duration"]] = hospital_data.apply(lambda x: get_dist(start_lat, start_lng, x["latitude"], x["longuitude"]), axis=1)

    top_hospitals = hospital_data.nsmallest(num, "distance").to_dict("records")
    return top_hospitals

def extract_region(address):
    parts = address.split()
    return parts[0], parts[1]

def get_bed_availability(api_key, stage1, stage2, hospital_name):
    url = 'http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire'
    params = {
        'serviceKey': api_key,
        'STAGE1': stage1,
        'STAGE2': stage2,
        'pageNo': '1',
        'numOfRows': '1000'
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        root = ET.fromstring(response.content)
        for item in root.findall(".//item"):
            if item.findtext("dutyName") == hospital_name:
                return {
                    "병원명": item.findtext("dutyName"),
                    "입력일시": item.findtext("hvidate"),
                    "응급실": item.findtext("hvec"),
                    "내과": item.findtext("hv2"),
                    "외과": item.findtext("hv3"),
                    "신경외과": item.findtext("hv6")
                }
        return None  # 해당 병원의 병상 정보가 없을 경우
    else:
        print(f"Error in API call: {response.status_code}")
        return None

def get_hospital_bed_info(api_key, hospitals):
    for hospital in hospitals:
        stage1, stage2 = extract_region(hospital["addr"])
        bed_info = get_bed_availability(api_key, stage1, stage2, hospital["hospital"])
        if bed_info:
            hospital["beds"] = [bed_info]  # 병상 정보를 리스트로 추가
        else:
            hospital["beds"] = []  # 병상 정보가 없으면 빈 리스트 추가
    return hospitals

def merge_beds_by_hospital(hospitals_with_beds):
    merged_hospitals = {}

    for hospital in hospitals_with_beds:
        hospital_name = hospital["hospitalName"]

        if hospital_name not in merged_hospitals:
            merged_hospitals[hospital_name] = {
                "hospitalName": hospital_name,
                "addr": hospital["addr"],
                "emergencyMedicalInstitutionType": hospital.get("emerType", "정보 없음"),
                "phoneNumber1": hospital.get("tel1", "정보 없음"),
                "phoneNumber3": hospital.get("tel3", "정보 없음"),
                "latitude": hospital["latitude"],
                "longitude": hospital["longuitude"],
                "distance": hospital["distance"],
                "duration": hospital["duration"],
                "beds": []
            }

        merged_hospitals[hospital_name]["beds"].extend(hospital["beds"])

    return list(merged_hospitals.values())

# YJ algorithm
def get_bed_availability2(api_key, stage1, stage2, hospital_name, department):
    url = 'http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire'
    params = {
        'serviceKey': api_key,
        'STAGE1': stage1,
        'STAGE2': stage2,
        'pageNo': '1',
        'numOfRows': '1000'
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        root = ET.fromstring(response.content)
        for item in root.findall(".//item"):
            if item.findtext("dutyName") == hospital_name:
                dept_mapping = {"내과": "hv2", "외과": "hv3", "신경외과": "hv6"}
                key = dept_mapping[department]
                if item.findtext(key) != None:
                    return 1
        return None  # 해당 병원의 병상 정보가 없을 경우
    else:
        print(f"Error in API call: {response.status_code}")
        return None
    
def get_hospital_bed_info2(api_key, hospitals, department): 
    for hospital in hospitals:
        stage1, stage2 = extract_region(hospital["addr"])
        bed_info = get_bed_availability2(api_key, stage1, stage2, hospital["hospital"], department)
        if bed_info:
            hospital["beds"] = [1]  # 병상 정보를 리스트로 추가
        else:
            hospital["beds"] = []
    return hospitals

# 병원 추천 함수
def recommend_hospital2(emergency, start_lat, start_lng):
    hospital_data=emergency.loc[emergency["latitude"].between(start_lat-0.05, start_lat+0.05) & emergency["longuitude"].between(start_lng-0.05, start_lng+0.05)].copy()
    hospital_data[["distance", "duration"]] = hospital_data.apply(lambda x: get_dist(start_lat, start_lng, x["latitude"], x["longuitude"]), axis=1)
    top_hospitals = hospital_data.sort_values("distance").to_dict("records")
    return top_hospitals

# YS algorithm
def get_hospitals_with_available_capacity(conn):
    """
    1시간 내 환자 데이터를 병원 ID별로 집계하고, 병원 capacity와 비교하여 출력 가능한 병원 목록을 반환합니다.
    """

    # 병원 ID별로 지난 1시간 내 환자 수를 집계하고, capacity와 비교
    query = """
        SELECT
            er.hospital,
            er.addr,
            er.latitude,
            er.longuitude,
            er.capacity,
            er.ID,
            ISNULL(pc.recent_patient_count, 0) AS recent_patient_count
        FROM
            emergency_room er
        LEFT JOIN (
            SELECT
                hospital_id,
                COUNT(*) AS recent_patient_count
            FROM
                patient
            WHERE
                call_time >= DATEADD(hour, -10, GETDATE())  -- 서버시간 때문에 (-9가 디폴트임임) 전 데이터
            GROUP BY
                hospital_id
        ) pc
        ON er.ID = pc.hospital_id
        WHERE ISNULL(pc.recent_patient_count, 0) < er.capacity;  -- 환자 수 < 병원 capacity 조건
        """

    # SQL 쿼리 실행 및 결과 반환
    hospital_data = pd.read_sql(query, conn)
    return hospital_data

def recommend_hospital_with_capacity(conn, start_lat, start_lng, num=3):
    """
    1시간 내 환자 데이터와 병원 capacity를 비교한 후, 거리 기반으로 상위 병원을 추천합니다.
    """

    # 사용 가능한 병원 데이터 조회
    hospital_data = get_hospitals_with_available_capacity(conn)
    hospital_data = hospital_data.loc[hospital_data["latitude"].between(start_lat-0.05, start_lat+0.05) 
                                      & hospital_data["longuitude"].between(start_lng-0.05, start_lng+0.05)].copy()
    
    # 거리 계산
    hospital_data[["distance", "duration"]] = hospital_data.apply(
        lambda x: get_dist(start_lat, start_lng, x["latitude"], x["longuitude"]), axis=1
        )

    # 거리 기준 상위 병원 추천
    top_hospitals = hospital_data.nsmallest(num, "distance").to_dict("records")
    return top_hospitals

# 병원 추천 함수
def recommend_hospital_from_db(conn, start_lat, start_lng, num=3):
    query = """
        SELECT hospital, addr, emer_type, tel1, tel3, latitude, longuitude, capacity, ID
        FROM emergency_room
        WHERE capacity > 0;
    """
    hospital_data = pd.read_sql(query, conn)
    hospital_data=hospital_data.loc[hospital_data['latitude'].between(start_lat-0.05, start_lat+0.05) & hospital_data['longuitude'].between(start_lng-0.05, start_lng+0.05)].copy()

    hospital_data[["distance", "duration"]] = hospital_data.apply(lambda x: get_dist(start_lat, start_lng, x['latitude'], x['longuitude']), axis=1)

    top_hospitals = hospital_data.nsmallest(3, "distance").to_dict("records")
    return top_hospitals