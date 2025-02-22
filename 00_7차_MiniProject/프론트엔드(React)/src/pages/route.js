import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";
import { useState, useEffect } from "react";
import RingLoader from "react-spinners/RingLoader";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Route = () => {
  const router = useRouter();
  const [map, setMap] = useState();
  const [kakao1, setKakao1] = useState();
  const [kakao2, setKakao2] = useState();
  const [kakao3, setKakao3] = useState();
  const [originX, setOriginX] = useState();
  const [originY, setOriginY] = useState();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState();
  const [apiResult, setApiResult] = useState();
  const [hospital1, setHospital1] = useState();
  const [hospital2, setHospital2] = useState();
  const [hospital3, setHospital3] = useState();
  const [hospital1X, setHospital1X] = useState();
  const [hospital1Y, setHospital1Y] = useState();
  const [hospital2X, setHospital2X] = useState();
  const [hospital2Y, setHospital2Y] = useState();
  const [hospital3X, setHospital3X] = useState();
  const [hospital3Y, setHospital3Y] = useState();
  const [activeMap, setActiveMap] = useState("map1");

  // useEffect(() => {
  //   if (apiResult) {
  //     fetch("/api/addRecord", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ id1: apiResult[0].ID}),
  //     })
  //       .then((response) => response.json())
  //       .then((data) => setData(data))
  //       .catch((error) => setError(error));
  //   }
  // }, [apiResult]);

  //라우터가 오면 origin 좌표 받아오기
  useEffect(() => {
    setOriginX(router.query.orglat);
    setOriginY(router.query.orglng);
    setRequest(router.query.request);
  }, [router]);

  //백엔드 병원 API 호출
  useEffect(() => {
    if (originX) {
      setLoading(true);
      fetch(
        `/api/hospital?request=${encodeURIComponent(request)}&userX=${encodeURIComponent(originX)}&userY=${encodeURIComponent(originY)}`
      )
        .then((res) => res.json())
        .then((data) => setApiResult(data))
        .finally(() => setLoading(false));
    }
  }, [originX]);

  //백엔드 병원 API가 오면 결과를 배정해야함
  useEffect(() => {
    if (apiResult) {
      setHospital1(apiResult[0]);
      setHospital2(apiResult[1]);
      setHospital3(apiResult[2]);
      setHospital1X(apiResult[0].latitude);
      setHospital1Y(apiResult[0].longitude);
      setHospital2X(apiResult[1].latitude);
      setHospital2Y(apiResult[1].longitude);
      setHospital3X(apiResult[2].latitude);
      setHospital3Y(apiResult[2].longitude);
    }
  }, [apiResult]);

  //지도1 로드
  useEffect(() => {
    const container = document.getElementById("map1");
    const options = {
      center: originX
        ? new kakao.maps.LatLng(originX, originY)
        : new kakao.maps.LatLng(37.3333, 127.396),
      level: 7,
    };
    setMap(new kakao.maps.Map(container, options));
  }, [originX]);

  //지도2 로드
  useEffect(() => {
    const container2 = document.getElementById("map2");
    const options2 = {
      center: originX
        ? new kakao.maps.LatLng(originX, originY)
        : new kakao.maps.LatLng(37.4333, 127.196),
      level: 7,
    };
    setMap(new kakao.maps.Map(container2, options2));
  }, [originX]);

  //지도3 로드
  useEffect(() => {
    const container3 = document.getElementById("map3");
    const options3 = {
      center: originX
        ? new kakao.maps.LatLng(originX, originY)
        : new kakao.maps.LatLng(37.5333, 127.096),
      level: 7,
    };
    setMap(new kakao.maps.Map(container3, options3));
  }, [originX]);

  //좌표 4개로 카카오API1 호출
  useEffect(() => {
    console.log("Kakao1call");
    if (hospital1X) {
      fetch(
        `https://apis-navi.kakaomobility.com/v1/directions?origin=${originY},${originX}&destination=${hospital1Y},${hospital1X}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "KakaoAK 19be3663885d8a0c8f300380eee90639",
          },
        }
      )
        .then((res) => res.json())
        .then((data) => setKakao1(data))
        .catch(console.error);
    }
  }, [hospital1X]);

  //카카오API2
  useEffect(() => {
    console.log("Kakao2call");
    if (hospital2X) {
      fetch(
        `https://apis-navi.kakaomobility.com/v1/directions?origin=${originY},${originX}&destination=${hospital2Y},${hospital2X}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "KakaoAK 19be3663885d8a0c8f300380eee90639",
          },
        }
      )
        .then((res) => res.json())
        .then((data) => setKakao2(data))
        .catch(console.error);
    }
  }, [hospital2X]);

  //카카오API3
  useEffect(() => {
    console.log("Kakao3call");
    if (hospital1X) {
      fetch(
        `https://apis-navi.kakaomobility.com/v1/directions?origin=${originY},${originX}&destination=${hospital3Y},${hospital3X}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "KakaoAK 19be3663885d8a0c8f300380eee90639",
          },
        }
      )
        .then((res) => res.json())
        .then((data) => setKakao3(data))
        .catch(console.error);
    }
  }, [hospital3X]);

  //경로 그리기1 및 이동
  useEffect(() => {
    if (kakao1) {
      console.log("Route1Draw");
      const guides = kakao1.routes[0].sections[0].guides;
      const points = guides.map(
        (guide) => new kakao.maps.LatLng(guide.y, guide.x)
      );
      console.log(points);
      //map1 선택
      const container = document.getElementById("map1");
      const options = {
        center: originX
          ? new kakao.maps.LatLng(37.5836, 127.086)
          : new kakao.maps.LatLng(originX, originY),
        level: 7,
      };
      let mapOne = new kakao.maps.Map(container, options);
      setMap(mapOne);

      const nX1 = (parseFloat(hospital1X) + parseFloat(originX)) / 2;
      const nY1 = (parseFloat(hospital1Y) + parseFloat(originY)) / 2;
      const newCenter = new kakao.maps.LatLng(nX1, nY1);
      mapOne.setCenter(newCenter);

      var polyline = new kakao.maps.Polyline({
        path: points,
        strokeWeight: 5,
        strokeColor: "#ff0000",
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
      });
      //경로 표시1
      polyline.setMap(mapOne);

      const createAndSetMarker = (x, y, map) => {
        const position = new kakao.maps.LatLng(x, y);
        const marker = new kakao.maps.Marker({ position });
        marker.setMap(map);
      };
      createAndSetMarker(originX, originY, mapOne);
      createAndSetMarker(hospital1X, hospital1Y, mapOne);
    }
  }, [kakao1, originX]);

  //경로 그리기2 및 이동
  useEffect(() => {
    if (kakao2) {
      console.log("Route2Draw");
      const guides = kakao2.routes[0].sections[0].guides;
      const points = guides.map(
        (guide) => new kakao.maps.LatLng(guide.y, guide.x)
      );
      console.log(points);
      //map2 선택
      const container = document.getElementById("map2");
      const options = {
        center: originX
          ? new kakao.maps.LatLng(37.5836, 127.086)
          : new kakao.maps.LatLng(originX, originY),
        level: 7,
      };
      let mapTwo = new kakao.maps.Map(container, options);
      setMap(mapTwo);
      const nX2 = (parseFloat(hospital2X) + parseFloat(originX)) / 2;
      const nY2 = (parseFloat(hospital2Y) + parseFloat(originY)) / 2;
      const newCenter = new kakao.maps.LatLng(nX2, nY2);
      mapTwo.setCenter(newCenter);
      var polyline = new kakao.maps.Polyline({
        path: points,
        strokeWeight: 5,
        strokeColor: "#ff0000",
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
      });
      //경로 표시2
      polyline.setMap(mapTwo);

      //출발 도착지에 마커 추가
      const createAndSetMarker = (x, y, map) => {
        const position = new kakao.maps.LatLng(x, y);
        const marker = new kakao.maps.Marker({ position });
        marker.setMap(map);
      };
      createAndSetMarker(originX, originY, mapTwo);
      createAndSetMarker(hospital2X, hospital2Y, mapTwo);
    }
  }, [kakao2, originX]);

  //경로 그리기3 및 이동
  useEffect(() => {
    if (kakao3) {
      console.log("Route3Draw");
      const guides = kakao3.routes[0].sections[0].guides;
      const points = guides.map(
        (guide) => new kakao.maps.LatLng(guide.y, guide.x)
      );
      console.log(points);
      //map3 선택
      const container = document.getElementById("map3");
      const options = {
        center: originX
          ? new kakao.maps.LatLng(37.5836, 127.086)
          : new kakao.maps.LatLng(originX, originY),
        level: 7,
      };
      let mapThree = new kakao.maps.Map(container, options);
      setMap(mapThree);
      const nX3 = (parseFloat(hospital3X) + parseFloat(originX)) / 2;
      const nY3 = (parseFloat(hospital3Y) + parseFloat(originY)) / 2;
      const newCenter = new kakao.maps.LatLng(nX3, nY3);
      mapThree.setCenter(newCenter);
      var polyline = new kakao.maps.Polyline({
        path: points,
        strokeWeight: 5,
        strokeColor: "#ff0000",
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
      });
      //경로 표시3
      polyline.setMap(mapThree);

      const createAndSetMarker = (x, y, map) => {
        const position = new kakao.maps.LatLng(x, y);
        const marker = new kakao.maps.Marker({ position });
        marker.setMap(map);
      };
      createAndSetMarker(originX, originY, mapThree);
      createAndSetMarker(hospital3X, hospital3Y, mapThree);
    }
  }, [kakao3, originX]);

  return (
    <>
      <title>MiniProject7~</title>
      <div className="flex-container">
        <div className="button-box">
          <button className="button-one" onClick={() => setActiveMap("map1")}>
            병원 1번
          </button>
          <button className="button-one" onClick={() => setActiveMap("map2")}>
            병원 2번
          </button>
          <button className="button-one" onClick={() => setActiveMap("map3")}>
            병원 3번
          </button>
        </div>

        <div className="data-box">
          <div className="map-box">
            {/* 지도1 */}
            <div
              className="map"
              id="map1"
              style={{
                zIndex: activeMap === "map1" ? 3 : 1,
              }}
            ></div>
            {/* 지도2 */}
            <div
              id="map2"
              className="map"
              style={{
                zIndex: activeMap === "map2" ? 3 : 1,
              }}
            ></div>
            {/* 지도3 */}
            <div
              id="map3"
              className="map"
              style={{
                zIndex: activeMap === "map3" ? 3 : 1,
              }}
            ></div>
          </div>
          <div className="info-box">
            <div
              className="info"
              id="info1"
              style={{
                zIndex: activeMap === "map1" ? 3 : 1,
              }}
            >
              <div className="info-detail">
                {hospital1 ? (
                  "병원명: " + hospital1.hospitalName
                ) : (
                  <RingLoader color="#ffccaa" />
                )}
                <br></br>
                {hospital1 ? "주소: " + hospital1.address : "Loading.."}
                <br></br>
                {hospital1 ? "연락처: " + hospital1.phoneNumber1 : <></>}
              </div>
            </div>
            <div
              id="info2"
              className="info"
              style={{
                zIndex: activeMap === "map2" ? 3 : 1,
              }}
            >
              <div className="info-detail">
                {hospital2 ? (
                  "병원명: " + hospital2.hospitalName
                ) : (
                  <RingLoader color="#ffccaa" />
                )}
                <br></br>
                {hospital2 ? "주소: " + hospital2.address : "Loading.."}
                <br></br>
                {hospital2 ? "연락처: " + hospital2.phoneNumber1 : <></>}
              </div>
            </div>
            <div
              id="info3"
              className="info"
              style={{
                zIndex: activeMap === "map3" ? 3 : 1,
              }}
            >
              <div className="info-detail">
                {hospital3 ? (
                  "병원명: " + hospital3.hospitalName
                ) : (
                  <RingLoader color="#ffccaa" />
                )}
                <br></br>
                {hospital3 ? "주소: " + hospital3.address : "Loading.."}
                <br></br>
                {hospital3 ? "연락처: " + hospital3.phoneNumber1 : <></>}
              </div>
            </div>
          </div>
        </div>
        {/* <div className="text-box">3반 9조 미프7</div> */}
      </div>
    </>
  );
};

export default Route;
