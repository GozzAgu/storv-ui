<template>
  <div class="ds-root s-c s-page s-profile">
    <SPageHeader title="Profile" description="Your photo, business details, preferences, and security." />

    <div class="s-profile__layout">
      <aside class="s-profile__aside">
        <SCard class="s-profile__hero">
          <div class="s-profile__identity">
            <SAvatar :src="avatarImageUrl" :name="leftCardHeading" class="s-profile__avatar">
              {{ profileAvatarInitials }}
            </SAvatar>
            <div v-if="isLoadingProfile" class="s-profile__identity-text" aria-hidden="true">
              <SSkeleton width="40%" height="12px" />
              <SSkeleton width="70%" height="24px" />
              <SSkeleton width="55%" height="16px" />
            </div>
            <div v-else class="s-profile__identity-text">
              <p class="s-profile__eyebrow">{{ isStaff ? 'Team member' : 'Business' }}</p>
              <h2 class="s-profile__name">{{ leftCardHeading }}</h2>
              <p class="s-profile__email">{{ leftCardLine2 || EMPTY_CELL }}</p>
              <div class="s-profile__badges">
                <SBadge tone="accent" size="md">{{ roleBadgeLabel }}</SBadge>
                <SBadge v-if="leftCardBadgeExtra" size="md">{{ leftCardBadgeExtra }}</SBadge>
              </div>
            </div>
          </div>

          <div class="s-profile__controls">
            <div class="s-profile__actions">
              <SButton variant="primary" @click="openEditProfileModal">
                <template #leading><Pencil :size="16" :stroke-width="2" aria-hidden="true" /></template>
                Edit profile
              </SButton>
              <SButton
                :loading="isUploadingProfilePhoto"
                :disabled="isUploadingProfilePhoto"
                @click="profilePhotoInput?.click()"
              >
                <template #leading><Camera :size="16" :stroke-width="2" aria-hidden="true" /></template>
                {{ profilePhotoUrl ? 'Change photo' : 'Add photo' }}
              </SButton>
              <SButton v-if="profilePhotoUrl" variant="ghost" @click="removeProfilePhoto">
                Remove photo
              </SButton>
              <input
                ref="profilePhotoInput"
                type="file"
                accept="image/*"
                class="ds-sr-only"
                tabindex="-1"
                aria-hidden="true"
                @change="handleProfilePhotoUpload"
              />
            </div>
            <p class="s-profile__hint">Personal photo. Company logo lives in Settings.</p>
          </div>

          <dl class="s-metrics s-metrics--inline s-profile__stats">
            <div class="s-metrics__item">
              <dt class="s-metrics__label">Orders</dt>
              <dd class="s-metrics__value">
                <SSkeleton v-if="isLoadingStats" width="48px" height="24px" />
                <template v-else>{{ totalOrders }}</template>
              </dd>
            </div>
            <div class="s-metrics__item">
              <dt class="s-metrics__label">Products</dt>
              <dd class="s-metrics__value">
                <SSkeleton v-if="isLoadingStats" width="48px" height="24px" />
                <template v-else>{{ totalProducts }}</template>
              </dd>
            </div>
            <div class="s-metrics__item">
              <dt class="s-metrics__label">Customers</dt>
              <dd class="s-metrics__value">
                <SSkeleton v-if="isLoadingStats" width="48px" height="24px" />
                <template v-else>{{ totalCustomers }}</template>
              </dd>
            </div>
          </dl>
        </SCard>
      </aside>

      <div class="s-profile__main">
        <SCard
          :title="isStaff ? 'Staff profile' : 'Business profile'"
          :description="isStaff ? 'Your details as a team member' : 'Update your business contact information'"
        >
          <template #actions>
            <SButton size="sm" @click="openEditProfileModal">
              <template #leading><Pencil :size="16" :stroke-width="2" aria-hidden="true" /></template>
              Edit
            </SButton>
          </template>
          <SSkeleton v-if="isLoadingProfile" :lines="4" />
          <dl v-else class="s-settings__facts">
            <template v-if="!isStaff">
              <div class="s-settings__span">
                <dt>Business name</dt>
                <dd>{{ profileData.businessName || EMPTY_CELL }}</dd>
              </div>
            </template>
            <template v-else>
              <div>
                <dt>First name</dt>
                <dd>{{ profileData.firstName || EMPTY_CELL }}</dd>
              </div>
              <div>
                <dt>Last name</dt>
                <dd>{{ profileData.lastName || EMPTY_CELL }}</dd>
              </div>
            </template>
            <div>
              <dt>Email</dt>
              <dd class="s-profile__wrap">{{ profileData.email || EMPTY_CELL }}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{{ profileData.phone || EMPTY_CELL }}</dd>
            </div>
            <div class="s-settings__span">
              <dt>Bio</dt>
              <dd class="s-profile__wrap">{{ profileData.bio || EMPTY_CELL }}</dd>
            </div>
          </dl>
        </SCard>

        <SCard
          v-if="showBusinessProfilePanel"
          :title="isStaff ? 'Business profile' : 'Store information'"
          :description="isStaff ? 'Your assigned branch and department' : 'Branch details from onboarding.'"
        >
          <SSkeleton v-if="isLoadingProfile" :lines="isStaff ? 6 : 4" />
          <dl v-else-if="hasBusinessProfileContent" class="s-settings__facts">
            <template v-if="isStaff">
              <div v-if="businessProfileDisplay.departmentName">
                <dt>Department</dt>
                <dd>{{ businessProfileDisplay.departmentName }}</dd>
              </div>
              <div v-if="businessProfileDisplay.position">
                <dt>Position</dt>
                <dd>{{ businessProfileDisplay.position }}</dd>
              </div>
              <div v-if="businessProfileDisplay.staffRole">
                <dt>Team role</dt>
                <dd class="s-settings__capitalize">{{ businessProfileDisplay.staffRole }}</dd>
              </div>
            </template>
            <div v-if="businessProfileDisplay.storeName">
              <dt>Branch name</dt>
              <dd>{{ businessProfileDisplay.storeName }}</dd>
            </div>
            <div v-if="businessProfileDisplay.storeDescription">
              <dt>Business type</dt>
              <dd>{{ businessProfileDisplay.storeDescription }}</dd>
            </div>
            <div v-if="businessProfileDisplay.storeEmail">
              <dt>Store email</dt>
              <dd class="s-profile__wrap">{{ businessProfileDisplay.storeEmail }}</dd>
            </div>
            <div v-if="businessProfileDisplay.storePhone">
              <dt>Store phone</dt>
              <dd>{{ businessProfileDisplay.storePhone }}</dd>
            </div>
            <div v-if="businessProfileDisplay.storeAddress" class="s-settings__span">
              <dt>Address</dt>
              <dd class="s-profile__wrap">{{ businessProfileDisplay.storeAddress }}</dd>
            </div>
          </dl>
          <SEmptyState
            v-else
            :title="isStaff ? 'Your branch details are not available yet' : 'No store information available'"
            :description="isStaff ? 'Contact your administrator.' : undefined"
          >
            <template #icon><Store :size="24" :stroke-width="1.75" /></template>
            <template v-if="!isStaff" #actions>
              <SButton to="/dashboard/settings">Set up store information</SButton>
            </template>
          </SEmptyState>
          <template v-if="!isStaff && !isLoadingProfile && hasBusinessProfileContent" #footer>
            <SButton variant="ghost" size="sm" to="/dashboard/settings">
              Manage store settings
              <template #trailing><ChevronRight :size="16" :stroke-width="2" aria-hidden="true" /></template>
            </SButton>
          </template>
        </SCard>

        <SCard
          v-if="!isStaff && userStore.isSuperAdmin"
          title="Plan & billing"
          description="Your Storvv subscription."
          flush
          class="s-profile__list-card"
        >
          <ul class="s-list">
            <li>
              <NuxtLink
                to="/dashboard/settings#settings-subscription"
                class="s-list__item s-list__item--interactive s-profile__row"
              >
                <span class="s-list__lead"><CreditCard :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">Subscription & billing</span>
                  <span class="s-list__secondary">{{ subscriptionLabel }}</span>
                </span>
                <span class="s-list__action">Manage</span>
              </NuxtLink>
            </li>
          </ul>
        </SCard>

        <SCard
          v-if="!isStaff"
          title="Receipt terms & policies"
          description="Shown on printed and PDF receipts for your store."
        >
          <template #actions>
            <SButton size="sm" @click="openReceiptPoliciesModal">
              <template #leading><Pencil :size="16" :stroke-width="2" aria-hidden="true" /></template>
              Edit
            </SButton>
          </template>
          <dl class="s-settings__policy">
            <div>
              <dt>Sales terms & conditions</dt>
              <dd class="s-profile__wrap">{{ receiptPoliciesForm.salesTerms || 'Not set' }}</dd>
            </div>
            <div>
              <dt>Refund policy</dt>
              <dd class="s-profile__wrap">{{ receiptPoliciesForm.refundPolicy || 'Not set' }}</dd>
            </div>
            <div>
              <dt>Warranty policy</dt>
              <dd class="s-profile__wrap">{{ receiptPoliciesForm.warrantyPolicy || 'Not set' }}</dd>
            </div>
          </dl>
        </SCard>

        <SCard title="Roles & permissions" description="Your role and what you can access.">
          <template #actions>
            <SButton size="sm" @click="showRolesModal = true">View permissions</SButton>
          </template>
          <div class="s-profile__role">
            <span class="s-profile__mark" aria-hidden="true">
              <component :is="roleHeaderIcon" :size="16" :stroke-width="1.75" />
            </span>
            <div class="s-profile__role-text">
              <div class="s-profile__role-head">
                <p class="s-settings__row-label">{{ roleCardTitle }}</p>
                <SBadge v-if="roleBadgeLabel" tone="accent">{{ roleBadgeLabel }}</SBadge>
              </div>
              <p class="s-settings__row-hint">{{ roleCardDescription }}</p>
              <div v-if="roleMetaItems.length > 0" class="s-profile__badges">
                <SBadge v-for="meta in roleMetaItems" :key="meta.key" size="md">
                  <component :is="meta.icon" :size="14" :stroke-width="2" aria-hidden="true" />
                  {{ meta.text }}
                </SBadge>
              </div>
            </div>
          </div>
        </SCard>

        <SCard
          title="Preferences"
          description="Theme, language, region, currency, and timezone."
          flush
          class="s-profile__list-card"
        >
          <ul class="s-list">
            <li v-for="pref in preferenceRows" :key="pref.key">
              <button
                type="button"
                class="s-list__item s-list__item--interactive s-profile__row"
                aria-haspopup="dialog"
                @click="pref.action"
              >
                <span class="s-list__lead"><component :is="pref.icon" :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">{{ pref.label }}</span>
                  <span class="s-list__secondary">{{ pref.value }}</span>
                </span>
                <span class="s-list__action">Change</span>
              </button>
            </li>
          </ul>
        </SCard>

        <SCard
          title="Notifications"
          description="How Storvv lets you know about activity."
          flush
          class="s-profile__list-card"
        >
          <ul class="s-list">
            <li>
              <button
                type="button"
                class="s-list__item s-list__item--interactive s-profile__row"
                aria-haspopup="dialog"
                @click="showNotificationsModal = true"
              >
                <span class="s-list__lead"><Bell :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">Notification channels</span>
                  <span class="s-list__secondary">{{ accountSettings.notifications }}</span>
                </span>
                <span class="s-list__action">Manage</span>
              </button>
            </li>
          </ul>
        </SCard>

        <SCard
          title="Security"
          description="Password, two-factor auth, and active sessions."
          flush
          class="s-profile__list-card"
        >
          <ul class="s-list">
            <li>
              <button
                type="button"
                class="s-list__item s-list__item--interactive s-profile__row"
                aria-haspopup="dialog"
                @click="showPasswordModal = true"
              >
                <span class="s-list__lead"><KeyRound :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">Password</span>
                  <span class="s-list__secondary">Update your sign-in password</span>
                </span>
                <span class="s-list__action">Change</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="s-list__item s-list__item--interactive s-profile__row"
                aria-haspopup="dialog"
                @click="handle2FAToggle"
              >
                <span class="s-list__lead"><ShieldCheck :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">Two-factor authentication</span>
                  <span class="s-list__secondary">{{ securitySettings.twoFactor ? 'Enabled' : 'Not enabled' }}</span>
                </span>
                <span class="s-list__action" :class="{ 's-profile__action--danger': securitySettings.twoFactor }">
                  {{ securitySettings.twoFactor ? 'Disable' : 'Enable' }}
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="s-list__item s-list__item--interactive s-profile__row"
                aria-haspopup="dialog"
                @click="showSessionsModal = true"
              >
                <span class="s-list__lead"><Smartphone :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">Active sessions</span>
                  <span class="s-list__secondary">{{ securitySettings.activeSessions }} devices</span>
                </span>
                <span class="s-list__action">View all</span>
              </button>
            </li>
          </ul>
        </SCard>

        <SCard
          title="Help & onboarding"
          description="Replay the tour, open help, or ask the assistant."
          flush
          class="s-profile__list-card"
        >
          <ul class="s-list">
            <li>
              <button
                type="button"
                class="s-list__item s-list__item--interactive s-profile__row"
                :disabled="isReplayingTour"
                @click="replayDashboardTour"
              >
                <span class="s-list__lead"><Sparkles :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">Dashboard tour</span>
                  <span class="s-list__secondary">Walk through navigation and key screens again.</span>
                </span>
                <span class="s-list__action">{{ isReplayingTour ? 'Starting…' : 'Replay' }}</span>
              </button>
            </li>
            <li>
              <NuxtLink to="/dashboard/help" class="s-list__item s-list__item--interactive s-profile__row">
                <span class="s-list__lead"><Info :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">Help center</span>
                  <span class="s-list__secondary">Permissions, workflows, and plan limits.</span>
                </span>
                <span class="s-list__action">Open</span>
              </NuxtLink>
            </li>
            <li v-if="assistantEnabled">
              <button
                type="button"
                class="s-list__item s-list__item--interactive s-profile__row"
                @click="openAssistant()"
              >
                <span class="s-list__lead"><MessageCircle :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
                <span class="s-list__main">
                  <span class="s-list__primary">Ask assistant</span>
                  <span class="s-list__secondary">Get answers about Storvv features in plain language.</span>
                </span>
                <span class="s-list__action">Ask</span>
              </button>
            </li>
          </ul>
        </SCard>
      </div>
    </div>
  </div>

  <SDialog
    v-model:open="showEditProfileModal"
    :title="isStaff ? 'Staff profile' : 'Business profile'"
    size="lg"
    @update:open="(open: boolean) => !open && cancelEditing('personal')"
  >
    <form id="profile-edit-form" class="s-form" @submit.prevent="savePersonalInfoAndCloseModal">
      <template v-if="!isStaff">
        <SInput
          v-model="profileData.businessName"
          label="Business name"
          :disabled="!isEditingPersonalInfo"
          placeholder="Your business or store name"
        />
        <div class="s-form-pair">
          <SInput
            v-model="profileData.email"
            type="email"
            label="Email"
            autocomplete="email"
            :disabled="!isEditingPersonalInfo"
            placeholder="Enter email"
          />
          <SInput
            v-model="profileData.phone"
            type="tel"
            label="Phone"
            autocomplete="tel"
            :disabled="!isEditingPersonalInfo"
            placeholder="Business phone"
          />
        </div>
        <STextarea
          v-model="profileData.bio"
          label="Bio"
          :rows="3"
          :disabled="!isEditingPersonalInfo"
          placeholder="Tell customers about your business"
        />
      </template>
      <template v-else>
        <div class="s-form-pair">
          <SInput
            v-model="profileData.firstName"
            label="First name"
            autocomplete="given-name"
            :disabled="!isEditingPersonalInfo"
            placeholder="First name"
          />
          <SInput
            v-model="profileData.lastName"
            label="Last name"
            autocomplete="family-name"
            :disabled="!isEditingPersonalInfo"
            placeholder="Last name"
          />
        </div>
        <div class="s-form-pair">
          <SInput
            v-model="profileData.email"
            type="email"
            label="Email"
            autocomplete="email"
            :disabled="!isEditingPersonalInfo"
            placeholder="Work email"
          />
          <SInput
            v-model="profileData.phone"
            type="tel"
            label="Phone"
            autocomplete="tel"
            :disabled="!isEditingPersonalInfo"
            placeholder="Phone"
          />
        </div>
        <STextarea
          v-model="profileData.bio"
          label="Bio"
          :rows="3"
          :disabled="!isEditingPersonalInfo"
          placeholder="Optional note"
        />
      </template>
    </form>
    <template #footer>
      <SButton @click="cancelEditProfileModal">Cancel</SButton>
      <SButton variant="primary" type="submit" form="profile-edit-form">Save</SButton>
    </template>
  </SDialog>

  <SDialog
    v-model:open="showReceiptPoliciesModal"
    title="Receipt terms & policies"
    description="Shown on printed and PDF receipts for your store."
    size="lg"
    @update:open="(open: boolean) => !open && cancelEditingReceiptPolicies()"
  >
    <form id="profile-receipt-form" class="s-form" @submit.prevent="saveReceiptPoliciesAndCloseModal">
      <STextarea
        v-model="receiptPoliciesForm.salesTerms"
        label="Sales terms & conditions"
        :rows="4"
        :disabled="!isEditingReceiptPolicies"
        placeholder="e.g. All sales are final unless otherwise stated…"
      />
      <STextarea
        v-model="receiptPoliciesForm.refundPolicy"
        label="Refund policy"
        :rows="4"
        :disabled="!isEditingReceiptPolicies"
        placeholder="e.g. Refunds within 7 days with receipt…"
      />
      <STextarea
        v-model="receiptPoliciesForm.warrantyPolicy"
        label="Warranty policy"
        :rows="4"
        :disabled="!isEditingReceiptPolicies"
        placeholder="e.g. Manufacturer warranty applies…"
      />
    </form>
    <template #footer>
      <SButton @click="cancelReceiptPoliciesModal">Cancel</SButton>
      <SButton variant="primary" type="submit" form="profile-receipt-form">Save</SButton>
    </template>
  </SDialog>

  <SDialog v-model:open="showRolesModal" title="Roles & permissions" :description="roleCardTitle" size="lg">
    <div class="s-form">
      <p v-if="userPermissions.length === 0" class="s-list__empty">Loading your access list…</p>
      <div v-else class="s-profile-perms">
        <section v-for="group in permissionGroups" :key="group.id" class="s-profile-perms__group">
          <h3 v-if="permissionGroups.length > 1" class="s-profile-perms__label">
            <component :is="group.icon" :size="14" :stroke-width="2" aria-hidden="true" />
            {{ group.label }}
          </h3>
          <ul class="s-profile-perms__list">
            <li v-for="item in group.items" :key="item.id" class="s-profile-perms__item">
              <Check class="s-profile-perms__check" :size="16" :stroke-width="2.5" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </section>
      </div>
      <p class="s-callout s-profile-perms__note">
        <Info :size="16" :stroke-width="2" aria-hidden="true" />
        <span>
          <template v-if="isStaff">
            Contact your super admin in Settings if you need a different role or department.
          </template>
          <template v-else>
            Manage team access under Settings → Departments and staff.
          </template>
        </span>
      </p>
    </div>
    <template #footer>
      <SButton @click="showRolesModal = false">Close</SButton>
    </template>
  </SDialog>

  <SDialog v-model:open="showThemeModal" title="Change theme" description="Select your preferred theme" size="md">
    <div class="s-pick">
      <div class="s-pick__scroll" role="radiogroup" aria-label="Theme">
        <button
          v-for="themeOption in themeOptions"
          :key="themeOption.value"
          type="button"
          role="radio"
          class="s-pick__row"
          :class="{ 's-pick__row--selected': currentThemeValue === themeOption.value }"
          :aria-checked="currentThemeValue === themeOption.value"
          @click="selectTheme(themeOption.value as 'light' | 'dark' | 'system')"
        >
          <span class="s-profile-pick__text">
            <span class="s-pick__title">{{ themeOption.label }}</span>
            <span class="s-pick__meta">{{ themeOption.description }}</span>
          </span>
          <Check
            v-if="currentThemeValue === themeOption.value"
            class="s-profile-pick__check"
            :size="16"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
    <template #footer>
      <SButton @click="showThemeModal = false">Close</SButton>
    </template>
  </SDialog>

  <SDialog v-model:open="showLanguageModal" title="Change language" description="Select your preferred language" size="md">
    <div class="s-pick">
      <div class="s-pick__scroll" role="radiogroup" aria-label="Language">
        <button
          v-for="lang in languages"
          :key="lang.code"
          type="button"
          role="radio"
          class="s-pick__row"
          :class="{ 's-pick__row--selected': accountSettings.language === lang.name }"
          :aria-checked="accountSettings.language === lang.name"
          @click="selectLanguage(lang.code, lang.name)"
        >
          <span class="s-profile-pick__text">
            <span class="s-pick__title">{{ lang.name }}</span>
            <span class="s-pick__meta">{{ lang.nativeName }}</span>
          </span>
          <Check
            v-if="accountSettings.language === lang.name"
            class="s-profile-pick__check"
            :size="16"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
    <template #footer>
      <SButton @click="showLanguageModal = false">Close</SButton>
    </template>
  </SDialog>

  <SDialog v-model:open="showNotificationsModal" title="Notification preferences" size="lg">
    <div class="s-settings__rows">
      <div class="s-settings__row">
        <SCheckbox
          v-model="notificationSettings.email"
          variant="switch"
          label="Email notifications"
          description="Receive notifications via email"
        />
      </div>
      <div class="s-settings__row">
        <SCheckbox
          v-model="notificationSettings.push"
          variant="switch"
          label="Push notifications"
          description="Receive push notifications in browser"
          @change="handlePushNotificationToggle"
        />
      </div>
      <div class="s-settings__row">
        <SCheckbox
          v-model="notificationSettings.sms"
          variant="switch"
          label="SMS notifications"
          description="Receive notifications via SMS"
        />
      </div>
      <div class="s-settings__row">
        <SCheckbox
          v-model="notificationSettings.inApp"
          variant="switch"
          label="In-app notifications"
          description="Show notifications within the app"
        />
      </div>
    </div>
    <template #footer>
      <SButton @click="showNotificationsModal = false">Cancel</SButton>
      <SButton variant="primary" @click="saveNotificationSettings">Save changes</SButton>
    </template>
  </SDialog>

  <SDialog
    v-model:open="showPasswordModal"
    title="Change password"
    description="Enter your current password and choose a new one"
    size="md"
  >
    <form id="profile-password-form" class="s-form" @submit.prevent="handlePasswordChange">
      <SInput
        v-model="passwordForm.currentPassword"
        type="password"
        label="Current password"
        autocomplete="current-password"
        placeholder="Enter current password"
      />
      <div>
        <SInput
          v-model="passwordForm.newPassword"
          type="password"
          label="New password"
          :minlength="PASSWORD_MIN_LENGTH"
          autocomplete="new-password"
          placeholder="At least 12 characters, number and capital letter"
          :hint="`At least ${PASSWORD_MIN_LENGTH} characters, one number, one uppercase letter.`"
        />
        <ul
          v-if="passwordForm.newPassword.length > 0"
          class="s-profile-rules"
          aria-label="Password requirements"
        >
          <li
            v-for="rule in passwordRuleChecks"
            :key="rule.id"
            class="s-profile-rules__item"
            :class="{ 's-profile-rules__item--ok': rule.ok }"
          >
            <Check v-if="rule.ok" :size="14" :stroke-width="2.5" aria-hidden="true" />
            <Circle v-else :size="14" :stroke-width="2" aria-hidden="true" />
            <span>{{ rule.label }}</span>
          </li>
        </ul>
      </div>
      <SInput
        v-model="passwordForm.confirmPassword"
        type="password"
        label="Confirm new password"
        autocomplete="new-password"
        placeholder="Confirm new password"
        :error="
          passwordForm.newPassword &&
          passwordForm.confirmPassword &&
          passwordForm.newPassword !== passwordForm.confirmPassword
            ? 'Passwords do not match'
            : undefined
        "
      />
      <p v-if="passwordError" class="s-profile-error" role="alert">{{ passwordError }}</p>
    </form>
    <template #footer>
      <SButton
        @click="
          () => {
            showPasswordModal = false
            resetPasswordForm()
          }
        "
      >
        Cancel
      </SButton>
      <SButton
        variant="primary"
        type="submit"
        form="profile-password-form"
        :loading="isChangingPassword"
        :disabled="
          isChangingPassword ||
          !passwordForm.currentPassword ||
          !passwordForm.newPassword ||
          passwordForm.newPassword !== passwordForm.confirmPassword ||
          !isPasswordPolicyValid(passwordForm.newPassword)
        "
      >
        Change password
      </SButton>
    </template>
  </SDialog>

  <SDialog
    v-model:open="showSessionsModal"
    title="Active sessions"
    description="Manage devices where you're currently signed in"
    size="lg"
  >
    <ul v-if="isLoadingSessions" class="s-list" aria-label="Loading sessions">
      <li v-for="i in 3" :key="i" class="s-list__item s-profile-session" aria-hidden="true">
        <SSkeleton width="20px" height="20px" />
        <div class="s-list__main">
          <SSkeleton width="45%" height="14px" />
          <SSkeleton width="60%" height="12px" />
        </div>
        <SSkeleton width="64px" height="32px" />
      </li>
    </ul>
    <p v-else-if="activeSessions.length === 0" class="s-list__empty">No active sessions found</p>
    <ul v-else class="s-list" aria-label="Signed-in devices">
      <li v-for="(session, index) in activeSessions" :key="index" class="s-list__item s-profile-session">
        <span class="s-list__lead"><Smartphone :size="20" :stroke-width="1.75" aria-hidden="true" /></span>
        <span class="s-list__main">
          <span class="s-profile-session__head">
            <span class="s-list__primary">{{ session.device }}</span>
            <SBadge v-if="session.current" tone="accent">Current</SBadge>
          </span>
          <span class="s-list__secondary">{{ session.location }}</span>
          <span class="s-list__secondary">Last active: {{ formatDate(session.lastActive) }}</span>
        </span>
        <SButton v-if="!session.current" variant="ghost" size="sm" @click="revokeSession(index)">
          Revoke
        </SButton>
      </li>
    </ul>
    <template #footer>
      <SButton @click="showSessionsModal = false">Close</SButton>
      <SButton v-if="activeSessions.length > 1" variant="danger" @click="revokeAllSessions">
        Revoke all others
      </SButton>
    </template>
  </SDialog>

  <SDialog v-model:open="showRegionModal" title="Change region" description="Select your region" size="md">
    <div class="s-pick">
      <div class="s-pick__scroll" role="radiogroup" aria-label="Region">
        <button
          v-for="region in regions"
          :key="region.code"
          type="button"
          role="radio"
          class="s-pick__row"
          :class="{ 's-pick__row--selected': accountSettings.region === region.name }"
          :aria-checked="accountSettings.region === region.name"
          @click="selectRegion(region.code, region.name)"
        >
          <span class="s-profile-pick__flag" aria-hidden="true">{{ region.flag }}</span>
          <span class="s-profile-pick__text">
            <span class="s-pick__title">{{ region.name }}</span>
            <span class="s-pick__meta">{{ region.code }}</span>
          </span>
          <Check
            v-if="accountSettings.region === region.name"
            class="s-profile-pick__check"
            :size="16"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
    <template #footer>
      <SButton @click="showRegionModal = false">Close</SButton>
    </template>
  </SDialog>

  <SDialog v-model:open="showCurrencyModal" title="Change currency" description="Select your currency" size="md">
    <div class="s-pick">
      <div class="s-pick__scroll" role="radiogroup" aria-label="Currency">
        <button
          v-for="currency in currencies"
          :key="currency.code"
          type="button"
          role="radio"
          class="s-pick__row"
          :class="{ 's-pick__row--selected': accountSettings.currency === currency.code }"
          :aria-checked="accountSettings.currency === currency.code"
          @click="selectCurrency(currency.code, currency.name, currency.symbol)"
        >
          <span class="s-profile-pick__text">
            <span class="s-pick__title">{{ currency.name }}</span>
            <span class="s-pick__meta">{{ currency.symbol }} {{ currency.code }}</span>
          </span>
          <Check
            v-if="accountSettings.currency === currency.code"
            class="s-profile-pick__check"
            :size="16"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
    <template #footer>
      <SButton @click="showCurrencyModal = false">Close</SButton>
    </template>
  </SDialog>

  <SDialog v-model:open="showTimezoneModal" title="Change timezone" description="Select your timezone" size="md">
    <SSelect v-model="selectedTimezone" label="Timezone" :options="timezones" />
    <template #footer>
      <SButton @click="showTimezoneModal = false">Cancel</SButton>
      <SButton variant="primary" @click="saveTimezone">Save</SButton>
    </template>
  </SDialog>

  <TwoFactorSetup
    v-model="show2FASetupModal"
    @success="handle2FASetupSuccess"
    @error="handle2FAError"
  />

  <SDialog
    v-model:open="show2FADisableModal"
    title="Disable two-factor authentication"
    description="Enter your password and authenticator code to disable two-factor authentication."
    size="md"
  >
    <div class="s-form">
      <SInput
        v-model="disable2FAPassword"
        type="password"
        label="Password"
        autocomplete="current-password"
        placeholder="Enter your password"
        @keyup.enter="handleDisable2FA"
      />
      <SInput
        v-model="disable2FATotp"
        label="Authenticator code"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        class="s-otp-input"
        placeholder="6-digit code"
        @keyup.enter="handleDisable2FA"
      />
      <p v-if="disable2FAError" class="s-profile-error" role="alert">{{ disable2FAError }}</p>
    </div>
    <template #footer>
      <SButton
        @click="
          () => {
            show2FADisableModal = false
            disable2FAPassword = ''
            disable2FATotp = ''
            disable2FAError = ''
          }
        "
      >
        Cancel
      </SButton>
      <SButton
        variant="danger"
        :loading="isDisabling2FA"
        :disabled="isDisabling2FA || !disable2FAPassword || disable2FATotp.trim().length !== 6"
        @click="handleDisable2FA"
      >
        Disable 2FA
      </SButton>
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import { ref, reactive, watch, onMounted, computed } from 'vue'
import type { Component } from 'vue'
import {
  Bell,
  Camera,
  ChartColumn,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Coins,
  CreditCard,
  Eye,
  Globe,
  Info,
  KeyRound,
  Languages,
  MessageCircle,
  Package,
  Pencil,
  Receipt,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  SunMoon,
  Users,
} from '@lucide/vue'
import { useDashboardAssistant } from '~/composables/useDashboardAssistant'
import { useAccountAvatar } from '~/composables/useAccountAvatar'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser, type StoreDetails } from '~/composables/useUser'
import { useTheme } from '~/composables/useTheme'
import { usePreferences, currencies, regions } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomersStore } from '~/stores/customers'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { useStaffStore } from '~/stores/staff'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import type { Staff } from '~/composables/useStaff'
import {
  resolveStaffWorkspaceContext,
  applyWorkspaceToProfileStoreInfo,
  fillProfileStoreInfoFromStore,
  type StaffWorkspaceContext,
} from '~/composables/useStaffWorkspaceContext'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SInput from '~/components/s/SInput.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STextarea from '~/components/s/STextarea.vue'
import TwoFactorSetup from '~/components/auth/TwoFactorSetup.vue'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { SUBSCRIPTION_PLANS, resolveEffectiveSubscriptionPlan } from '~/types/subscription'
import { isCloudinaryUrl } from '~/utils/cloudinary'
import { prepareImageUpload } from '~/utils/image-upload'
import {
  BILLING_BLOCKED_USER_MESSAGE,
  extractUploadFailureMessage,
  isBillingDelinquentMessage,
} from '~/utils/storage-billing-errors'
import { isDemoModeActive } from '~/utils/demo-mode'
import {
  PASSWORD_MIN_LENGTH,
  getPasswordRuleChecks,
  isPasswordPolicyValid,
  getPasswordPolicyErrors,
} from '~/utils/passwordPolicy'

definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Profile - Storvv',
})

const showEditProfileModal = ref(false)
const showReceiptPoliciesModal = ref(false)
const showRolesModal = ref(false)

function openEditProfileModal() {
  enableEditing('personal')
  showEditProfileModal.value = true
}

function openReceiptPoliciesModal() {
  startEditingReceiptPolicies()
  showReceiptPoliciesModal.value = true
}

function cancelEditProfileModal() {
  cancelEditing('personal')
  showEditProfileModal.value = false
}

function cancelReceiptPoliciesModal() {
  cancelEditingReceiptPolicies()
  showReceiptPoliciesModal.value = false
}

async function savePersonalInfoAndCloseModal() {
  await savePersonalInfo()
  if (!isEditingPersonalInfo.value) {
    showEditProfileModal.value = false
  }
}

async function saveReceiptPoliciesAndCloseModal() {
  await saveReceiptPolicies()
  if (!isEditingReceiptPolicies.value) {
    showReceiptPoliciesModal.value = false
  }
}

// Profile data: super admin uses businessName (maps to user `name`); staff uses firstName/lastName for person
const profileData = reactive({
  businessName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  bio: '',
  role: '',
})

// Store information
const storeInfo = reactive({
  storeName: '',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  storeDescription: '',
})

// Backup for cancel
const backupData = reactive({ ...profileData })

