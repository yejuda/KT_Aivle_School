export default async (req, res) => {
  const { request, userX, userY } = req.query;
  const nUserX = parseFloat(userX);
  const nUserY = parseFloat(userY);
  try {
    console.log("API CALLED to next BACK");
    const url = `https://mini7-fastapi-a061131-anhydsgda9d6bzdx.koreacentral-01.azurewebsites.net/hospital_by_module?request="${request}"&latitude=${nUserX}&longitude=${nUserY}&num=3`;

    //   const response = await fetch(url,
    //     {
    //       method: "GET",
    //       headers: {"Content-Type": "application/json"}
    //     }
    //   );

    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message || "Oops! Something went wrong." });
  }
};
