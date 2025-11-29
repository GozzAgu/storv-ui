# 📱 Phone Authentication Setup Guide

## Enable Phone Sign-In in Firebase

Phone authentication requires additional setup in Firebase Console. Follow these steps:

---

## ✅ Step 1: Enable Phone Authentication Provider

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com
   - Select your project: **storv-ux**

2. **Navigate to Authentication**
   - Click **"Authentication"** in the left sidebar
   - Click on the **"Sign-in method"** tab

3. **Enable Phone Provider**
   - Find **"Phone"** in the list of sign-in providers
   - Click on it
   - Toggle **"Enable"** to ON
   - Click **"Save"**

---

## ✅ Step 2: Set Up reCAPTCHA (Required for Phone Auth)

Firebase Phone Authentication requires reCAPTCHA verification. This is handled automatically by the code, but you need to verify your domain:

1. **Check Authorized Domains**
   - In Firebase Console → **Authentication** → **Settings** tab
   - Scroll to **"Authorized domains"**
   - Ensure your domains are listed:
     - `localhost` (for development)
     - Your production domain (e.g., `yourdomain.com`)

2. **reCAPTCHA is automatically configured**
   - The app uses invisible reCAPTCHA v3
   - No additional setup needed in most cases

---

## ✅ Step 3: Test Phone Authentication

1. **In Development (localhost)**
   - Phone auth should work immediately
   - You can use test phone numbers if Firebase Test Lab is enabled

2. **In Production**
   - Make sure your domain is in authorized domains
   - Phone auth requires HTTPS (most hosting platforms provide this)

---

## 📱 How Phone Sign-In Works

### User Flow:
1. User enters phone number with country code
2. Clicks "Send Verification Code"
3. reCAPTCHA verifies (invisible to user)
4. SMS code is sent to phone number
5. User enters 6-digit verification code
6. Code is verified and user is signed in/up

### Features:
- ✅ Automatic country code selection
- ✅ SMS code verification
- ✅ Resend code functionality
- ✅ Error handling for invalid codes
- ✅ Automatic user document creation in Firestore

---

## 🔧 Supported Countries

The phone sign-in component includes these country codes by default:
- 🇺🇸 United States (+1)
- 🇬🇧 United Kingdom (+44)
- 🇳🇬 Nigeria (+234)
- 🇮🇳 India (+91)
- 🇨🇳 China (+86)
- 🇯🇵 Japan (+81)
- 🇩🇪 Germany (+49)
- 🇫🇷 France (+33)
- 🇦🇺 Australia (+61)
- 🇧🇷 Brazil (+55)
- 🇿🇦 South Africa (+27)
- 🇰🇪 Kenya (+254)
- 🇬🇭 Ghana (+233)
- 🇺🇬 Uganda (+256)

You can add more countries in `components/auth/PhoneSignIn.vue`.

---

## ⚠️ Important Notes

### Costs:
- **SMS messages cost money** in Firebase (except in test mode)
- Firebase provides a free tier for phone authentication
- Check Firebase pricing: https://firebase.google.com/pricing

### Limitations:
- Phone numbers must include country code
- SMS delivery depends on carrier and region
- Some countries may have restrictions

### Quota:
- Firebase has quotas for SMS messages
- If you exceed quota, you'll get a `quota-exceeded` error
- Monitor usage in Firebase Console → Usage and billing

---

## 🐛 Troubleshooting

### Error: "SMS quota exceeded"
**Solution**: Check Firebase billing/usage or wait for quota reset

### Error: "Invalid phone number format"
**Solution**: Ensure phone number includes country code (e.g., +1234567890)

### Error: "reCAPTCHA verification failed"
**Solution**: 
- Check authorized domains in Firebase Console
- Ensure site is using HTTPS (required in production)

### Error: "Too many attempts"
**Solution**: Wait a few minutes before trying again

### SMS Code Not Received
**Solution**:
- Check phone number is correct
- Check carrier/country restrictions
- Try resending code
- Check spam/junk folder (some carriers send SMS codes there)

---

## 🔒 Security Best Practices

1. **Rate Limiting**: Firebase automatically rate-limits phone auth attempts
2. **reCAPTCHA**: Prevents bot abuse
3. **Code Expiration**: Verification codes expire after a few minutes
4. **Single Use**: Each code can only be used once

---

## 📝 Testing

### Test Phone Numbers (if Test Lab enabled)
Firebase provides test phone numbers that don't require actual SMS:
- Check Firebase Console → Authentication → Phone numbers for testing

### Production Testing
- Use real phone numbers in production
- SMS messages will be sent and charged accordingly

---

## ✅ Verification Checklist

- [ ] Phone provider enabled in Firebase Console
- [ ] Authorized domains configured (localhost + production)
- [ ] Site uses HTTPS (production)
- [ ] Tested phone sign-in flow
- [ ] Checked Firebase billing/quota limits

---

## 📚 Additional Resources

- Firebase Phone Auth Docs: https://firebase.google.com/docs/auth/web/phone-auth
- reCAPTCHA Setup: https://firebase.google.com/docs/auth/web/phone-auth#set-up-the-recaptcha-verifier
- Firebase Pricing: https://firebase.google.com/pricing

---

## 🎯 Next Steps

After enabling phone authentication:
1. Test the flow on signin/signup pages
2. Monitor Firebase Console for usage
3. Set up billing alerts if needed
4. Consider adding more country codes based on your users

Phone authentication is now ready to use! 📱✨

