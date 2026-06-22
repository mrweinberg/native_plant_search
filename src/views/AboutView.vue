<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="about">
    <RouterLink to="/" class="back">← Back to plants</RouterLink>
    <h1>About</h1>

    <h2>Why make Bedfellow?</h2>
    <p>
      Hey, I'm Max. This year, me and my wife decided to take the plunge on taking our gardens
      back after years of neglect. After much education and planning, we found that we really
      wanted to follow the native plant ethos when growing our garden. My wife, especially, took
      to it.
    </p>
    <p>
      When looking over her shoulder, browsing the many resources to find plants native to your
      area, I noticed that what they had in authority, they lacked in tooling. They were built by
      people who knew plants, more than anything.
    </p>
    <p>
      I don't know plants; I know software. So I felt like I could build a tool to help plan our
      garden, one that lets you figure out bloom cycles, light requirements, and especially finding
      those that are great to eat or decorate with. Using the volumes of public information to
      validate and fill out the data, I am hoping that Bedfellow is a helpful tool for us and others
      to plan their perfect garden that blooms all season long.
    </p>
    <p>
      It's still a very young app, just over a week old as I write this, but it's getting
      significantly better by the day. It's already helping us fill out our gardening plans and I
      hope it'll help you, too!
    </p>

    <h2>Why native plants?</h2>
    <p>
      When you go to a garden center, you'll find many beautiful plants to decorate your outdoor
      spaces. Vivid tropicals and exotics are common, meant to attract the eye, but those plants may
      be out of sync with your ecosystem. They may support wonderful birds and butterflies, but they
      don't support <em>your</em> birds and butterflies.
    </p>
    <p>
      Native plants keep you engaged with your ecosystem. Because they're from your area, they grow
      more naturally, but they also support the local wildlife as food, places to nest, and sources
      to pollinate.
    </p>
    <p>
      In our ecosystem, different living beings need each other. You can support beautiful birds and
      little caterpillars with just some care. A few favorites from the catalog:
    </p>
    <ul class="examples">
      <li>
        <RouterLink :to="{ name: 'detail', params: { id: 'asclepias-tuberosa' } }">Butterfly Weed</RouterLink>
        and its fellow milkweeds are the only plants monarch caterpillars can eat — no milkweed, no
        monarchs.
      </li>
      <li>
        <RouterLink :to="{ name: 'detail', params: { id: 'lobelia-cardinalis' } }">Cardinal Flower</RouterLink>
        holds out scarlet tubes shaped for the long bills of ruby-throated hummingbirds.
      </li>
      <li>
        A single
        <RouterLink :to="{ name: 'detail', params: { id: 'quercus-alba' } }">White Oak</RouterLink>
        can host hundreds of kinds of caterpillars — the protein that feeds baby chickadees and
        other songbirds.
      </li>
    </ul>
    <p>
      Native plants are also far more likely to play nicely. They are made for your environment, so
      they are far less likely to spread wildly and become a lasting problem.
    </p>
  </div>
</template>

<style scoped>
.about { max-width: 760px; margin: 0 auto; }
.back { font-size: 13px; display: inline-block; margin-bottom: 12px; }
h1 { margin: 0 0 16px; font-size: 24px; }
h2 { margin: 28px 0 10px; font-size: 19px; }
p { color: var(--ink-soft); line-height: 1.7; margin: 0 0 14px; }
.examples { color: var(--ink-soft); line-height: 1.7; margin: 0 0 14px; padding-left: 20px; }
.examples li { margin-bottom: 8px; }
.examples a { font-weight: 500; }
</style>
