/* Amplify Params - DO NOT EDIT
	API_MYAPP_GRAPHQLAPIENDPOINTOUTPUT
	API_MYAPP_GRAPHQLAPIIDOUTPUT
	API_MYAPP_GRAPHQLAPIKEYOUTPUT
	AUTH_MYAPPBBA0A127_USERPOOLID
	ENV
	FUNCTION_S3TRIGGER0308ECA7_NAME
	REGION
	STORAGE_S38D7558C4_BUCKETNAME
Amplify Params - DO NOT EDIT */ /**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const mysql = require("mysql2/promise");

// SQL for creating user_profiles table if not exists
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cognito_user_id VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  bio TEXT,
  favorite_ingredients JSON,
  refrigerator_brand VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cognito_user_id (cognito_user_id)
)`;

exports.handler = async (event) => {
  // RDS の接続情報はハードコーディングするのではなく、環境変数や Secrets Manager を利用することが望ましいです
  const connectionConfig = {
    host: process.env.RDS_HOST, // RDS のエンドポイント
    user: process.env.RDS_USER, // RDS ユーザー名
    password: process.env.RDS_PASSWORD, // RDS パスワード
    database: process.env.RDS_DATABASE, // データベース名
  };

  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);

    // Ensure table exists
    await connection.execute(CREATE_TABLE_SQL);

    // イベントのタイプに基づいて処理を分岐
    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters && event.pathParameters.userId) {
          // Get user profile by Cognito user ID
          const [rows] = await connection.execute(
            "SELECT * FROM user_profiles WHERE cognito_user_id = ?",
            [event.pathParameters.userId]
          );
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(rows[0] || null),
          };
        }
        break;

      case "POST":
        if (event.body) {
          const profile = JSON.parse(event.body);

          // Insert or update user profile
          await connection.execute(
            `INSERT INTO user_profiles 
            (cognito_user_id, display_name, bio, favorite_ingredients, refrigerator_brand) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            display_name = VALUES(display_name),
            bio = VALUES(bio),
            favorite_ingredients = VALUES(favorite_ingredients),
            refrigerator_brand = VALUES(refrigerator_brand)`,
            [
              profile.userId,
              profile.displayName,
              profile.bio,
              JSON.stringify(profile.favoriteIngredients),
              profile.refrigeratorBrand,
            ]
          );
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              message: "Profile updated successfully",
              userId: profile.userId,
            }),
          };
        }
        break;

      case "DELETE":
        if (event.pathParameters && event.pathParameters.userId) {
          // Delete user profile
          await connection.execute(
            "DELETE FROM user_profiles WHERE cognito_user_id = ?",
            [event.pathParameters.userId]
          );

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              message: "Profile deleted successfully",
              userId: event.pathParameters.userId,
            }),
          };
        }
        break;
    }

    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Invalid request" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