/** Receipt policy text (Firestore: storeDetails.settings.receipt). Super admin only. */
const receiptPoliciesForm = reactive({
  salesTerms: '',
  refundPolicy: '',
  warrantyPolicy: '',
})
const backupReceiptPolicies = reactive({
  salesTerms: '',
  refundPolicy: '',
  warrantyPolicy: '',
})
const isEditingReceiptPolicies = ref(false)

// Edit state
const isEditingPersonalInfo = ref(false)
const isLoadingProfile = ref(true)
const isLoadingStats = ref(true)

// Get user data
const { currentUser, loading: authLoading } = useFirebaseAuth()
const { getUserDocument, updateUserDocument, resetTutorial } = useUser()
const authStore = useAuthStore()
const { openAssistant, enabled: assistantEnabled } = useDashboardAssistant()
const isReplayingTour = ref(false)
const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const customersStore = useCustomersStore()
const staffStore = useStaffStore()
const storesStore = useStoresStore()
const userStore = useUserStore()

const subscriptionLabel = computed(() => {
  const plan = resolveEffectiveSubscriptionPlan(userStore.userData)
  return SUBSCRIPTION_PLANS.find((p) => p.id === plan)?.name || 'Storvv Micro'
})

/** Resolved staff record for signed-in staff (department, store, etc.) */
const currentStaffMember = ref<Staff | null>(null)
const staffWorkspace = ref<StaffWorkspaceContext>({
  staff: null,
  store: null,
  storeName: '',
  storeEmail: '',
  storePhone: '',
  storeAddress: '',
  businessType: '',
  departmentName: '',
  departmentId: '',
  staffRole: '',
  position: '',
})

