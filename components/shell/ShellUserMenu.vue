<template>
  <SPopover label="Account" role="menu" header-menu-id="profile" panel-class="s-user-menu">
    <template #trigger="{ open, toggle }">
      <button
        type="button"
        class="s-avatar-btn"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-label="`Account menu for ${userName}`"
        @click.stop="toggle"
      >
        <SAvatar :src="avatarImageUrl">{{ userInitials }}</SAvatar>
      </button>
    </template>

    <template #default="{ close }">
      <div class="s-user-menu__head">
        <SAvatar :src="avatarImageUrl" size="lg">{{ userInitials }}</SAvatar>
        <div class="s-user-menu__id">
          <p class="s-user-menu__name">{{ userName }}</p>
          <p v-if="userEmail" class="s-user-menu__email">{{ userEmail }}</p>
          <p class="s-user-menu__tags">
            <SBadge>{{ roleLabel }}</SBadge>
            <SBadge v-if="planLabel">{{ planLabel }}</SBadge>
            <SBadge v-if="storeLabel">{{ storeLabel }}</SBadge>
          </p>
        </div>
      </div>

      <div class="s-popover__group">
        <NuxtLink
          v-for="link in [...accountLinks, ...supportLinks]"
          :key="link.to"
          :to="link.to"
          role="menuitem"
          class="s-menu-row"
          :class="{ 's-menu-row--active': isLinkActive(link.match) }"
          @click="close"
        >
          <component :is="link.icon" class="s-menu-row__icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
          <span class="s-menu-row__label">{{ link.label }}</span>
          <span v-if="link.badge && link.badge > 0" class="s-count">
            {{ link.badge > 9 ? '9+' : link.badge }}
          </span>
        </NuxtLink>
      </div>

      <div class="s-popover__group" role="group" :aria-labelledby="themeLabelId">
        <p :id="themeLabelId" class="s-popover__label">Appearance</p>
        <div class="s-tabs s-tabs--block s-user-menu__theme">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            role="menuitemradio"
            class="s-tabs__tab"
            :aria-checked="theme === option.value"
            @click="setTheme(option.value)"
          >
            <component :is="option.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="s-popover__foot">
        <button
          type="button"
          role="menuitem"
          class="s-menu-row s-menu-row--danger"
          @click="onSignOut(close)"
        >
          <LogOut class="s-menu-row__icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
          <span class="s-menu-row__label">Sign out</span>
        </button>
      </div>
    </template>
  </SPopover>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { LogOut, Monitor, Moon, Sun } from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SPopover from '~/components/s/SPopover.vue'
import { useAccountAvatar } from '~/composables/useAccountAvatar'
import { useAccountMenu } from '~/composables/useAccountMenu'
import { useTheme } from '~/composables/useTheme'

defineProps<{
  userName: string
  userEmail: string
  userInitials: string
}>()

const emit = defineEmits<{
  'sign-out': []
}>()

const { storeLabel, roleLabel, planLabel, accountLinks, supportLinks, isLinkActive } =
  useAccountMenu()
const { theme, setTheme } = useTheme()
const { avatarImageUrl } = useAccountAvatar()
const themeLabelId = useId()

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

function onSignOut(close: () => void) {
  close()
  emit('sign-out')
}
</script>
