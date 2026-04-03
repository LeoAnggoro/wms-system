const { Sequelize } = require("sequelize");

// Lazy load - only connect when actually used
let sequelize = null;

const getSequelize = () => {
  if (sequelize) return sequelize;
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  });
  
  return sequelize;
};

const syncDatabase = async () => {
  const sequelize = getSequelize();
  await sequelize.sync({ alter: true });
  return sequelize;
};

module.exports = { getSequelize, syncDatabase };
