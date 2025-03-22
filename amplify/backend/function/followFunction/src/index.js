const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

exports.handler = async (event) => {
  const { follower_id, following_id, action } = JSON.parse(event.body);

  try {
    const connection = await pool.getConnection();

    try {
      if (action === "follow") {
        const [result] = await connection.execute(
          "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
          [follower_id, following_id]
        );

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Successfully followed user",
            followId: result.insertId,
          }),
        };
      } else if (action === "unfollow") {
        await connection.execute(
          "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
          [follower_id, following_id]
        );

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Successfully unfollowed user",
          }),
        };
      } else if (action === "getFollowing") {
        const [rows] = await connection.execute(
          `SELECT f.following_id, p.display_name, p.bio, p.refrigerator_brand,
           (SELECT image_url FROM fridge_contents 
            WHERE user_id = f.following_id 
            ORDER BY created_at DESC LIMIT 1) as latest_fridge_image
           FROM follows f
           LEFT JOIN profiles p ON f.following_id = p.cognito_user_id
           WHERE f.follower_id = ?
           ORDER BY f.created_at DESC`,
          [follower_id]
        );

        return {
          statusCode: 200,
          body: JSON.stringify({
            following: rows,
          }),
        };
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing request",
        error: error.message,
      }),
    };
  }
};