// Function to load profile data
const loadProfileData = async () => {
  if (!currentUser.value) {
    isLoadingProfile.value = false
    return
  }

  try {
    if (!userStore.userData) {
      await userStore.fetchUserData(currentUser.value.uid)
    }

    const userData = await getUserDocument(currentUser.value.uid)
    const accountRole = userStore.userData?.role || userData?.role || 'User'
    const staffAccount = accountRole === 'staff'

    currentStaffMember.value = null
    profileData.businessName = ''
    staffWorkspace.value = {
      staff: null,
      store: null,
      storeName: '',
      storeEmail: '',
      storePhone: '',
      storeAddress: '',
      businessType: '',
      departmentName: '',
      departmentId: '',
      staffRole: '',
      position: '',
    }

    if (userData || userStore.userData) {
      profileData.email =
        userStore.userData?.email || userData?.email || currentUser.value.email || ''
      profileData.role = accountRole

      if (staffAccount) {
        try {
          const sm = await staffStore.fetchCurrentStaffMember()
          currentStaffMember.value = sm
          if (sm) {
            profileData.firstName = sm.firstName || ''
            profileData.lastName = sm.lastName || ''
            profileData.email = sm.email || profileData.email
            profileData.phone = sm.phone || ''
          }
          const ctx = await resolveStaffWorkspaceContext()
          staffWorkspace.value = ctx
          if (!currentStaffMember.value && ctx.staff) {
            currentStaffMember.value = ctx.staff
          }
          applyWorkspaceToProfileStoreInfo(storeInfo, ctx)
          fillProfileStoreInfoFromStore(storeInfo, ctx.store || storesStore.currentStore)
        } catch (e) {
          console.warn('Could not load staff member profile:', e)
          profileData.firstName = currentUser.value.displayName?.split(' ')[0] || ''
          profileData.lastName = currentUser.value.displayName?.split(' ').slice(1).join(' ') || ''
          fillProfileStoreInfoFromStore(storeInfo, storesStore.currentStore)
        }
      } else if (userData) {
        profileData.businessName = (userData.name || '').trim()
        profileData.firstName = ''
        profileData.lastName = ''
      }

      // Load store details for super admin (staff uses assigned branch document)
      if (userData?.storeDetails && !staffAccount) {
        storeInfo.storeName = userData.storeDetails.storeName || ''
        storeInfo.storeAddress = userData.storeDetails.storeAddress || ''
        storeInfo.storePhone = userData.storeDetails.storePhone || ''
        storeInfo.storeEmail = userData.storeDetails.storeEmail || ''
        storeInfo.storeDescription = userData.storeDetails.storeDescription || ''
      }

      if (!staffAccount && userData?.storeDetails) {
        const r = userData.storeDetails.settings?.receipt
        receiptPoliciesForm.salesTerms = r?.salesTerms || ''
        receiptPoliciesForm.refundPolicy = r?.refundPolicy || ''
        receiptPoliciesForm.warrantyPolicy = r?.warrantyPolicy || ''
        Object.assign(backupReceiptPolicies, { ...receiptPoliciesForm })
      }

      if (staffAccount) {
        fillProfileStoreInfoFromStore(storeInfo, storesStore.currentStore)
      }

      // Load 2FA status from Firestore
      const twoFactorSource = userData || userStore.userData
      if (twoFactorSource?.twoFactorEnabled) {
        securitySettings.twoFactor = true
        if (import.meta.client) {
          localStorage.setItem('twoFactorEnabled', 'true')
        }
      }

      Object.assign(backupData, { ...profileData })
    } else {
      profileData.email = currentUser.value.email || ''
      profileData.firstName = currentUser.value.displayName?.split(' ')[0] || ''
      profileData.lastName = currentUser.value.displayName?.split(' ').slice(1).join(' ') || ''
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    if (currentUser.value?.email) {
      profileData.email = currentUser.value.email
    }
  } finally {
    isLoadingProfile.value = false
  }
}

// Computed properties for real stats
const totalOrders = computed(() => {
  return receiptsStore.totalReceipts || 0
})

const totalProducts = computed(() => {
  return inventoryStore.totalItems || 0
})

// Get unique customers from receipts (since customers store might not be used everywhere)
const totalCustomers = computed(() => {
  // Try to get from customers store first
  if (customersStore.customers.length > 0) {
    return customersStore.totalCustomers || 0
  }

  // Fallback: Count unique customers from receipts
  const customersMap = new Map<string, boolean>()
  receiptsStore.receipts.forEach((receipt) => {
    if (receipt.customerEmail) {
      customersMap.set(receipt.customerEmail, true)
    }
  })
  return customersMap.size
})

// Load stats data
const loadStatsData = async () => {
  if (!authStore.currentUser) {
    isLoadingStats.value = false
    return
  }

  isLoadingStats.value = true

  try {
    // Fetch data in parallel
    await Promise.all([
      receiptsStore.fetchReceipts(),
      inventoryStore.fetchFolders(),
      customersStore.fetchCustomers().catch(() => {
        // If customers store fetch fails, we'll use receipts-based calculation
        console.warn('Could not fetch customers, will use receipts-based count')
      }),
    ])
  } catch (error) {
    console.error('Error loading stats data:', error)
  } finally {
    isLoadingStats.value = false
  }
}

// Load profile and store information from Firestore + settings
onMounted(async () => {
  // Initialize preferences first
  await initPreferences()

  // Load stats data
  await loadStatsData()

  // Load preferences into accountSettings
  if (preferences.value) {
    const lang = languages.find((l) => l.code === preferences.value.language)
    accountSettings.language = lang?.name || 'English (US)'

    const region = regions.find((r) => r.code === preferences.value.region)
    accountSettings.region = region?.name || 'United States'

    const currency = currencies.find((c) => c.code === preferences.value.currency)
    accountSettings.currency = currency ? `${currency.code} (${currency.symbol})` : 'USD ($)'

    const tz = timezones.find((t) => t.value === preferences.value.timezone)
    accountSettings.timezone = tz?.label || 'UTC (GMT +0:00)'
    selectedTimezone.value = preferences.value.timezone || 'UTC'
  }

  if (import.meta.client) {
    // Load settings from localStorage
    // Load notification settings
    const savedNotifications = localStorage.getItem('notificationSettings')
    if (savedNotifications) {
      try {
        Object.assign(notificationSettings, JSON.parse(savedNotifications))
      } catch (e) {
        console.error('Error loading notification settings:', e)
      }
    }

    // Update notifications display
    const enabledTypes: string[] = []
    if (notificationSettings.email) enabledTypes.push('Email')
    if (notificationSettings.push) enabledTypes.push('Push')
    if (notificationSettings.sms) enabledTypes.push('SMS')
    if (notificationSettings.inApp) enabledTypes.push('In-App')
    accountSettings.notifications = enabledTypes.length > 0 ? enabledTypes.join(', ') : 'None'

    // Load 2FA status from localStorage (fallback)
    const saved2FA = localStorage.getItem('twoFactorEnabled')
    if (saved2FA !== null) {
      securitySettings.twoFactor = saved2FA === 'true'
    }

    // Update theme display
    accountSettings.theme =
      theme.value === 'system' ? 'Follow system' : theme.value === 'dark' ? 'Dark' : 'Light'
  }

  // Wait for auth to finish loading before loading profile data
  if (authLoading.value) {
    await new Promise((resolve) => {
      let resolved = false
      const unwatch = watch(authLoading, (val) => {
        if (!val && !resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      })

      // Timeout after 3 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      }, 3000)
    })
  }

  // Load profile data after auth is ready
  await loadProfileData()
})

// Watch for currentUser changes and reload profile data
watch(
  currentUser,
  async (newUser) => {
    if (newUser && !isLoadingProfile.value) {
      await loadProfileData()
    }
  },
  { immediate: false }
)

// Branch may load after profile fetch (staff store init); backfill business profile fields.
watch(
  () => storesStore.currentStore,
  (store) => {
    if (!isStaff.value || !store) return
    fillProfileStoreInfoFromStore(storeInfo, store)
  }
)

// Theme integration
const { theme, setTheme, actualTheme } = useTheme()

// Preferences integration
const { preferences, updatePreferences, initialize: initPreferences } = usePreferences()
const toast = useAppToast()

// Account settings
const accountSettings = reactive({
  language: 'English (US)',
  region: 'United States',
  currency: 'USD ($)',
  notifications: 'Email, Push, SMS',
  theme: 'Follow system',
  timezone: 'UTC (GMT +0:00)',
})

// Notification settings
const notificationSettings = reactive({
  email: true,
  push: false,
  sms: false,
  inApp: true,
})

// Password form
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref('')
const isChangingPassword = ref(false)

const passwordRuleChecks = computed(() => getPasswordRuleChecks(passwordForm.newPassword))

// Helper function to reset password form
const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordError.value = ''
}

// Security settings
const securitySettings = reactive({
  twoFactor: false,
  activeSessions: 3,
})

// Active sessions
const activeSessions = ref<
  Array<{ device: string; location: string; lastActive: string; current: boolean }>
>([])
const isLoadingSessions = ref(false)

// Timezone
const selectedTimezone = ref('UTC')
const timezones = [
  { value: 'UTC', label: 'UTC (GMT +0:00)' },
  { value: 'America/New_York', label: 'Eastern Time (GMT -5:00)' },
  { value: 'America/Chicago', label: 'Central Time (GMT -6:00)' },
  { value: 'America/Denver', label: 'Mountain Time (GMT -7:00)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (GMT -8:00)' },
  { value: 'Europe/London', label: 'London (GMT +0:00)' },
  { value: 'Europe/Paris', label: 'Paris (GMT +1:00)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT +4:00)' },
  { value: 'Asia/Kolkata', label: 'Mumbai (GMT +5:30)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (GMT +8:00)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT +9:00)' },
  { value: 'Africa/Lagos', label: 'Lagos (GMT +1:00)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (GMT +2:00)' },
]

// Languages
const languages = [
  { code: 'en', name: 'English (US)', nativeName: 'English' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
]

// Theme options
const themeOptions = [
  { value: 'light', label: 'Light', description: 'Light theme for daytime use' },
  { value: 'dark', label: 'Dark', description: 'Dark theme for nighttime use' },
  { value: 'system', label: 'Follow system', description: 'Automatically match your device theme' },
]

const currentThemeValue = computed(() => theme.value || 'system')

// Get permissions
const {
  isStaff,
  isManager,
  canManage,
  isReadOnly,
  canCreate,
  canEditReceipts,
  canDeleteReceipts,
  canManageInventoryItems,
  canCreateInventoryFolders,
  canCreateStaff,
} = usePermissions()

/** Left column heading: business name for owners, person name for staff. */
const leftCardHeading = computed(() => {
  if (isStaff.value) {
    const staffName = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ').trim()
    if (staffName) return staffName
    return profileData.email?.split('@')[0] || 'Staff'
  }
  return (
    profileData.businessName ||
    storeInfo.storeName ||
    userStore.userData?.storeDetails?.storeName ||
    profileData.email?.split('@')[0] ||
    'Your business'
  )
})

const leftCardLine2 = computed(() => {
  if (isStaff.value) {
    return profileData.email || storeInfo.storeEmail || '-'
  }
  return profileData.email || 'No email'
})

const showBusinessProfilePanel = computed(
  () => isLoadingProfile.value || !isStaff.value || isStaff.value
)

const businessProfileDisplay = computed(() => ({
  storeName:
    storeInfo.storeName || staffWorkspace.value.storeName || storesStore.currentStore?.name || '',
  storeEmail:
    storeInfo.storeEmail ||
    staffWorkspace.value.storeEmail ||
    storesStore.currentStore?.email ||
    '',
  storePhone:
    storeInfo.storePhone ||
    staffWorkspace.value.storePhone ||
    storesStore.currentStore?.phone ||
    '',
  storeAddress:
    storeInfo.storeAddress ||
    staffWorkspace.value.storeAddress ||
    storesStore.currentStore?.address ||
    '',
  storeDescription:
    storeInfo.storeDescription ||
    staffWorkspace.value.businessType ||
    storesStore.currentStore?.description ||
    '',
  departmentName:
    staffWorkspace.value.departmentName || currentStaffMember.value?.departmentName || '',
  position: staffWorkspace.value.position || '',
  staffRole: staffWorkspace.value.staffRole || '',
}))

const hasBusinessProfileContent = computed(() => {
  const d = businessProfileDisplay.value
  return Boolean(
    d.storeName ||
      d.storeEmail ||
      d.storePhone ||
      d.storeAddress ||
      d.storeDescription ||
      d.departmentName ||
      d.position ||
      d.staffRole
  )
})

const leftCardBadgeExtra = computed(() => {
  if (isStaff.value && currentStaffMember.value?.departmentName) {
    return currentStaffMember.value.departmentName
  }
  return ''
})

const profileAvatarInitials = computed(() => {
  const personalName = isStaff.value
    ? [profileData.firstName, profileData.lastName].filter(Boolean).join(' ').trim()
    : (userStore.userData?.name || '').trim()
  const raw =
    personalName ||
    (isStaff.value
      ? storeInfo.storeName || storesStore.currentStore?.name || profileData.email || 'U'
      : profileData.businessName || storeInfo.storeName || profileData.email || 'U')
  const s = String(raw).trim()
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? ''
    const b = parts[1]?.[0] ?? ''
    return (a + b).toUpperCase() || 'U'
  }
  return (s.slice(0, 2) || 'U').toUpperCase()
})

const profilePhotoInput = ref<HTMLInputElement | null>(null)
const isUploadingProfilePhoto = ref(false)
const profilePhotoUrl = computed(() => userStore.userData?.photoURL || '')
const { avatarImageUrl } = useAccountAvatar()
const { authFetch } = useAuthenticatedFetch()

function isFirebaseStorageUnknown(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'storage/unknown'
  )
}

