# Deployment and staff sign-in

Staff get **Firebase Auth accounts** so they can sign in. When you add staff, you enter their email and a **password** in the form; the app creates their Firebase account and Firestore record in the browser. Share the password with the staff member manually (no email invite).

**No server is required.** Staff creation runs entirely on the client (static deploy is fine). Password changes are done by staff in Profile after they sign in.
