const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/user");

// Kullanıcı kayıt servisi (POST /users/signup)
router.post("/signup", async (req, res) => {
  console.log("🟢 Yeni Signup İsteği Geldi:", req.body);

  const { name, surname, email, password, confirmPassword } = req.body;

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


// Kullanıcı Giriş Servisi (POST /users/login)
router.post("/login", async (req, res) => {
  console.log("🟢 Login İsteği Geldi:", req.body);

  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "E-posta ve şifre gereklidir!" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Kullanıcı bulunamadı!" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Geçersiz şifre!" });
    }

    // Başarıyla giriş yapıldığında kullanıcıya başarı mesajı dönüyoruz
    res.status(200).json({ message: "Giriş başarılı!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
