const { sequelize } = require('../models');

const syncDatabase = async () => {
  try {
    console.log('Syncing database with new schema...');
    
    // Force sync to recreate all tables with new schema
    await sequelize.sync({ force: true });
    
    console.log('Database synced successfully!');
    console.log('All tables created with enhanced schema.');
    
  } catch (error) {
    console.error('Error syncing database:', error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();
