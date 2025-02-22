import Head from "next/head";
import Image from "next/image";
import {useRouter} from "next/router"
import { useState, useEffect } from "react";

const DbTest = () => {
    const [table,setTable] = useState([]);

    useEffect(() => {
        fetch("/api/getEm")
          .then((res) => res.json())
          .then((data) => setTable(data))
      }, []);

    return(
        <div>
            {
                table.map((row, index) =>
                    <div key={index}>
                        <p>DateTime: {row.datetime}</p>
                        <p>InputText: {row.input_text}</p>
                        <p>InputLat:{row.input_latitude}</p>
                        <p>hospital1:{row.hospital1}</p>
                    </div>
                )
            }
        </div>
    )
}

export default DbTest;