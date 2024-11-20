const pool = require("./mysqlDBPool");
module.exports.checkIfUserExists = async (user_id, user_name) => {
  const [user_data] = await pool
    .promise()
    .query(`SELECT * FROM admin where id=? AND login=? AND status=1`, [
      user_id,
      user_name,
    ]);
  if (!user_data[0]) {
    return false;
  }
  return true;
};
