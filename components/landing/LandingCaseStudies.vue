<template>
  <section id="stories" class="landing-section">
    <div class="landing-container">
      <p class="landing-eyebrow">Shop story</p>
      <h2 class="landing-section__title">An early retailer, already seeing the difference</h2>
      <div class="landing-stories-grid">
        <article class="landing-story-card landing-story-card--featured">
          <p class="landing-story-card__shop">SmartPhoneHub</p>
          <p class="landing-story-card__location">Port Harcourt, NG</p>
          <p class="landing-story-card__note">
            One of our first retailers on Storvv - running phone and accessory sales through the
            app and telling us they're enjoying the switch.
          </p>
        </article>

        <article class="landing-story-card landing-story-card--invite">
          <p class="landing-story-card__shop">Want to be featured here?</p>
          <p class="landing-story-card__note">
            We're still early, and real shop stories matter more to us than polish. If Storvv is
            working for your store, tell us about it.
          </p>
          <a href="#contact" class="landing-story-card__link">Share your story →</a>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.landing-stories-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
  max-width: 48rem;
}
@media (min-width: 768px) {
  .landing-stories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.landing-story-card {
  border-radius: 1.5rem;
  border: 0;
  padding: 1.5rem;
  background: #fff;
}
.landing-story-card--invite {
  background: transparent;
  border: 1px dashed rgb(26 21 35 / 0.16);
}
.landing-story-card__shop {
  font-weight: 600;
  color: #1a1523;
}
.landing-story-card__location {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: rgb(26 21 35 / 0.55);
}
.landing-story-card__note {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: rgb(26 21 35 / 0.58);
}
.landing-story-card__link {
  display: inline-block;
  margin-top: 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1523;
}
html.dark .landing-story-card {
  background: #1e1e1e;
}
html.dark .landing-story-card--invite {
  background: transparent;
  border-color: rgb(255 255 255 / 0.14);
}
html.dark .landing-story-card__shop {
  color: #ffffff;
}
html.dark .landing-story-card__location,
html.dark .landing-story-card__note {
  color: rgb(255 255 255 / 0.62);
}
html.dark .landing-story-card__link {
  color: #ffffff;
}
</style>
