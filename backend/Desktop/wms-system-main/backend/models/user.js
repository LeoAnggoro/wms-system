const { DataTypes } = require("sequelize");
const { getSequelize } = require("../config/db");

const sequelize = getSequelize();

const User = sequelize.define("User", {
  name: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM("admin", "staff"),
    defaultValue: "staff"
  }
});

module.exports = User;
