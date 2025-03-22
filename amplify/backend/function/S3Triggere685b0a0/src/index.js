const {
  S3Client,
  PutObjectCommand,
  PutBucketPolicyCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const mysql = require("mysql2/promise");
const {
  RekognitionClient,
  DetectLabelsCommand,
} = require("@aws-sdk/client-rekognition");
// const mysql = require("mysql2/promise");
const s3Client = new S3Client();

// ... existing ingredients array ...

const ingredients = [
  "Tomato",
  "Potato",
  "Onion",
  "Garlic",
  "Carrot",
  "Bell Pepper",
  "Broccoli",
  "Cauliflower",
  "Spinach",
  "Kale",
  "Cabbage",
  "Celery",
  "Cucumber",
  "Zucchini",
  "Eggplant",
  "Mushroom",
  "Green Bean",
  "Peas",
  "Corn",
  "Lettuce",
  "Arugula",
  "Basil",
  "Parsley",
  "Cilantro",
  "Dill",
  "Rosemary",
  "Thyme",
  "Oregano",
  "Sage",
  "Mint",
  "Chives",
  "Lemon",
  "Lime",
  "Orange",
  "Apple",
  "Banana",
  "Strawberry",
  "Blueberry",
  "Raspberry",
  "Blackberry",
  "Pineapple",
  "Mango",
  "Peach",
  "Grape",
  "Watermelon",
  "Cantaloupe",
  "Honeydew",
  "Kiwi",
  "Avocado",
  "Ginger",
  "Turmeric",
  "Chili Pepper",
  "Jalapeno",
  "Habanero",
  "Paprika",
  "Cumin",
  "Coriander",
  "Cardamom",
  "Nutmeg",
  "Clove",
  "Cinnamon",
  "Allspice",
  "Bay Leaf",
  "Mustard Seed",
  "Fennel",
  "Sesame Seed",
  "Poppy Seed",
  "Pumpkin",
  "Squash",
  "Butternut Squash",
  "Acorn Squash",
  "Sweet Potato",
  "Yam",
  "Beetroot",
  "Radish",
  "Turnip",
  "Parsnip",
  "Brussels Sprouts",
  "Asparagus",
  "Artichoke",
  "Okra",
  "Leek",
  "Scallion",
  "Shallot",
  "Bean Sprout",
  "Bok Choy",
  "Watercress",
  "Endive",
  "Fennel (vegetable)",
  "Quinoa",
  "Rice",
  "Oats",
  "Barley",
  "Millet",
  "Rye",
  "Spelt",
  "Wheat",
  "Cornmeal",
  "Pasta",
  "Bread",
  "Naan",
  "Pita",
  "Baguette",
  "Croissant",
  "Bagel",
  "Muffin",
  "Donut",
  "Cookie",
  "Cake",
  "Brownie",
  "Pie",
  "Tart",
  "Scone",
  "Biscuit",
  "Cereal",
  "Granola",
  "Yogurt",
  "Cheese",
  "Milk",
  "Butter",
  "Cream",
  "Sour Cream",
  "Ice Cream",
  "Custard",
  "Egg",
  "Tofu",
  "Tempeh",
  "Seitan",
  "Chicken",
  "Beef",
  "Pork",
  "Lamb",
  "Turkey",
  "Duck",
  "Goose",
  "Fish",
  "Salmon",
  "Tuna",
  "Shrimp",
  "Crab",
  "Lobster",
  "Oyster",
  "Clam",
  "Mussel",
  "Scallop",
  "Squid",
  "Octopus",
  "Almond",
  "Walnut",
  "Pecan",
  "Hazelnut",
  "Cashew",
  "Peanut",
  "Pistachio",
  "Macadamia",
  "Brazil Nut",
  "Chestnut",
  "Sunflower Seed",
  "Pumpkin Seed",
  "Flaxseed",
  "Chia Seed",
  "Sesame",
  "Soybean",
  "Lentil",
  "Chickpea",
  "Black Bean",
  "Kidney Bean",
  "Pinto Bean",
  "Navy Bean",
  "Cranberry Bean",
  "Fava Bean",
  "Mung Bean",
  "Edamame",
  "Spice Mix",
  "Herb Mix",
  "Bouillon",
  "Vinegar",
  "Olive Oil",
  "Canola Oil",
  "Sunflower Oil",
  "Coconut Oil",
  "Sesame Oil",
  "Peanut Oil",
  "Grapeseed Oil",
  "Wine",
  "Beer",
  "Champagne",
  "Vodka",
  "Whiskey",
  "Rum",
  "Tequila",
  "Gin",
  "Brandy",
  "Sake",
  "Cocoa",
  "Coffee",
  "Tea",
  "Water",
  "Soda",
  "Juice",
];

// RDSのテーブル作成SQL
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS fridge_contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  confidence FLOAT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id VARCHAR(255) NOT NULL,
  following_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id)
);`;

exports.handler = async function (event) {
  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  // 1. S3イベントからオブジェクト情報を取得
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  console.log(`Bucket: ${bucket}`, `Key: ${key}`);

  // パスからユーザーIDを抽出（URLデコードを追加）
  const pathParts = key.split("/");
  const userId = decodeURIComponent(pathParts[pathParts.length - 2]);
  const imageKey = key;

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

    /*
    // 3. 検出結果をJSONとしてS3に保存
    const detectionResult = {
      image_url: `https://${bucket}.s3.amazonaws.com/${imageKey}`,
      detected_at: new Date().toISOString(),
      items: selectedIngredients,
    };

    // 現在の日付を取得してファイル名に使用
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
    const ingredientsKey = `public/ingredients/${userId}/${dateStr}_${timeStr}.json`;

    // 検出結果をS3に保存
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: ingredientsKey,
        Body: JSON.stringify(detectionResult, null, 2),
        ContentType: "application/json",
      })
    );

    // オブジェクトを公開するためのバケットポリシーを設定
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "PublicReadGetObject",
              Effect: "Allow",
              Principal: "*",
              Action: "s3:GetObject",
              Resource: `arn:aws:s3:::${bucket}/public/ingredients/*`,
            },
          ],
        }),
      })
    );
    */

    // RDSに接続
    let connection;
    try {
      // 環境変数の値をログ出力
      console.log("RDS connection parameters:", {
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        database: process.env.RDS_DATABASE,
        // パスワードは出力しない
      });

      console.log("Attempting to connect to RDS...");
      console.log("VPC Configuration:", {
        subnetIds: process.env.subnetIds,
        securityGroupIds: process.env.securityGroupIds,
      });

      // まずデータベースを指定せずに接続
      connection = await mysql.createConnection({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE || "myapp", // データベース名を直接指定
        connectTimeout: 30000,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        ssl: {
          rejectUnauthorized: true,
        },
      });

      console.log("Successfully connected to RDS");

      // データベースが存在しない場合は作成
      try {
        await connection.query(
          `CREATE DATABASE IF NOT EXISTS \`${
            process.env.RDS_DATABASE || "myapp"
          }\``
        );
        console.log("Database created or already exists");
      } catch (error) {
        console.error("Error creating database:", error);
        throw error;
      }

      // テーブルが存在しない場合は作成
      await connection.query(CREATE_TABLE_SQL);

      // 検出された食材をデータベースに保存
      for (const item of selectedIngredients) {
        const sql = `
          INSERT INTO fridge_contents (user_id, item_name, confidence, image_url)
          VALUES (?, ?, ?, ?)
        `;
        const imageUrl = `https://${bucket}.s3.amazonaws.com/${imageKey}`;
        try {
          await connection.execute(sql, [
            userId,
            item.item_name,
            item.confidence,
            imageUrl,
          ]);
          console.log(`Successfully inserted item: ${item.item_name}`);
        } catch (insertError) {
          console.error(`Error inserting item ${item.item_name}:`, insertError);
          throw insertError;
        }
      }

      await connection.end();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      if (connection) {
        await connection.end();
      }
      throw dbError;
    }

    console.log("Successfully processed items:", selectedIngredients);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully processed image and stored items",
        detectedItems: selectedIngredients,
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
