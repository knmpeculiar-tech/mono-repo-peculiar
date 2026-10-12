import { createApp } from "./app";
import { env } from "./config/env";
import { startKeepAlive } from "./jobs/keepAlive";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
  startKeepAlive(env.KEEP_ALIVE_HOURS);
});
