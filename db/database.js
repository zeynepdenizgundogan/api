require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB'ye başarıyla bağlandı!");
  } catch (error) {
    console.error("❌ MongoDB bağlantı hatası:", error);
    process.exit(1); // Hata olursa çık
  }
};

module.exports = connectDB;
