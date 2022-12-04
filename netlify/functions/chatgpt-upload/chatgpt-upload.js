const AWS = require("aws-sdk");

// Configure the S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  region: "us-east-1", // or any other region you want
});

let headers = {
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin",
  "Content-Type": "application/json", //optional
};

headers["Access-Control-Allow-Origin"] = "*";
headers["Access-Control-Allow-Headers"] = "*";
headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
headers["Access-Control-Allow-Credentials"] = true;
// headers["Vary"] = "Origin";

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    console.log(headers);
    return { statusCode: "200", headers };
  }
  // Get the file from the request body
  const { main, css } = JSON.parse(event.body);

  const htmlToUpload = `
  <html class="dark" style="color-scheme: dark">
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, user-scalable=no"
    />
    <style>
      ${css}
    </style>
    <style>
      main {
        height: auto !important;
      }
      [class*="Thread__PositionForm"], [class*="ThreadLayout__ScrollButton"], [class*="ThreadLayout__BottomSpacer"],
      [class*="ConversationItem__ActionButton"]{
        display: none !important;
      }
      [class*="CopyButton__StyledButton"] {
        visibility: hidden;
      }
    </style>
  </head>
<body>
${replaceImages(main)}
</body>
</html>
`;

  const id =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Upload the file to S3
  const params = {
    Bucket: "chatgpt-static",
    Key: `${id}.html`,
    ContentType: "text/html",
    Body: htmlToUpload,
  };
  const uploadedFile = await s3.upload(params).promise();

  // Return a 200 response with the S3 URL of the uploaded file
  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({ url: uploadedFile.Location }),
  };
};

function replaceImages(main) {
  return main.replaceAll(/\/_next\/image/g, 'https://chat.openai.com/_next/image')
}