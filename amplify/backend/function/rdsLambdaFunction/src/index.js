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
  const connectionConfig = {
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  };

  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    await connection.execute(CREATE_TABLE_SQL);

    // AppSyncからのGraphQLミューテーションの場合
    if (event.fieldName === "updateProfile") {
      const { input } = event.arguments;

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
          input.userId,
          input.displayName,
          input.bio,
          JSON.stringify(input.favoriteIngredients),
          input.refrigeratorBrand,
        ]
      );

      const [rows] = await connection.execute(
        "SELECT * FROM user_profiles WHERE cognito_user_id = ?",
        [input.userId]
      );

      if (rows[0]) {
        return {
          id: rows[0].id.toString(),
          cognito_user_id: rows[0].cognito_user_id,
          display_name: rows[0].display_name,
          bio: rows[0].bio,
          favorite_ingredients: JSON.parse(
            rows[0].favorite_ingredients || "[]"
          ),
          refrigerator_brand: rows[0].refrigerator_brand,
          created_at: rows[0].created_at,
          updated_at: rows[0].updated_at,
        };
      }
      throw new Error("Profile not found");
    }

    // REST APIの場合
    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters && event.pathParameters.userId) {
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

          const [rows] = await connection.execute(
            "SELECT * FROM user_profiles WHERE cognito_user_id = ?",
            [profile.userId]
          );

          if (rows[0]) {
            return {
              statusCode: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
              body: JSON.stringify({
                id: rows[0].id.toString(),
                cognito_user_id: rows[0].cognito_user_id,
                display_name: rows[0].display_name,
                bio: rows[0].bio,
                favorite_ingredients: JSON.parse(
                  rows[0].favorite_ingredients || "[]"
                ),
                refrigerator_brand: rows[0].refrigerator_brand,
                created_at: rows[0].created_at,
                updated_at: rows[0].updated_at,
              }),
            };
          }
          return {
            statusCode: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Profile not found" }),
          };
        }
        break;

      case "DELETE":
        if (event.pathParameters && event.pathParameters.userId) {
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
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
