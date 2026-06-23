<script setup>
import { RouterLink } from 'vue-router'
// DRAFT scaffolding — placeholder legal text. Have an attorney review and
// finalize before relying on it.
</script>

<template>
  <div class="legal">
    <RouterLink to="/" class="back">← Back to plants</RouterLink>
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: [DATE]</p>

    <p>
      Welcome to Bedfellow. By accessing or using this website (the “Service”), you agree to these
      Terms of Service. If you do not agree, please do not use the Service.
    </p>

    <h2>The service</h2>
    <p>
      Bedfellow is a free tool for searching North American native plants and planning a garden. The
      Service is provided for general informational and educational purposes only.
    </p>

    <h2>No professional advice</h2>
    <p>
      Plant information — including native range, growing conditions, bloom times, wildlife value,
      toxicity, edibility, and deer resistance — is compiled from public databases and editorial
      sources, is generated with AI assistance, and may contain errors. It is not horticultural,
      ecological, medical, or safety advice. Do not rely on it to determine whether a plant is safe
      to eat, plant, or handle. Verify independently before acting, especially regarding toxicity or
      edibility.
    </p>

    <h2>Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>scrape, crawl, harvest, or bulk-extract the catalog, data, or content;</li>
      <li>copy, reproduce, or redistribute the editorial content, selection, or arrangement of the
        catalog without permission;</li>
      <li>use the Service to build or train a competing dataset or product;</li>
      <li>interfere with, disrupt, or place undue load on the Service.</li>
    </ul>

    <h2>Intellectual property</h2>
    <p>
      “Bedfellow,” the Bedfellow logo, the site design, and the original editorial content,
      selection, arrangement, and rankings of the catalog are owned by Max Weinberg and protected by
      intellectual-property laws. Factual data (such as native range and host counts) comes from
      third parties. Photographs are owned by their respective authors and used under their
      individual licenses; see the
      <RouterLink :to="{ name: 'sources' }">Sources</RouterLink> page.
    </p>

    <h2>Disclaimer of warranties</h2>
    <p>
      The Service is provided “as is” and “as available,” without warranties of any kind, express or
      implied, including merchantability, fitness for a particular purpose, and non-infringement. We
      do not warrant that the Service or its data will be accurate, complete, or uninterrupted.
    </p>

    <h2>Limitation of liability</h2>
    <p>
      To the fullest extent permitted by law, Bedfellow and its operator will not be liable for any
      indirect, incidental, special, consequential, or punitive damages, or any loss arising from
      your use of (or inability to use) the Service or reliance on its content.
    </p>

    <h2>Changes</h2>
    <p>
      We may update these Terms from time to time. Continued use of the Service after changes take
      effect constitutes acceptance of the revised Terms.
    </p>

    <h2>Contact</h2>
    <p>Questions about these Terms: [CONTACT EMAIL].</p>
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
ul { color: var(--ink-soft); line-height: 1.7; margin: 0 0 12px; padding-left: 20px; }
li { margin-bottom: 6px; }
</style>