async function uploadProfilePhotoWithFallback(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const cloudinary = useCloudinary()
  if (cloudinary.isConfigured.value) {
    const { url } = await cloudinary.uploadImage(file)
    return { url, path: '' }
  }

  const { uploadImage } = useFirebaseStorage()
  try {
    return await uploadImage(file, userId, { folder: 'profile' })
  } catch (err) {
    if (!isFirebaseStorageUnknown(err)) throw err
    const body = new FormData()
    body.append('file', file)
    try {
      return await authFetch<{ url: string; path: string }>('/api/storage/upload-profile-photo', {
        method: 'POST',
        body,
      })
    } catch (apiErr: unknown) {
      const serverHint = extractUploadFailureMessage(apiErr)
      if (isBillingDelinquentMessage(serverHint)) {
        throw new Error(BILLING_BLOCKED_USER_MESSAGE)
      }
      throw new Error(
        `Could not complete upload (${serverHint}). Please try again or contact Storvv support if this continues.`
      )
    }
  }
}

async function savePersonalPhotoURL(userId: string, photoURL: string) {
  if (isStaff.value) {
    await staffStore.updateOwnStaffPhoto(photoURL)
    if (currentStaffMember.value) {
      currentStaffMember.value = { ...currentStaffMember.value, photoURL }
    }
    return
  }
  await updateUserDocument(userId, { photoURL })
}

