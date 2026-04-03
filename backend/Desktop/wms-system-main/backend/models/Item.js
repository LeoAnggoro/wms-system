const { DataTypes } = require("sequelize");
const { getSequelize } = require("../config/db");

const sequelize = getSequelize();
const User = require("./user");

const Item = sequelize.define("Item", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING
  },
  estimatedValue: {
    type: DataTypes.INTEGER
  },
  image: {
    type: DataTypes.STRING
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

Item.belongsTo(User, { foreignKey: "createdBy", as: "owner" });

module.exports = Item;
