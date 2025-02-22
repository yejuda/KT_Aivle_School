/*
제목: 문자 데이터 형식
작성: 이예주
내용: 문자 데이터 형식 이해
*/

use mydb;

-- 테이블 만들기
create table T1(
	col1 char(5),
    col2 varchar(10)
);
    
-- 확인
describe T1;    

-- 데이터 추가
insert into T1(col, col2) values('AAA', 'AA');

-- select * from T1;