async function handleProfilePhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !authStore.currentUser) return

  isUploadingProfilePhoto.value = true
  input.value = ''

  try {
    const photo = await prepareImageUpload(file, { maxEdge: 512, name: 'avatar' })
    if (isDemoModeActive()) {
      const objectUrl = URL.createObjectURL(photo)
      const { applyDemoUserDocumentUpdate } = await import('~/utils/demo-bridge')
      applyDemoUserDocumentUpdate({ photoURL: objectUrl })
      toast.success('Profile photo updated')
      return
    }

    const userId = authStore.currentUser.uid
    const { url } = await uploadProfilePhotoWithFallback(photo, userId)
    await savePersonalPhotoURL(userId, url)
    userStore.$patch((state) => {
      if (state.userData) state.userData = { ...state.userData, photoURL: url }
    })
    toast.success('Profile photo updated')
  } catch (err: unknown) {
    if (import.meta.dev) console.error('[Profile photo upload]', err)
    const { getFirebaseStorageErrorMessage } = useFirebaseStorage()
    const msg = err instanceof Error ? err.message : getFirebaseStorageErrorMessage(err)
    toast.error(msg)
  } finally {
    isUploadingProfilePhoto.value = false
  }
}

async function removeProfilePhoto() {
  if (!authStore.currentUser) return
  const current = profilePhotoUrl.value
  try {
    if (isDemoModeActive()) {
      const { applyDemoUserDocumentUpdate } = await import('~/utils/demo-bridge')
      applyDemoUserDocumentUpdate({ photoURL: '' })
      toast.success('Profile photo removed')
      return
    }

    if (current && !isCloudinaryUrl(current) && !current.startsWith('blob:')) {
      const { deleteImageByUrl } = useFirebaseStorage()
      await deleteImageByUrl(current)
    }
    await savePersonalPhotoURL(authStore.currentUser.uid, '')
    userStore.$patch((state) => {
      if (state.userData) state.userData = { ...state.userData, photoURL: '' }
    })
    toast.success('Profile photo removed')
  } catch (err: unknown) {
    const { getFirebaseStorageErrorMessage } = useFirebaseStorage()
    toast.error(getFirebaseStorageErrorMessage(err))
  }
}

