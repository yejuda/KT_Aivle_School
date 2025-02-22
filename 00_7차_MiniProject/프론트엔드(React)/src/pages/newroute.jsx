import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";
import { useState, useEffect } from "react";
import RingLoader from "react-spinners/RingLoader";

import styles from "@/styles/Route.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newRoute = () => {
  const router = useRouter();
  const [request, setRequest] = useState();
  const [origin, setOrigin] = useState({
    x: 0,
    y: 0,
  });
  const [hosDataList, setHosDataList] = useState([]);
  const [patients, setPatients] = useState();
  const [hosNum, setHosNum] = useState(0);
  const [summary, setSummary] = useState();
  const [beds, setBeds] = useState();

  const [load, setLoad] = useState(true);
  const [ka, setKa] = useState();

  useEffect(() => {
    if (hosDataList.length > 0) {
      fetch("/api/addRecordOne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id1: hosDataList[0].ID }),
      });
    }
  }, [hosDataList]);

  useEffect(() => {
    if (summary) {
      fetch("/api/getPatient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id1: summary.hospitals[0].ID,
          id2: summary.hospitals[1].ID,
          id3: summary.hospitals[2].ID,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          setPatients(data);
        });
    }
  }, [summary]);

  useEffect(() => {
    if (hosDataList.length > 0) {
      fetch("/api/getBeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id1: hosDataList[0].ID,
          id2: hosDataList[1].ID,
          id3: hosDataList[2].ID,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          setBeds(data);
          // console.log("1번병상수");
          // console.log(data[0].capacity);
        });
    }
  }, [hosDataList]);

  // 라우터로 위경도 입력받기기
  useEffect(() => {
    setOrigin({
      x: router.query.orglat,
      y: router.query.orglng,
    });
    setRequest(router.query.request);
  }, [router]);

  // 병원 api 호출
  useEffect(() => {
    if (origin.x) {
      setLoad(true);

      fetch(
        `/api/hospital?request=${encodeURIComponent(request)}&userX=${encodeURIComponent(origin.x)}&userY=${encodeURIComponent(origin.y)}`
      )
        .then((res) => res.json())
        .then((data) => {
          setSummary(data);
          setHosDataList(data.hospitals);
        });

      setHosNum(0);
    }
  }, [origin]);

  //   useEffect(() => {
  //     console.log(hosDataList);
  //   }, [hosDataList]);

  // 지도 로드
  useEffect(() => {
    const container = document.getElementById("map");
    const options = {
      center: origin
        ? new kakao.maps.LatLng(origin.x, origin.y)
        : new kakao.maps.LatLng(37.3333, 127.396),
      level: 7,
    };
    setMap(new kakao.maps.Map(container, options));
  }, [origin]);

  //좌표 4개로 카카오API1 호출
  useEffect(() => {
    if (hosDataList.length > 0) {
      console.log(hosDataList[hosNum]);
      const hosX = hosDataList[hosNum].latitude;
      const hosY = hosDataList[hosNum].longitude;

      fetch(
        `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.y},${origin.x}&destination=${hosY},${hosX}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "KakaoAK 19be3663885d8a0c8f300380eee90639",
          },
        }
      )
        .then((res) => res.json())
        .then((data) => setKa(data))
        .catch(console.error)
        .finally(setLoad(false));
    }
  }, [hosDataList, hosNum]);

  //경로 그리기1 및 이동
  const [map, setMap] = useState();
  useEffect(() => {
    if (ka) {
      console.log(ka);
      const guides = ka.routes[0].sections[0].guides;
      const points = guides.map(
        (guide) => new kakao.maps.LatLng(guide.y, guide.x)
      );

      const container = document.getElementById("map");
      const options = {
        center: origin
          ? new kakao.maps.LatLng(37.5836, 127.086)
          : new kakao.maps.LatLng(origin.x, origin.y),
        level: 7,
      };
      let mapOne = new kakao.maps.Map(container, options);
      setMap(mapOne);

      const hosX = hosDataList[hosNum].latitude;
      const hosY = hosDataList[hosNum].longitude;

      const nX1 = (parseFloat(hosX) + parseFloat(origin.x)) / 2;
      const nY1 = (parseFloat(hosY) + parseFloat(origin.y)) / 2;
      const newCenter = new kakao.maps.LatLng(nX1, nY1);
      mapOne.setCenter(newCenter);

      var polyline = new kakao.maps.Polyline({
        path: points,
        strokeWeight: 5,
        strokeColor: "#ff0000",
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
      });

      polyline.setMap(mapOne);

      const createAndSetMarker = (x, y, map) => {
        const position = new kakao.maps.LatLng(x, y);
        const marker = new kakao.maps.Marker({ position });
        marker.setMap(map);
      };
      createAndSetMarker(origin.x, origin.y, mapOne);
      createAndSetMarker(hosX, hosY, mapOne);
    }
  }, [ka, origin]);

  // 색상 설정 관련 함수
  const getGraphColor = (current, max) => {
    const ratio = current / max;

    if (ratio <= 0.5) {
      // 0% ~ 50%: 초록색에서 노란색으로
      const r = Math.floor(255 * (ratio * 2));
      const g = 255;
      return `rgb(${r}, ${g}, 0)`;
    } else {
      // 50% ~ 100%: 노란색에서 빨간색으로
      const g = Math.floor(255 * (2 - ratio * 2));
      return `rgb(255, ${g}, 0)`;
    }
  };

  const [info, setInfo] = useState();
  useEffect(() => {
    if (!hosDataList || !patients || !beds) return;
    setLoad(true);
    const newInfo = hosDataList.map((data, index) => {
      const recentPatientCount = patients[index]?.recent_patient_count || 0;
      const capacity = beds[index]?.capacity || 0;
  
      return {
        data,
        recentPatientCount,
        capacity,
      };
    });
  
    setInfo(newInfo);
    setLoad(false);
    console.log(newInfo);
  }, [hosDataList, patients, beds]);


  const ShowGraph = ({ current, max }) => {
    const graphColor = getGraphColor(current, max);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          paddingRight: "8px",
        }}
      >
        {/** 그래프 */}
        <progress
          value={current}
          max={max}
          style={{
            flexGrow: 1,
            accentColor: graphColor,
            "--progress-color": graphColor,
          }}
        ></progress>
        {/** 수치 */}
        <p style={{ fontSize: "14px" }}>
          {current}/{max}
        </p>
      </div>
    );
  };

  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <button
        className={styles["home"]}
        onClick={() => {
          router.push("/");
        }}
      >
        {"<"}
      </button>

      <div className={styles["data-box"]}>
        <div className={styles["map-box"]}>
          {/* 지도 */}
          <div className={styles.map} id="map"></div>
        </div>

        {/** 불러온 병원 목록 */}
        <div className={styles["info"]}>
          <h3
            style={{
              margin: "0 auto",
              marginBottom: "4px",
            }}
          >
            응급실 목록
          </h3>
          {load ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RingLoader color="#ffccaa" />
            </div>
          ) : (
            <div className={styles["hospital-list"]}>
              {info ? (
                info.map((data, index) => {
                  // 병실 수용 가능 비율에 따라서 그래프의 색상을 점진적으로 변경경

                  const hosData = data.data;
                  const mx = data.capacity;
                  const cur = data.recentPatientCount;

                  return (
                    <div
                      key={index}
                      className={styles["hospital-data"]}
                      style={{
                        border:
                          index == hosNum
                            ? "3px solid green"
                            : "3px solid transparent",
                      }}
                      onClick={() => setHosNum(index)}
                    >
                      {/** 병원이름 */}
                      <div className={styles["name"]}>
                        {hosData.hospitalName}
                      </div>
                      <div className={styles["hr"]}></div>
                      {/** 주소 */}
                      <div className={styles["add"]}>{hosData.addr}</div>
                      {/** 전화번호 */}
                      <a
                        className={styles["tel"]}
                        href={"tel:" + hosData.phoneNumber1}
                      >
                        전화번호 : {hosData.phoneNumber1}
                      </a>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "end",
                          gap: "6px",
                        }}
                      >
                        <p>
                          예상 소요 시간 :{" "}
                          {Math.floor(hosData.duration / 1000 / 60)}분
                        </p>
                        <p style={{ fontSize: "14px", color: "silver" }}>
                          ({hosData.distance}km)
                        </p>
                      </div>
                      {/** 수용가능정도 */}
                      {beds ? (
                        <ShowGraph current={cur} max={mx} />
                      ) : (
                        <div>Loading..</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div>주변에 검색된 응급실이 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default newRoute;
