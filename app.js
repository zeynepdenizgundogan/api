const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const routesRouter = require('./routes/routes');
const preferencesRouter = require('./routes/preferences');


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
/*app.use(cors({
  origin: "http://localhost:8100", // 🔹 Ionic uygulamasının çalıştığı port
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));*/
app.use(cors());
app.use(logger("dev"));
app.use(express.json());


app.use('/api/preferences', preferencesRouter);
console.log("✅ app.use('/api/preferences', preferencesRouter) tanımlandı.");

app.use('/api/routes', routesRouter);
console.log("✅ app.use('/api/routes', routesRouter) tanımlandı.");


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