type PermissionGroupId = 'view' | 'operations' | 'admin' | 'sales'

interface PermissionListItem {
  id: string
  label: string
  group: PermissionGroupId
}

const roleBadgeLabel = computed(() => {
  if (isStaff.value) return isManager.value ? 'Manager' : 'Staff'
  if (userStore.isSuperAdmin || profileData.role === 'superAdmin') return 'Super Admin'
  return profileData.role || 'User'
})

const roleCardTitle = computed(() => {
  if (isStaff.value) return isManager.value ? 'Store manager' : 'Staff member'
  if (userStore.isSuperAdmin || profileData.role === 'superAdmin') return 'Super admin'
  return profileData.role || 'User'
})

const roleHeaderIcon = computed((): Component => {
  if (isStaff.value && isManager.value) return Users
  return ShieldCheck
})

const roleMetaItems = computed(() => {
  if (!isStaff.value) return [] as Array<{ key: string; text: string; icon: Component }>
  const items: Array<{ key: string; text: string; icon: Component }> = []
  const branch = businessProfileDisplay.value.storeName
  const dept = businessProfileDisplay.value.departmentName
  if (branch) items.push({ key: 'branch', text: branch, icon: Store })
  if (dept) items.push({ key: 'dept', text: dept, icon: Users })
  return items
})

const roleCardDescription = computed(() => {
  if (isStaff.value) {
    if (isManager.value) {
      return 'You can manage day-to-day operations in your assigned branch and department, including inventory and sales where enabled.'
    }
    return 'You can view and work within your assigned branch and department. Your super admin controls what you can change.'
  }
  if (userStore.isSuperAdmin || profileData.role === 'superAdmin') {
    return 'Full access to branches, team, inventory, sales, and account settings across your organization.'
  }
  return 'Contact your administrator if you need clarification on your access level.'
})

function permissionIconFor(label: string): Component {
  const lower = label.toLowerCase()
  if (lower.includes('inventory') || lower.includes('folder')) return Package
  if (lower.includes('receipt') || lower.includes('sales') || lower.includes('return'))
    return Receipt
  if (lower.includes('customer')) return Users
  if (lower.includes('analytics') || lower.includes('report')) return ChartColumn
  if (
    lower.includes('setting') ||
    lower.includes('payment') ||
    lower.includes('permission') ||
    lower.includes('team')
  ) {
    return Settings
  }
  if (lower.startsWith('view ') || lower.includes('view and')) return Eye
  return ChevronRight
}

const permissionGroupIcons: Record<PermissionGroupId, Component> = {
  view: Eye,
  sales: Receipt,
  operations: Package,
  admin: Settings,
}

function permissionGroupFor(label: string): PermissionGroupId {
  const lower = label.toLowerCase()
  if (lower.startsWith('view ') || lower.includes('view and')) return 'view'
  if (
    lower.includes('manage') ||
    lower.includes('edit') ||
    lower.includes('delete') ||
    lower.includes('configure') ||
    lower.includes('export') ||
    lower.includes('access system') ||
    lower.includes('full access')
  ) {
    return 'admin'
  }
  if (lower.includes('create') || lower.includes('process')) return 'sales'
  return 'operations'
}

const permissionCatalog = computed((): PermissionListItem[] => {
  const items: PermissionListItem[] = []

  if (!isStaff.value) {
    const labels = [
      'Full access to all features',
      'Manage store information and settings',
      'Manage team members and roles',
      'View and manage all inventory',
      'View and manage all customers',
      'View and manage all sales',
      'View and manage all returns',
      'Access all reports and analytics',
      'Manage departments and staff',
      'Configure payment settings',
      'Export and import all data',
      'Delete all data',
      'Manage leave requests',
      'Access system settings',
      'Manage user permissions',
      'Create inventory folders',
      'Create and process sales',
    ]
    labels.forEach((label, i) => {
      items.push({ id: `sa-${i}`, label, group: permissionGroupFor(label) })
    })
    return items
  }

  const labels = [
    'View inventory products',
    'View sales',
    'View customer information',
    'Create and process sales',
  ]
  if (isManager.value) {
    labels.push(
      'Manage inventory products',
      'Edit sales',
      'Delete sales',
      'Create inventory folders',
      'Manage department operations'
    )
  } else {
    labels.push('View inventory folders in assigned department', 'Process returns and exchanges')
  }
  labels.forEach((label, i) => {
    items.push({ id: `st-${i}`, label, group: permissionGroupFor(label) })
  })
  return items
})

const userPermissions = computed(() => permissionCatalog.value.map((p) => p.label))

const permissionGroupLabels: Record<PermissionGroupId, string> = {
  view: 'View',
  operations: 'Operations',
  sales: 'Sales & checkout',
  admin: 'Administration',
}

const permissionGroups = computed(() => {
  const buckets = new Map<
    PermissionGroupId,
    Array<{ id: string; label: string; icon: Component }>
  >()
  const order: PermissionGroupId[] = ['view', 'sales', 'operations', 'admin']

  for (const item of permissionCatalog.value) {
    const list = buckets.get(item.group) ?? []
    list.push({ id: item.id, label: item.label, icon: permissionIconFor(item.label) })
    buckets.set(item.group, list)
  }

  return order
    .filter((id) => (buckets.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      id,
      label: permissionGroupLabels[id],
      icon: permissionGroupIcons[id],
      items: buckets.get(id) ?? [],
    }))
})

// Modal states (simplified - would be actual modals in production)
const showLanguageModal = ref(false)
const showRegionModal = ref(false)
const showCurrencyModal = ref(false)
const showNotificationsModal = ref(false)
const showThemeModal = ref(false)
const showTimezoneModal = ref(false)
const showPasswordModal = ref(false)
const showSessionsModal = ref(false)
const show2FASetupModal = ref(false)
const show2FADisableModal = ref(false)
const disable2FAPassword = ref('')
const disable2FATotp = ref('')
const isDisabling2FA = ref(false)
const disable2FAError = ref('')

const preferenceRows = computed(() => [
  {
    key: 'theme',
    label: 'Theme',
    value: accountSettings.theme,
    icon: SunMoon,
    action: () => {
      showThemeModal.value = true
    },
  },
  {
    key: 'language',
    label: 'Language',
    value: accountSettings.language,
    icon: Languages,
    action: () => {
      showLanguageModal.value = true
    },
  },
  {
    key: 'region',
    label: 'Region',
    value: accountSettings.region,
    icon: Globe,
    action: () => {
      showRegionModal.value = true
    },
  },
  {
    key: 'currency',
    label: 'Currency',
    value: accountSettings.currency,
    icon: Coins,
    action: () => {
      showCurrencyModal.value = true
    },
  },
  {
    key: 'timezone',
    label: 'Timezone',
    value: accountSettings.timezone,
    icon: Clock,
    action: () => {
      showTimezoneModal.value = true
    },
  },
])

// Functions
const enableEditing = (section: string) => {
  if (section === 'personal') {
    isEditingPersonalInfo.value = true
    // Backup current data
    Object.assign(backupData, { ...profileData })
  }
}

const cancelEditing = (section: string) => {
  if (section === 'personal') {
    isEditingPersonalInfo.value = false
    // Restore backup
    Object.assign(profileData, { ...backupData })
  }
}

const startEditingReceiptPolicies = () => {
  Object.assign(backupReceiptPolicies, { ...receiptPoliciesForm })
  isEditingReceiptPolicies.value = true
}

const cancelEditingReceiptPolicies = () => {
  Object.assign(receiptPoliciesForm, { ...backupReceiptPolicies })
  isEditingReceiptPolicies.value = false
}

