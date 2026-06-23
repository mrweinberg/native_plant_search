<script setup>
import { RouterLink } from 'vue-router'
// DRAFT scaffolding — placeholder legal text. Have an attorney review and
// finalize before relying on it, and update it to match what you actually
// collect (analytics, hosting logs, etc.).
</script>

<template>
  <div class="legal">
    <RouterLink to="/" class="back">← Back to plants</RouterLink>
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: [DATE]</p>

    <p>
      This Privacy Policy explains how Bedfellow (“we”) handles information when you use the website
      (the “Service”). We aim to collect as little as possible.
    </p>

    <h2>Information we store</h2>
    <p>
      Bedfellow has no accounts and no login. Your favorites and saved selections are stored locally
      in your browser (using local storage and the page URL); they stay on your device and are not
      sent to us. Clearing your browser data removes them.
    </p>

    <h2>Information collected automatically</h2>
    <p>
      Our hosting provider may automatically log standard technical information (such as IP address,
      browser type, and pages requested) to operate and secure the Service. [If you add analytics,
      describe the provider and what it collects here.]
    </p>

    <h2>Third-party content</h2>
    <p>
      Some plant photographs and data load from third-party services such as Wikimedia and
      iNaturalist. When your browser requests that content, those services may receive your IP
      address and request information under their own privacy policies. We do not control those
      services.
    </p>

    <h2>What we do not do</h2>
    <p>We do not sell your personal information, and we do not use it for advertising.</p>

    <h2>Children</h2>
    <p>
      The Service is not directed to children under 13, and we do not knowingly collect personal
      information from them.
    </p>

    <h2>Your choices</h2>
    <p>
      You can clear locally stored data at any time through your browser settings. Depending on where
      you live, you may have additional rights regarding your personal information.
    </p>

    <h2>Changes</h2>
    <p>We may update this Policy from time to time; the “last updated” date will reflect changes.</p>

    <h2>Contact</h2>
    <p>Questions about this Policy: [CONTACT EMAIL].</p>
  </div>
</template>

<style scoped>
.legal { max-width: 760px; margin: 0 auto; }
.back { font-size: 13px; display: inline-block; margin-bottom: 12px; }
h1 { margin: 0 0 4px; font-size: 24px; }
h2 { margin: 24px 0 8px; font-size: 18px; }
.updated { color: var(--ink-soft); font-size: 13px; margin: 0 0 20px; }
p, li { color: var(--ink-soft); line-height: 1.7; }
p { margin: 0 0 12px; }
</style>
