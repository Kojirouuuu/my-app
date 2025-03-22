const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const { follower_id, following_id, action } = JSON.parse(event.body);

    switch (action) {
      case "follow":
        await docClient.send(
          new PutCommand({
            TableName: "follows",
            Item: {
              follower_id,
              following_id,
              created_at: new Date().toISOString(),
            },
          })
        );
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Followed successfully" }),
        };

      case "unfollow":
        await docClient.send(
          new DeleteCommand({
            TableName: "follows",
            Key: {
              follower_id,
              following_id,
            },
          })
        );
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Unfollowed successfully" }),
        };

      case "checkFollow":
        const result = await docClient.send(
          new QueryCommand({
            TableName: "follows",
            KeyConditionExpression:
              "follower_id = :follower_id AND following_id = :following_id",
            ExpressionAttributeValues: {
              ":follower_id": follower_id,
              ":following_id": following_id,
            },
          })
        );
        return {
          statusCode: 200,
          body: JSON.stringify({ isFollowing: result.Items.length > 0 }),
        };

      case "getFollowing":
        const followingResult = await docClient.send(
          new QueryCommand({
            TableName: "follows",
            KeyConditionExpression: "follower_id = :follower_id",
            ExpressionAttributeValues: {
              ":follower_id": follower_id,
            },
          })
        );

        // フォローしているユーザーのプロフィール情報を取得
        const following = await Promise.all(
          followingResult.Items.map(async (item) => {
            const profileResult = await docClient.send(
              new QueryCommand({
                TableName: "profiles",
                KeyConditionExpression: "user_id = :user_id",
                ExpressionAttributeValues: {
                  ":user_id": item.following_id,
                },
              })
            );
            return {
              following_id: item.following_id,
              ...profileResult.Items[0],
            };
          })
        );

        return {
          statusCode: 200,
          body: JSON.stringify({ following }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid action" }),
        };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
