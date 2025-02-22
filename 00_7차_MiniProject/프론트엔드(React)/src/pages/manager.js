import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Manager.module.css";
import styles2 from "@/styles/Button.module.css";
import { useState, useEffect } from "react";
import logo from "../../public/logo.webp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Manager = () => {
  const [emData, setEmData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filter, setFilter] = useState({
    start: new Date(new Date().getTime() + 9 * 60 * 60 * 1000) // 9hrs from now
      .toISOString()
      .slice(0, 16),
    end: new Date(new Date().getTime() + 57 * 60 * 60 * 1000) // 3 days from now
      .toISOString()
      .slice(0, 16),
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Number of rows per page

  useEffect(() => {
    fetch("/api/emDbSel", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmData(data);
      })
      .catch(console.error);
  }, []);

  const handleFilterChange = () => {
    if (filter.start && filter.end) {
      const start = new Date(filter.start).getTime();
      const end = new Date(filter.end).getTime();
      const filtered = emData.filter((row) => {
        const datetime = new Date(row.datetime).getTime();
        return datetime >= start && datetime <= end;
      });
      setFilteredData(filtered);
      setCurrentPage(1); // Reset to the first page when filtering
    } else {
      setFilteredData(emData);
    }
  };

  const handleStartChange = (e) => {
    const newStart = e.target.value;
    setFilter((prevFilter) => ({
      ...prevFilter,
      start: newStart,
      end: newStart > prevFilter.end ? newStart : prevFilter.end, // Ensure end date is after start
    }));
  };

  const handleEndChange = (e) => {
    const newEnd = e.target.value;
    setFilter((prevFilter) => ({
      ...prevFilter,
      end: newEnd,
      start: newEnd < prevFilter.start ? newEnd : prevFilter.start, // Ensure start date is before end
    }));
  };

  // Column mapping
  const columnMapping = {
    datetime: "요청일시",
    input_text: "내용",
    input_latitude: "위도",
    input_longitude: "경도",
    em_class: "응급등급",
    hospital1: "추천병원1",
    addr1: "주소1",
    tel1: "전화번호1",
    hospital2: "추천병원2",
    addr2: "주소2",
    tel2: "전화번호2",
    hospital3: "추천병원3",
    addr3: "주소3",
    tel3: "전화번호3",
  };

  // Calculate paginated data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <>
      <Head>
        <title>MiniProject7~</title>
      </Head>
      <div style={{ width: "100%", height: "100vh", overflowX: "auto" }}>
        <div
          className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
        >
          <div className={styles["flex_row"]} style={{ gap: "12px" }}>
            <Image src={logo} width={100} height={100} alt="logo" />
            <div className={styles["flex_col"]}>
              <div className={styles["title"]}>AI Call 관리자</div>
              <div className={styles["subtitle"]}>AI 3반 9조</div>
            </div>
          </div>
          <div className="filter_section">
            <div className={styles.flex_container}>
              <input
                type="datetime-local"
                className={styles.datetime}
                value={filter.start}
                onChange={handleStartChange}
              />
              <input
                type="datetime-local"
                className={styles.datetime}
                value={filter.end}
                onChange={handleEndChange}
              />
              <button onClick={handleFilterChange} className={styles.button}>
                검색
              </button>
            </div>
          </div>

          <main className={styles.main}>
            <div className={styles.table_wrapper}>
              <div className={styles.totalCount}>
                총 건수: {filteredData.length}
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {emData[0] &&
                      Object.keys(emData[0]).map((key) => (
                        <th key={key}>{columnMapping[key] || key}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, idx) => (
                        <td key={idx}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-box">
              <button
                className={styles2.pageButton}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  className={styles2.pageButton}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                className={styles2.pageButton}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Manager;
