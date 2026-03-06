const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth");
const readline = require("readline");
const crypto = require("crypto");

chromium.use(stealth());

async function waitForOTP() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const heartbeat = setInterval(() => {
    console.log("Session alive... waiting for OTP input");
  }, 10000);

  return new Promise((resolve) => {
    rl.question("Enter OTP: ", (otp) => {
      clearInterval(heartbeat);
      rl.close();
      resolve(otp);
    });
  });
}

async function buildSignedPacket(data) {
  const merchantId = "MERCHANT_001";
  const timestamp = Date.now();
  const hash = crypto
    .createHash("sha256")
    .update(merchantId + timestamp + data)
    .digest("hex");

  return {
    merchantId,
    data,
    timestamp,
    hash,
  };
}

async function launchGhost() {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    proxy: {
      server: "31.59.20.176:6754",
      username: "ykfkgqhw",
      password: "5c4txnfzed3u",
    },
  });
  const page = await browser.newPage();
  await page.goto("https://bot.sannysoft.com");
  console.log("Routing through proxy:", "31.59.20.176:6754");
  const otp = await waitForOTP();
  console.log(`OTP received: ${otp}. Session continuing...`);

  const webdriverResult = await page.textContent("#webdriver-result");
  const packet = await buildSignedPacket(webdriverResult);
  console.log("SIGNED PACKET:", JSON.stringify(packet, null, 2));

  await page.screenshot({ path: "ghost-engine.png", fullPage: true });
  console.log("Screenshot saved.");

  await browser.close();
}

launchGhost();
