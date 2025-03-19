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
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const BUCKET_NAME = process.env.STORAGE_S38D7558C4_BUCKETNAME;

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
  try {
    // AppSyncからのGraphQLミューテーションの場合
    if (event.fieldName === "updateProfile") {
      const { input } = event.arguments;
      const profileData = {
        id: input.userId,
        cognito_user_id: input.userId,
        display_name: input.displayName,
        bio: input.bio,
        favorite_ingredients: input.favoriteIngredients,
        refrigerator_brand: input.refrigeratorBrand,
        updated_at: new Date().toISOString(),
      };

      // S3にプロフィールデータを保存
      await s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: `profiles/${input.userId}.json`,
          Body: JSON.stringify(profileData),
          ContentType: "application/json",
        })
        .promise();

      return profileData;
    }

    // REST APIの場合
    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters && event.pathParameters.userId) {
          try {
            const data = await s3
              .getObject({
                Bucket: BUCKET_NAME,
                Key: `profiles/${event.pathParameters.userId}.json`,
              })
              .promise();

            return {
              statusCode: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
              body: data.Body.toString(),
            };
          } catch (error) {
            if (error.code === "NoSuchKey") {
              return {
                statusCode: 404,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ error: "Profile not found" }),
              };
            }
            throw error;
          }
        }
        break;

      case "POST":
        if (event.body) {
          const profile = JSON.parse(event.body);
          const profileData = {
            id: profile.userId,
            cognito_user_id: profile.userId,
            display_name: profile.displayName,
            bio: profile.bio,
            favorite_ingredients: profile.favoriteIngredients,
            refrigerator_brand: profile.refrigeratorBrand,
            updated_at: new Date().toISOString(),
          };

          await s3
            .putObject({
              Bucket: BUCKET_NAME,
              Key: `profiles/${profile.userId}.json`,
              Body: JSON.stringify(profileData),
              ContentType: "application/json",
            })
            .promise();

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(profileData),
          };
        }
        break;

      case "DELETE":
        if (event.pathParameters && event.pathParameters.userId) {
          await s3
            .deleteObject({
              Bucket: BUCKET_NAME,
              Key: `profiles/${event.pathParameters.userId}.json`,
            })
            .promise();

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
  }
};
