import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

async function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function main(): Promise<void> {
  const kioskPage = read("apps/kiosk/src/app/kiosk/page.tsx");
  const welcomeScreen = read("apps/kiosk/src/app/features/welcome/WelcomeScreen.tsx");
  const scanner = read("apps/kiosk/src/app/features/qr-scanner/KioskScanner.tsx");
  const theme = read("apps/kiosk/src/styles/theme.css");

  await runTest("/kiosk owns the full viewport without fixed tablet dimensions", () => {
    assert(kioskPage.includes('position: "fixed"'), "Kiosk route must pin the entry screen to the viewport.");
    assert(kioskPage.includes('inset: 0'), "Kiosk route must cover the full viewport.");
    assert(kioskPage.includes('width: "100vw"'), "Kiosk route must use full viewport width.");
    assert(kioskPage.includes('height: "100svh"'), "Kiosk route must use safe viewport height.");
    assert(kioskPage.includes('overflow: "hidden"'), "Kiosk route must hide page-level overflow.");
    assert(!kioskPage.includes('width: "1080px"'), "Kiosk route must not use the old fixed width.");
    assert(!kioskPage.includes('height: "1920px"'), "Kiosk route must not use the old fixed height.");
  });

  await runTest("welcome surface is full green and centered", () => {
    assert(welcomeScreen.includes('background: "#0C3B27"'), "Welcome surface must use the full green background.");
    assert(welcomeScreen.includes('alignItems: "center"'), "Welcome content must be horizontally centered.");
    assert(welcomeScreen.includes('justifyContent: "center"'), "Welcome content must be vertically centered.");
    assert(welcomeScreen.includes("Tap to Begin"), "Welcome action must remain available.");
  });

  await runTest("scanner surface is full-screen, full-green, and centered", () => {
    assert(scanner.includes('position: "fixed"'), "Scanner must pin to the viewport.");
    assert(scanner.includes('width: "100vw"'), "Scanner must use full viewport width.");
    assert(scanner.includes('height: "100svh"'), "Scanner must use safe viewport height.");
    assert(scanner.includes('overflow: "hidden"'), "Scanner must hide page-level overflow.");
    assert(scanner.includes('background: "#0C3B27"'), "Scanner must use the full green background.");
    assert(scanner.includes('justifyContent: "center"'), "Scanner preview must be vertically centered.");
    assert(scanner.includes('id="reader"'), "Existing scanner reader element must remain present.");
  });

  await runTest("global kiosk app reset removes default browser gutters", () => {
    assert(theme.includes("html,\n  body"), "Theme must normalize html/body.");
    assert(theme.includes("margin: 0"), "Theme must remove default body margin gutters.");
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
