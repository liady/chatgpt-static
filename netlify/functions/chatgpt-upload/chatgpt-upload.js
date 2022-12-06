const AWS = require("aws-sdk");

// Configure the S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  region: "us-east-1", // or any other region you want
});

let headers = {};

headers["Access-Control-Allow-Origin"] = "https://chat.openai.com";
headers["Access-Control-Allow-Headers"] = "*";
headers["Access-Control-Allow-Methods"] = "*";
headers["Access-Control-Allow-Credentials"] = true;
// headers["Vary"] = "Origin";

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    console.log(headers);
    return { statusCode: 204, headers };
  }
  // Get the file from the request body
  const { main, css, globalCss, localCss } = JSON.parse(event.body);
  let styleString;
  if (localCss) {
    styleString = `
    <style id="global-chat-css">${globalCss}</style>
    <style id="local-chat-css">${localCss}</style>
    `;
  } else {
    styleString = `
    <style id="chat-css">${css}</style>
    `;
  }

  const htmlToUpload = `
  <html class="dark" style="color-scheme: dark">
  <head>
    <title>A chat with ChatGPT</title>
    <meta charset="utf-8" />
    <link rel="icon" href="https://chatgpt-static.s3.amazonaws.com/assets/icon.png" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, user-scalable=no"
    />
    ${styleString}
    <style>
      main {
        height: auto !important;
      }
      .absolute.bottom-0, .absolute.right-6, .w-full.h-48.flex-shrink-0,
      button.rounded-md, .invisible{
        display: none !important;
      }
      button.ml-auto.gap-2 {
        visibility: hidden;
      }
    </style>
  </head>
<body>
${fix(main)}
</body>
</html>
`;

  const id =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Upload the file to S3
  const params = {
    Bucket: "chatgpt-static",
    Key: `chats/${id}.html`,
    ContentType: "text/html; charset=utf-8",
    Body: htmlToUpload,
  };
  const uploadedFile = await s3.upload(params).promise();

  // Return a 200 response with the S3 URL of the uploaded file
  console.log("post", headers);
  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({ url: uploadedFile.Location }),
  };
};

function fix(main) {
  let result = main.replaceAll(
    /\/_next\/image/g,
    "https://chat.openai.com/_next/image"
  );
  const generatedBy = `
  <style>
  .generated, .generated a {
    color: #d1d5db70;
    transition: color .1s ease;
  }
  .generated a:hover {
    color: #d1d5db;
  }
  </style>
  <div style="
    padding: 10px 10px;
    display: flex;
    justify-content: flex-end;
    width: 100% !important;
    max-width: 48rem;
    font-size: 12px;
" class="dark generated prose"><span style="display: inline-block;margin-inline-end: 3px;">Generated With</span> <a href="https://github.com/liady/chatgpt-pdf" target="_blank">ChatGPT Export</a></div>
  `;
  const toReplace = '<div class="w-full h-48 flex-shrink-0';
  result = result.replace(toReplace, `${generatedBy}${toReplace}`);
  return result;
}

// [class*="Thread__PositionForm"], [class*="ThreadLayout__ScrollButton"], [class*="ThreadLayout__BottomSpacer"],
// [class*="ConversationItem__ActionButton"], [class*="Pagination__PaginationWrapper"]{
//   display: none !important;
// }
// [class*="CopyButton__StyledButton"] {
//   visibility: hidden;
// }
// const toReplace = '<div class="ThreadLayout__BottomSpacer';