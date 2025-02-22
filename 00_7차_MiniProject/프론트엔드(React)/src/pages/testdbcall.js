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

const TestDbCall = () => {
  const [testData, setTestData] = useState([]);
  useEffect(() => {
    fetch("/api/testDbSel", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTestData(data);
        console.log(data);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <Head>
        <title>Create Next App</title>
      </Head>
      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <main className={styles.main}>
          <ol>Mini Proect 7</ol>
          Data from testdb.db
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>나이</th>
              </tr>
            </thead>
            <tbody>
              {testData.map((row, index) => (
                <tr key={index}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
        <footer className={styles.footer}>
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
        </footer>
      </div>
    </>
  );
};

export default TestDbCall;
