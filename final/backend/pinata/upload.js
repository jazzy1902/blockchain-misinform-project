const JWT = process.env.PINATA_JWT;

async function uploadFile() {
  try {
    const text = "hello world!";
    const blob = new Blob([text], { type: "text/plain" });
    const file = new File([blob], "hello.txt");
    const data = new FormData();
    data.append("file", file);
    data.append("network", "public")

    const request = await fetch(
      "https://uploads.pinata.cloud/v3/files",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
        body: data,
      }
    );
    const response = await request.json();
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
    uploadFile,
};