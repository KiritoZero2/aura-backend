const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Falta MONGODB_URI en las variables de entorno (.env)');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      // Mongoose 8 ya no necesita useNewUrlParser/useUnifiedTopology,
      // pero dejamos timeouts razonables para fallar rápido si Mongo no está arriba.
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB conectado -> ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB desconectado');
  });
}

module.exports = connectDB;
