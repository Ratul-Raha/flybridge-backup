// Generates VAPID key pair for Web Push (Chrome notifications).
// Run: pnpm gen-vapid  → paste the pair into apps/web/.env.local
// as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY and set VAPID_SUBJECT to a mailto: address.
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("\nAdd these to apps/web/.env.local and production env, plus:");
console.log('VAPID_SUBJECT="mailto:you@example.com"');
