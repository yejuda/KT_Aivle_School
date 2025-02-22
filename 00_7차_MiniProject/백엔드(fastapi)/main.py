from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine
from typing import List, Dict
from pydantic import BaseModel
import emergency as em
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import os
from haversine import haversine
import pandas as pd
import numpy as np
import pyodbc

app = FastAPI()

os.environ['OPENAI_API_KEY'] = 'YOUR OPEN API KEY'

path = os.path.dirname(os.path.abspath(__file__))
save_directory = os.path.join(path, "fine_tuned_bert")
model = AutoModelForSequenceClassification.from_pretrained(save_directory)
tokenizer = AutoTokenizer.from_pretrained(save_directory)

# 데이터베이스 연결 설정
def connect_to_db():
    server = "dbserver-aivle9.database.windows.net"
    database = "db9"
    username = "root9"
    password = "password9!"
    driver = "ODBC+Driver+17+for+SQL+Server"
    connection_string = f"mssql+pyodbc://{username}:{password}@{server}/{database}?driver={driver}"
    engine = create_engine(connection_string)
    return engine

# 데이터 모델 정의
class Hospital(BaseModel):
    hospitalName: str
    addr: str
    emergencyMedicalInstitutionType: str
    phoneNumber1: str
    phoneNumber3: str
    latitude: float
    longitude: float
    distance: float
    duration: float  # 병상 정보
    ID : int
    beds: List[Dict]

# FastAPI 응답 모델
class HospitalResponse(BaseModel):
    summary: str
    keywords: List[str]
    department: str
    severity: int
    hospitals: List[Hospital]

@app.get("/")
def read_root():
    return {"message": "Welcome to the Emergency Response System"}

@app.get("/hospital_by_module")
def get_hospitals(request: str, latitude: float, longitude: float, num: int):
    try:
        conn = connect_to_db()
        query = """SELECT * FROM emergency_room"""
        hospital_data = pd.read_sql(query, conn)
        summary, keywords, department = em.text_summary(request)
        severity, _ = em.predict_severity(summary, model, tokenizer)
        hospitals = em.recommend_hospital(hospital_data, latitude, longitude, num)
        
        # 응답 생성
        response_hospitals = [
            Hospital(
                hospitalName=hospital["hospital"],
                addr=hospital["addr"],
                emergencyMedicalInstitutionType=hospital.get("emer_type", "정보 없음"),
                phoneNumber1=hospital.get("tel1", "정보 없음"),
                phoneNumber3=hospital.get("tel3", "정보 없음"),
                latitude=hospital["latitude"],
                longitude=hospital["longuitude"],
                distance=hospital["distance"],
                duration=hospital["duration"],
                ID=hospital["ID"],
                beds=[])
            for hospital in hospitals
        ]

        return HospitalResponse(
            summary=summary,
            keywords=keywords,
            department=department,
            severity=severity,
            hospitals=response_hospitals
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/YJ_algorithm")
def get_hospitals2(request: str, latitude: float, longitude: float, num: int):
    try:
        conn = connect_to_db()
        query = """SELECT * FROM emergency_room"""
        hospital_data = pd.read_sql(query, conn)
        summary, keywords, department = em.text_summary(request)
        if department not in ['내과', '외과']:
            department = '신경외과'
        severity, _ = em.predict_severity(summary, model, tokenizer)
        hospitals = em.recommend_hospital2(hospital_data, latitude, longitude)
        print(hospitals)
        
        # 병상 정보 추가
        api_key = 'YOUR API KEY'  # 실제 API 키로 교체
        hospitals_with_beds = em.get_hospital_bed_info2(api_key, hospitals, department)
        hospitals_recomanded = [hospital for hospital in hospitals_with_beds if hospital["beds"]]
        sorted_hospitals = sorted(hospitals_recomanded, key=lambda x: x["distance"])
        top_hospitals = sorted_hospitals[:num]
        
        # 응답 생성
        response_hospitals = [
            Hospital(
                hospitalName=hospital["hospital"],
                addr=hospital["addr"],
                emergencyMedicalInstitutionType=hospital.get("emer_type", "정보 없음"),
                phoneNumber1=hospital.get("tel1", "정보 없음"),
                phoneNumber3=hospital.get("tel3", "정보 없음"),
                latitude=hospital["latitude"],
                longitude=hospital["longuitude"],
                distance=hospital["distance"],
                duration=hospital["duration"],
                ID=hospital["ID"],
                beds=[])
            for hospital in top_hospitals]

        return HospitalResponse(
            summary=summary,
            keywords=keywords,
            department=department,
            severity=severity,
            hospitals=response_hospitals)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/YS_algorithm")
def get_hospitals3(request: str, latitude: float, longitude: float, num: int):
    try:
        conn = connect_to_db()  # 데이터베이스 연결
        summary, keywords, department = em.text_summary(request)
        severity, _ = em.predict_severity(summary, model, tokenizer)
        hospitals = em.recommend_hospital_from_db(conn, latitude, longitude, num)

        # 응답 생성
        response_hospitals = [
            Hospital(
                hospitalName=hospital["hospital"],
                addr=hospital["addr"],
                emergencyMedicalInstitutionType=hospital.get("emer_type", "정보 없음"),
                phoneNumber1=hospital.get("tel1", "정보 없음"),
                phoneNumber3=hospital.get("tel3", "정보 없음"),
                latitude=hospital["latitude"],
                longitude=hospital["longuitude"],
                distance=hospital["distance"],
                duration=hospital["duration"],
                ID=hospital["ID"],
                beds=[])
            for hospital in hospitals]

        return HospitalResponse(
            summary=summary,
            keywords=keywords,
            department=department,
            severity=severity,
            hospitals=response_hospitals
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
