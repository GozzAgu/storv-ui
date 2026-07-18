<template>
  <section
    id="demo"
    data-section-id="landing-demo"
    class="landing-demo scroll-animate scroll-animate-up"
    aria-labelledby="landing-demo-heading"
  >
    <div class="landing-demo__inner">
      <div class="landing-demo__copy">
        <p class="landing-label landing-label--blue">Demo-first</p>
        <h2 id="landing-demo-heading" class="landing-demo__title">
          Try the <span class="landing-demo__accent">real dashboard</span> (no signup)
        </h2>
        <p class="landing-demo__lede">
          Walk through inventory, receipts, multi-branch switching, and reports with sample store
          data. Everything stays in your browser. No account required.
        </p>
        <ul class="landing-demo__points">
          <li v-for="point in points" :key="point">{{ point }}</li>
        </ul>
        <div class="landing-demo__actions">
          <NuxtLink to="/demo/dashboard" class="landing-pill-cta landing-demo__cta">
            Open interactive demo
          </NuxtLink>
          <a :href="appUrl" class="landing-demo__secondary"
            >Ready to go live? Start free on Micro →</a
          >
        </div>
      </div>
      <div class="landing-demo__preview" aria-hidden="true">
        <div class="landing-demo__window">
          <div class="landing-demo__window-bar">
            <span /><span /><span />
            <span class="landing-demo__window-title">Demo mode</span>
          </div>
          <div class="landing-demo__window-body">
            <div class="landing-demo__stat">
              <span class="landing-demo__stat-label">Today</span>
              <span class="landing-demo__stat-value">₦25,000</span>
            </div>
            <div class="landing-demo__stat">
              <span class="landing-demo__stat-label">Stock value</span>
              <span class="landing-demo__stat-value">₦1.2M</span>
            </div>
            <div class="landing-demo__list">
              <div class="landing-demo__row">
                <span>iPhone 13 128GB</span>
                <span class="landing-demo__pill">4 left</span>
              </div>
              <div class="landing-demo__row">
                <span>Silicone phone case</span>
                <span class="landing-demo__pill landing-demo__pill--warn">Low</span>
              </div>
              <div class="landing-demo__row">
                <span>DEMO-1003 · Walk-in</span>
                <span>₦25,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  appUrl: string
}>()

const points = [
  'Three sample branches with realistic stock and sales',
  'Record sales, check low stock, browse receipts',
  'Multi-store sync and consolidated reports (Enterprise preview)',
  'Reset sample data anytime',
]
</script>

<style scoped>
.landing-demo {
  position: relative;
  padding: clamp(4rem, 9vw, 7rem) 1.25rem;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f8 100%);
}

.landing-demo__inner {
  display: grid;
  gap: 2.5rem;
  align-items: center;
  max-width: 72rem;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .landing-demo__inner {
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
}

.landing-demo .landing-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #143f8d;
}

.landing-demo__title {
  margin-top: 0.5rem;
  font-size: clamp(1.5rem, 3.2vw, 2.125rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.landing-demo__accent {
  color: #143f8d;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
}

.landing-demo__lede {
  margin-top: 0.75rem;
  max-width: 32rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #334155;
}

.landing-demo__points {
  margin-top: 1.25rem;
  display: grid;
  gap: 0.625rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #1e293b;
}

.landing-demo__points li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.landing-demo__points li::before {
  content: '✓';
  flex-shrink: 0;
  font-weight: 700;
  color: #143f8d;
}

.landing-demo__actions {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.landing-demo__cta {
  padding: 0.8125rem 1.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff !important;
  background: #143f8d !important;
  box-shadow: 0 4px 20px rgba(20, 63, 141, 0.25);
}

.landing-demo__cta:hover {
  background: #0f357a !important;
  color: #fff !important;
}

.landing-demo__secondary {
  font-size: 0.875rem;
  font-weight: 600;
  color: #143f8d;
}

.landing-demo__preview {
  display: flex;
  justify-content: center;
}

.landing-demo__window {
  width: min(100%, 22rem);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(20, 63, 141, 0.15);
  border: 1px solid rgba(20, 63, 141, 0.12);
  background: #fff;
}

.landing-demo__window-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  background: #f1f5f9;
  border-bottom: 1px solid rgba(20, 63, 141, 0.08);
}

.landing-demo__window-bar span:nth-child(-n + 3) {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: #cbd5e1;
}

.landing-demo__window-title {
  margin-left: auto;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #475569;
}

.landing-demo__window-body {
  padding: 1rem;
}

.landing-demo__stat {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9375rem;
  border-bottom: 1px solid #f1f5f9;
}

.landing-demo__stat-value {
  font-weight: 700;
  color: #143f8d;
}

.landing-demo__stat-label {
  color: #64748b;
}

.landing-demo__list {
  margin-top: 0.75rem;
  display: grid;
  gap: 0.5rem;
}

.landing-demo__row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9375rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: #f8fafc;
  color: #0f172a;
}

.landing-demo__pill {
  font-size: 0.9375rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
}

.landing-demo__pill--warn {
  background: #fffbeb;
  color: #b45309;
}
</style>
