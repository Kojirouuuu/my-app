const AWS = require("aws-sdk");
const mysql = require("mysql2/promise");
const s3 = new AWS.S3();

// ... existing ingredients array ...

exports.handler = async function (event) {
  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  // 1. S3イベントからオブジェクト情報を取得
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  console.log(`Bucket: ${bucket}`, `Key: ${key}`);

  // パスからユーザーIDを抽出
  const userId = key.split("/")[1];
  const imageKey = key;
  const jsonKey = key.replace(".jpg", ".json");

  try {
    // 2. ランダムに食材を選択（1-20個）
    const numItems = Math.floor(Math.random() * 20) + 1; // 1-20個
    const selectedIngredients = [];
    const usedIndices = new Set();

    while (selectedIngredients.length < numItems) {
      const index = Math.floor(Math.random() * ingredients.length);
      if (!usedIndices.has(index)) {
        usedIndices.add(index);
        const confidence = (Math.random() * 0.3 + 0.7).toFixed(2); // 0.7-1.0のランダムな信頼度
        selectedIngredients.push({
          item_name: ingredients[index],
          confidence: parseFloat(confidence),
        });
      }
    }

    // 3. 検出結果をJSONとしてS3に保存
    const detectionResult = {
      image_url: `https://${bucket}.s3.amazonaws.com/${imageKey}`,
      detected_at: new Date().toISOString(),
      items: selectedIngredients,
    };

    await s3
      .putObject({
        Bucket: bucket,
        Key: jsonKey,
        Body: JSON.stringify(detectionResult, null, 2),
        ContentType: "application/json",
        ACL: "public-read",
      })
      .promise();

    // 4. RDSに接続（rdsLambdaFunctionと同じ接続情報を使用）
    const connection = await mysql.createConnection({
      host: process.env.RDS_HOST, // RDS のエンドポイント
      user: process.env.RDS_USER, // RDS ユーザー名
      password: process.env.RDS_PASSWORD, // RDS パスワード
      database: process.env.RDS_DATABASE, // データベース名
    });

    // 5. 検出された食材をデータベースに保存（新しいテーブルを使用）
    for (const item of selectedIngredients) {
      const sql = `
        INSERT INTO fridge_contents (user_id, item_name, confidence, image_url, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      const imageUrl = `https://${bucket}.s3.amazonaws.com/${imageKey}`;
      await connection.execute(sql, [
        userId,
        item.item_name,
        item.confidence,
        imageUrl,
      ]);
    }

    await connection.end();

    console.log("Successfully processed items:", selectedIngredients);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully processed image and stored items",
        detectedItems: selectedIngredients,
        jsonUrl: `https://${bucket}.s3.amazonaws.com/${jsonKey}`,
      }),
    };
  } catch (error) {
    console.error("Error processing image:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing image",
        error: error.message,
      }),
    };
  }
};
