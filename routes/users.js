const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/user");

// Kullanıcı ekleme (POST /users/add)
router.post("/add", async (req, res) => {
  console.log("🟢 POST /users/add çalıştı!");

  try {
    const { name, surname, email, password } = req.body;
    console.log("🔹 Gelen veri:", req.body);

    // 📌 Email formatını kontrol et
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Geçersiz e-posta adresi! '@' eksik." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Bu e-posta adresi zaten kullanılıyor!" });
    }

    // 🔹 Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Hashlenmiş Şifre:", hashedPassword);

    // Yeni kullanıcı oluştur
    const newUser = await User.create({ 
      name, 
      surname, 
      email, 
      password: hashedPassword  
    });

    console.log("✅ Kullanıcı eklendi:", newUser);
    res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu!", user: newUser });
  } catch (error) {
    console.error("❌ Hata:", error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
