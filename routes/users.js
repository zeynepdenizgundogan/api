const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/user");

// Kullanıcı kayıt servisi (POST /users/signup)
router.post("/signup", async (req, res) => {
  console.log("🟢 Yeni Signup İsteği Geldi:", req.body);

  const { name, surname, email, password, confirmPassword } = req.body;

  console.log("📌 Backend'e Gelen Veriler:");
  console.log("Name:", name);
  console.log("Surname:", surname);
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Confirm Password:", confirmPassword);

  try {
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Geçersiz e-posta adresi! '@' eksik." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Şifreler uyuşmuyor!" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Bu e-posta adresi zaten kullanılıyor!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      surname,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu!", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
