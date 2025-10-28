import "dotenv/config.js";
import { connectDB } from "./db.js";
import app from "./app.js";
import { startMqtt } from "./mqtt_Worker.js";

const PORT = process.env.PORT || 4000;

(async () => {
  await connectDB(process.env.MONGODB_URI);
  startMqtt(); // does nothing if MQTT envs are missing
  // console.log(process.env.MQTT_URL);
  
  app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
})();
