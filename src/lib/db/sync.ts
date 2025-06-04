import { sequelize } from './models';

async function sync() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

sync(); 