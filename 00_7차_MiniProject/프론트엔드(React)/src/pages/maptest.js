import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState, useEffect } from "react";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const MapTest = () => {
  const [emData, setEmData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [map, setMap] = useState();
  const [filteredData, setFilteredData] = useState([]);
  const [kakaoTest, setKakaoTest] = useState([]);
  const [filter, setFilter] = useState({
    start: new Date(new Date().getTime() + 9 * 60 * 60 * 1000) // 9hrs from now
      .toISOString()
      .slice(0, 16),
    end: new Date(new Date().getTime() + 57 * 60 * 60 * 1000) // 3days from now
      .toISOString()
      .slice(0, 16),
  });


  //map load
  useEffect(() => {
    const container = document.getElementById('map');
    const options = {
      center: userLocation ? new kakao.maps.LatLng(...userLocation.split(',').reverse()) : new kakao.maps.LatLng(37.3947, 127.111),
      level: 8,
    };
    
    setMap(new kakao.maps.Map(container, options));
  }, [userLocation]);
  
  //user
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const origin = `${position.coords.longitude},${position.coords.latitude}`;
        setUserLocation(origin);
      });
    } else { 
      console.log("Geolocation is not supported by this browser.");
    }
}, []);

// Make API call with user's location
  useEffect(() => {
    if(userLocation){
      const destination = "127.121202,37.494912";
      
      fetch(
        `https://apis-navi.kakaomobility.com/v1/directions?origin=${userLocation}&destination=${destination}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "KakaoAK 19be3663885d8a0c8f300380eee90639",
          },
        }
      )
      .then((res) =>res.json())
      .then((data) => setKakaoTest(data))
      .catch(console.error);
    }
  }, [userLocation]);


  useEffect(() => {
      // console.log(kakaoTest)
    if (kakaoTest.routes){
      // console.log("DRAW!")
      // Get coordinates from guides (replace this with actual data)
      const guides = kakaoTest.routes[0].sections[0].guides;
      // Convert each guide into LatLng object 
      const points = guides.map(guide => new kakao.maps.LatLng(guide.y, guide.x));
      // Create polyline 
      var polyline = new kakao.maps.Polyline({
      path: points,
      strokeWeight: 5,
      strokeColor: '#FF0000',
      strokeOpacity: 0.7,
      strokeStyle: 'solid'
    });
    // Display polyline on map
    polyline.setMap(map);
  } 
 }, [kakaoTest, map]);

  const handleFilterChange = () => {
    if (filter.start && filter.end) {
      const start = new Date(filter.start).getTime();
      const end = new Date(filter.end).getTime();
      const filtered = emData.filter((row) => {
        const datetime = new Date(row.datetime).getTime();
        return datetime >= start && datetime <= end;
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(emData);
    }
  };

  return (
    <>
      <Head>
        <title>MiniProject7~</title>
        <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=bade49b6153cc0300512ae3b6ab77dce"></script>
      </Head>
      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <main className={styles.main}>
        <div id="map" style={{width: '500px', height: '400px'}}></div>
          <ol>Mini Proect 7</ol>

        </main>
        
      </div>
    </>
  );
};

export default MapTest;
