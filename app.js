const express = require("express");
const logger = require("morgan");
const cors = require("cors");

console.log("✅ Express başlatılıyor...");

// Route dosyasını çağırmadan önce kontrol edelim
const fs = require("fs");
if (!fs.existsSync("./routes/users.js")) {
  console.error("❌ ERROR: routes/users.js bulunamadı!");
} else {
  console.log("✅ routes/users.js bulundu.");
}

const usersRouter = require("./routes/users");  // Eğer hata alıyorsan, burada paylaş
console.log("✅ usersRouter import edildi.");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(cors());

console.log("✅ Middleware'ler yüklendi.");

// Kullanıcı API'si
app.use("/users", usersRouter);
console.log("✅ app.use('/users', usersRouter) tanımlandı.");

// Tüm route'ları listeleyelim
console.log("🟢 Express sunucusu başlatıldı. Yüklenen route'lar:");
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`➡️  ${r.route.path}`);
  }
});

module.exports = app;
