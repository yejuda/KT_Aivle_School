import styles from "@/styles/Home.module.css";
import { useState, useEffect } from "react";

const DashBoard = () => {
  const [emData, setEmData] = useState();

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

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div
        style={{
          width: "2500px",
          height: "2000px",
          backgroundColor: "red",
        }}
      />
    </div>
  );
};

export default DashBoard;