const saveReceiptPolicies = async () => {
  if (!currentUser.value || isStaff.value) {
    toast.error('Only the account owner can update receipt policies')
    return
  }
  try {
    const userData = await getUserDocument(currentUser.value.uid)
    const prevDetails: StoreDetails = userData?.storeDetails || {
      storeName: profileData.businessName.trim() || userData?.name || 'Store',
    }
    await updateUserDocument(currentUser.value.uid, {
      storeDetails: {
        ...prevDetails,
        settings: {
          ...prevDetails.settings,
          receipt: {
            ...prevDetails.settings?.receipt,
            salesTerms: receiptPoliciesForm.salesTerms.trim(),
            refundPolicy: receiptPoliciesForm.refundPolicy.trim(),
            warrantyPolicy: receiptPoliciesForm.warrantyPolicy.trim(),
          },
        },
      },
    })
    await userStore.fetchUserData(currentUser.value.uid)
    Object.assign(backupReceiptPolicies, { ...receiptPoliciesForm })
    isEditingReceiptPolicies.value = false
    toast.success(
      'Receipt policies saved. They will appear on new receipts when viewed or printed.'
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save receipt policies'
    console.error('Error saving receipt policies:', error)
    toast.error(msg)
  }
}

const savePersonalInfo = async () => {
  if (!currentUser.value) {
    toast.error('You must be signed in to update your profile')
    return
  }

  try {
    if (isStaff.value) {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim()
      await updateUserDocument(currentUser.value.uid, {
        name: fullName || profileData.firstName || profileData.email,
        email: profileData.email,
      })
    } else {
      await updateUserDocument(currentUser.value.uid, {
        name: profileData.businessName.trim() || profileData.email,
        email: profileData.email,
      })
    }

    isEditingPersonalInfo.value = false
    Object.assign(backupData, { ...profileData })
    toast.success('Profile updated successfully!')
  } catch (error: any) {
    console.error('Error saving profile:', error)
    toast.error(error.message || 'Failed to update profile. Please try again.')
  }
}

const { updateUserPassword, getActiveSessions, is2FAEnabled, disable2FA } = useFirebaseAuth()

// Theme functions
const selectTheme = (themeValue: 'light' | 'dark' | 'system') => {
  setTheme(themeValue)
  accountSettings.theme =
    themeValue === 'system' ? 'Follow system' : themeValue === 'dark' ? 'Dark' : 'Light'
  setTimeout(() => {
    showThemeModal.value = false
  }, 300)
}

// Language functions
const selectLanguage = async (code: string, name: string) => {
  accountSettings.language = name
  try {
    await updatePreferences({ language: code })
    toast.success('Language updated successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to update language')
  }
  setTimeout(() => {
    showLanguageModal.value = false
  }, 300)
}

// Region functions
const selectRegion = async (code: string, name: string) => {
  accountSettings.region = name
  try {
    await updatePreferences({ region: code })
    toast.success('Region updated successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to update region')
  }
  setTimeout(() => {
    showRegionModal.value = false
  }, 300)
}

// Currency functions
const selectCurrency = async (code: string, name: string, symbol: string) => {
  accountSettings.currency = `${code} (${symbol})`
  try {
    // Show loading toast
    const loadingToast = toast.info('Updating currency and fetching exchange rates...')

    // Update preferences (this will trigger exchange rate refresh)
    await updatePreferences({ currency: code, currencySymbol: symbol })

    // Refresh exchange rates explicitly
    if (import.meta.client) {
      try {
        const { useCurrencyConversion } = await import('~/composables/useCurrencyConversion')
        const { refreshRates, baseCurrency } = useCurrencyConversion()
        const base = baseCurrency.value || preferences.value.currency || 'USD'
        await refreshRates(base)
      } catch (error) {
        console.warn('Error refreshing exchange rates:', error)
      }
    }

    toast.success(`Currency updated to ${code}. All prices will be converted automatically.`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to update currency')
  }
  setTimeout(() => {
    showCurrencyModal.value = false
  }, 300)
}

// Notification functions
const saveNotificationSettings = () => {
  if (import.meta.client) {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))

    // Update display text
    const enabledTypes: string[] = []
    if (notificationSettings.email) enabledTypes.push('Email')
    if (notificationSettings.push) enabledTypes.push('Push')
    if (notificationSettings.sms) enabledTypes.push('SMS')
    if (notificationSettings.inApp) enabledTypes.push('In-App')

    accountSettings.notifications = enabledTypes.length > 0 ? enabledTypes.join(', ') : 'None'
  }
  showNotificationsModal.value = false
}

const handlePushNotificationToggle = async () => {
  if (notificationSettings.push) {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        notificationSettings.push = false
        toast.warning(
          'Push notifications require permission. Please enable them in your browser settings.'
        )
      }
    } else if (Notification.permission === 'denied') {
      notificationSettings.push = false
      toast.warning('Push notifications are blocked. Please enable them in your browser settings.')
    }
  }
}

// Password change function
const handlePasswordChange = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    passwordError.value = 'Please fill in all fields'
    return
  }

  if (!isPasswordPolicyValid(passwordForm.newPassword)) {
    const errs = getPasswordPolicyErrors(passwordForm.newPassword)
    passwordError.value =
      errs.length > 0
        ? `Password requirements: ${errs.join('; ')}.`
        : 'Please choose a stronger password.'
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    return
  }

  isChangingPassword.value = true
  passwordError.value = ''

  try {
    await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword)
    toast.success('Password changed successfully!')
    showPasswordModal.value = false
    resetPasswordForm()
  } catch (error: any) {
    passwordError.value = error.message || 'Failed to change password. Please try again.'
  } finally {
    isChangingPassword.value = false
  }
}

// 2FA functions
const handle2FAToggle = () => {
  if (securitySettings.twoFactor) {
    // Show disable modal
    show2FADisableModal.value = true
  } else {
    // Show setup modal
    show2FASetupModal.value = true
  }
}

const handle2FASetupSuccess = async () => {
  // Reload 2FA status
  const enabled = await is2FAEnabled()
  securitySettings.twoFactor = enabled
  if (import.meta.client) {
    localStorage.setItem('twoFactorEnabled', enabled ? 'true' : 'false')
  }
  show2FASetupModal.value = false
}

const handleDisable2FA = async () => {
  if (!disable2FAPassword.value) {
    disable2FAError.value = 'Please enter your password'
    return
  }
  if (disable2FATotp.value.trim().length !== 6) {
    disable2FAError.value = 'Enter the 6-digit code from your authenticator app'
    return
  }

  isDisabling2FA.value = true
  disable2FAError.value = ''

  try {
    await disable2FA(disable2FAPassword.value, disable2FATotp.value.trim())
    securitySettings.twoFactor = false
    if (import.meta.client) {
      localStorage.setItem('twoFactorEnabled', 'false')
    }
    show2FADisableModal.value = false
    disable2FAPassword.value = ''
    disable2FATotp.value = ''
    toast.success('Two-factor authentication has been disabled')
  } catch (error: any) {
    disable2FAError.value = error.message || 'Failed to disable 2FA. Please try again.'
  } finally {
    isDisabling2FA.value = false
  }
}

const handle2FAError = (error: string) => {
  toast.error(error)
}

// Sessions functions
const loadActiveSessions = async () => {
  isLoadingSessions.value = true
  try {
    const sessions = await getActiveSessions()
    activeSessions.value = sessions
    securitySettings.activeSessions = sessions.length
  } catch (error) {
    console.error('Error loading sessions:', error)
  } finally {
    isLoadingSessions.value = false
  }
}

const revokeSession = async (index: number) => {
  if (confirm('Are you sure you want to revoke this session?')) {
    // Remove session from list
    activeSessions.value.splice(index, 1)
    securitySettings.activeSessions = activeSessions.value.length
    // In production, you'd revoke the actual session token
    toast.success('Session revoked successfully')
  }
}

const revokeAllSessions = async () => {
  if (
    confirm(
      'Are you sure you want to revoke all other sessions? You will remain signed in on this device.'
    )
  ) {
    // Keep only current session
    activeSessions.value = activeSessions.value.filter((s) => s.current)
    securitySettings.activeSessions = activeSessions.value.length
    // In production, you'd revoke all other session tokens
    toast.success('All other sessions have been revoked')
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function replayDashboardTour() {
  const uid = authStore.currentUser?.uid
  if (!uid) return

  isReplayingTour.value = true
  try {
    await resetTutorial(uid)
    if (userStore.userData) {
      userStore.userData = {
        ...userStore.userData,
        hasCompletedTutorial: false,
      }
    }
    toast.success('Tour starting on your dashboard')
    await navigateTo('/dashboard?tutorial=replay')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not restart the tour'
    toast.error(message)
  } finally {
    isReplayingTour.value = false
  }
}

// Timezone functions
const saveTimezone = async () => {
  const timezoneLabel =
    timezones.find((tz) => tz.value === selectedTimezone.value)?.label || selectedTimezone.value
  accountSettings.timezone = timezoneLabel
  try {
    await updatePreferences({ timezone: selectedTimezone.value })
    toast.success('Timezone updated successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to update timezone')
  }
  showTimezoneModal.value = false
}

// Watch for sessions modal to load sessions
watch(showSessionsModal, (isOpen) => {
  if (isOpen) {
    loadActiveSessions()
  }
})

// Initialize timezone when modal opens
watch(showTimezoneModal, (isOpen) => {
  if (isOpen) {
    // Set selected timezone to current
    const currentTz = timezones.find((tz) => tz.label === accountSettings.timezone)?.value || 'UTC'
    selectedTimezone.value = currentTz
  }
})
</script>
