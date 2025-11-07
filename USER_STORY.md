# BudgetWise App - User Story & UI Flow Documentation

## 📱 Application Overview
**BudgetWise** is a comprehensive expense tracking and budgeting mobile application built with React Native and Expo. It enables users to manage their personal finances and collaborate with others through group expense management. The app supports both online and offline functionality, biometric authentication, and provides detailed financial analytics.

---

## 🎯 User Journey & Screen Flow

### 1. **Splash Screen** (`SplashScreen.tsx`)
**Purpose:** Welcome screen with animated branding

**User Story:**
> As a user, when I first launch the app, I see an elegant animated splash screen that introduces the BudgetWise brand while the app initializes.

**Features:**
- Animated logo with wallet icon
- App name "BudgetWise" with tagline: "Your Money, Your Way, Your Groups"
- Loading animation with dots
- Smooth transitions and spring animations
- Version information and developer credits
- Background decorative patterns
- Theme-aware (supports dark/light mode)

**Duration:** 3 seconds before transitioning to appropriate screen

**Technical Notes:**
- Uses Animated API for smooth animations
- Material Icons for wallet symbol
- Supports both dark and light themes

---

### 2. **Home Screen** (`HomeScreen.tsx`)
**Purpose:** Landing page for non-authenticated users

**User Story:**
> As a new visitor, I want to learn about BudgetWise features and have easy access to login or register.

**Features:**
- **Header Section:**
  - BudgetWise branding
  - Quick login button
  
- **Hero Section:**
  - Main headline: "Take Control of Your Finances"
  - Subtitle: "Smart budgeting made simple with BudgetWise"

- **Features Showcase:**
  - 📊 **Track Your Spending** - Real-time income and expense monitoring
  - 💰 **Budget Planning** - Category-based budget management
  - 📈 **Financial Insights** - Detailed reports and analytics
  - 🔒 **Secure & Private** - Bank-level security measures

- **Call-to-Action:**
  - Prominent "Get Started Free" button
  - Links to registration and login screens

**Navigation:**
- Login → Navigate to Login Screen
- Get Started Free → Navigate to Register Screen

---

### 3. **Login Screen** (`LoginScreen.tsx`)
**Purpose:** User authentication for existing accounts

**User Story:**
> As a returning user, I want to securely login with my username and password to access my financial data.

**Features:**
- **Form Fields:**
  - Username input (case-insensitive)
  - Password input (masked)
  
- **Actions:**
  - Sign In button (with loading indicator)
  - "Don't have an account? Register" link
  - "Forgot your password? Reset it here" link
  - Back to Home navigation

- **Validation:**
  - Required field validation
  - Network error handling
  - User-friendly error messages

- **Post-Login:**
  - Auto-fetch user profile and groups
  - Save authentication token
  - Display welcome toast message
  - Navigate to Dashboard/Main App

**Error Handling:**
- 401: Invalid credentials
- 404: User not found
- Network errors: Connection troubleshooting

**Theme Support:**
- Adaptive status bar
- Light/dark mode compatible

---

### 4. **Register Screen** (`RegisterScreen.tsx`)
**Purpose:** New user account creation

**User Story:**
> As a new user, I want to create an account with email verification to start tracking my finances.

**Features:**
- **Registration Form:**
  - Full Name
  - Username (unique)
  - Email Address (with verification)
  - Phone Number (10 digits)
  - Password (minimum 6 characters)
  - Confirm Password

- **Email Verification:**
  - "Verify" button appears for valid email
  - Sends OTP to email
  - Email field locked after verification
  - Green checkmark badge when verified

- **Validation:**
  - Email format validation
  - Password strength check
  - Password match confirmation
  - Phone number format (10 digits)
  - All fields required

- **Post-Registration:**
  - Auto-login after successful registration
  - Fetch and cache user groups
  - Navigate directly to main app

**Navigation:**
- Email Verification → Navigate to `EmailVerificationScreen`
- Already have account → Navigate to Login
- Success → Auto-navigate to Dashboard

---

### 5. **Email Verification Screen** (`EmailVerificationScreen.tsx`)
**Purpose:** Verify email address with OTP

**User Story:**
> As a registering user, I need to verify my email address by entering the OTP code sent to my email.

**Features:**
- Display email address being verified
- 6-digit OTP input
- Resend OTP option (with 60-second cooldown)
- Auto-submit on 6 digits entered
- Edit email option to go back

**Flow:**
- Receive 6-digit OTP via email
- Enter OTP code
- System validates OTP
- On success: Return to registration with verified status
- On failure: Show error and allow retry

**Used For:**
- New user registration email verification
- Password reset email verification

---

### 6. **Forgot Password Screen** (`ForgotPasswordScreen.tsx`)
**Purpose:** Initiate password reset process

**User Story:**
> As a user who forgot my password, I want to reset it by verifying my email address.

**Features:**
- Email input field
- Send verification email
- Navigates to Email Verification
- Email format validation
- Network error handling

**Flow:**
1. Enter email address
2. Click "Send Verification"
3. System sends OTP to email
4. Navigate to Email Verification
5. After verification → Navigate to Reset Password

---

### 7. **Reset Password Screen** (`ResetPasswordScreen.tsx`)
**Purpose:** Set new password after email verification

**User Story:**
> As a user resetting my password, I want to create a new secure password after verifying my email.

**Features:**
- Email display (verified)
- New password input
- Confirm password input
- Password strength validation (min 6 characters)
- Password match validation

**Flow:**
- Only accessible after email verification
- Validates password requirements
- Submits password reset to API
- On success: Navigate to Login
- Shows success/error messages

---

### 8. **Dashboard Screen** (`DashboardScreen.tsx`)
**Purpose:** Main overview of financial status

**User Story:**
> As an authenticated user, I want to see an overview of my current balance, recent transactions, and quick access to add new expenses.

**Features:**

- **Context Indicator:**
  - Shows current context (Personal or Group name)
  - Quick context switching

- **Balance Summary Cards:**
  - 💰 Total Balance (green/red based on positive/negative)
  - 📥 Total Income (green)
  - 📤 Total Expenses (red)
  - Real-time calculations

- **Search Functionality:**
  - Search icon in header
  - Filter transactions by description
  - Real-time search results

- **Recent Transactions List:**
  - Transaction type icon and category
  - Description and date
  - Amount (color-coded: green for deposits, red for expenses)
  - Scrollable list
  - Pull-to-refresh

- **Quick Action Button:**
  - Floating "+" button
  - Navigate to Add Expense screen

- **Offline Support:**
  - Network status indicator
  - Cached data display when offline
  - Auto-sync when online

**Data Display:**
- Categorized expenses with icons
- Deposits with income icons
- Chronological ordering (newest first)
- Category-based color coding

**Navigation:**
- View All → Navigate to Transactions Screen
- Add (+) → Navigate to Add Expense Screen
- Profile icon → Navigate to Profile Screen

---

### 9. **Add Expense Screen** (`AddExpenseScreen.tsx`)
**Purpose:** Create new expenses or deposits

**User Story:**
> As a user, I want to quickly add a new expense or income transaction with category, amount, and description.

**Features:**

- **Transaction Type Toggle:**
  - Expense (default)
  - Credit/Deposit

- **Form Fields:**
  - Title (required)
  - Amount (required, numeric validation)
  - Description (optional)
  - Category (required for expenses only)

- **Category Selection:**
  - Dynamic category loading from API
  - Visual category grid
  - Categories: Food, Hospital, Investment, Rent, Bill, Education, Transport, Entertainment, Utilities, Grocery, Travel, Insurance, Shopping, Loan, Miscellaneous, Credit Card

- **Validation:**
  - Title cannot be empty
  - Amount must be positive number
  - Category required for expenses
  - Real-time validation feedback

- **Offline Mode:**
  - Queue transactions when offline
  - Auto-sync when connection restored
  - Visual offline indicator

**Flow:**
1. Select transaction type (Expense/Deposit)
2. Fill in details
3. Select category (for expenses)
4. Save
5. Success toast message
6. Auto-navigate back to Dashboard

---

### 10. **Transactions Screen** (`TransactionsScreen.tsx`)
**Purpose:** Complete transaction history with search and filters

**User Story:**
> As a user, I want to view all my transactions, search through them, edit or delete entries, and filter by type.

**Features:**

- **Filter Tabs:**
  - All Transactions
  - Expenses Only
  - Deposits Only

- **Search Bar:**
  - Search by description
  - Real-time filtering
  - Case-insensitive

- **Transaction List:**
  - Category icon and color
  - Title and description
  - Date and time
  - Amount (color-coded)
  - Type indicator (expense/deposit)

- **Transaction Actions:**
  - **Edit:** Modify amount and description
  - **Delete:** Remove transaction (with confirmation)

- **Edit Modal:**
  - Update amount
  - Update description
  - Save changes
  - Cancel option

- **Delete Confirmation:**
  - Warning dialog
  - Confirm/Cancel options
  - Prevents accidental deletions

- **Offline Support:**
  - View cached transactions
  - Queue edits/deletes for sync
  - Network status indicator

**Stats Display:**
- Total count by filter type
- Dynamic list updates
- Empty state messages

---

### 11. **Expense Analytics Screen** (`ExpenseAnalyticsScreen.tsx`)
**Purpose:** Visual financial insights and reports

**User Story:**
> As a user, I want to visualize my spending patterns through charts and graphs to understand my financial behavior.

**Features:**

- **Period Selector:**
  - Week view
  - Month view (default)
  - Year view

- **Charts & Visualizations:**

  1. **Pie Chart - Category Distribution:**
     - Expense breakdown by category
     - Color-coded categories
     - Percentage and amount display
     - Interactive legends

  2. **Line Chart - Trends:**
     - Income vs Expenses over time
     - Monthly comparison
     - Dual-line graph
     - Data points for each month

  3. **Top Spending Categories:**
     - Ranked list of categories
     - Progress bars
     - Amount spent per category
     - Percentage of total

- **Summary Statistics:**
  - Total expenses in period
  - Total income in period
  - Net balance
  - Average daily spending
  - Highest spending category

- **Data Refresh:**
  - Pull-to-refresh
  - Real-time data updates
  - Context-aware (Personal/Group)

**Theme Support:**
- Chart colors adapt to theme
- Dark/light mode compatible graphs
- High contrast for readability

---

### 12. **Profile Screen** (`ProfileScreen.tsx`)
**Purpose:** User account and group management

**User Story:**
> As a user, I want to manage my profile, switch between personal and group contexts, and access account settings.

**Features:**

- **Profile Header:**
  - Avatar with custom color
  - User's name
  - Email address

- **Context Management:**
  - **Personal Mode** (default)
  - **Group Mode** (if member of groups)
  - Active context indicator
  - Switch between contexts

- **My Groups Section (Expandable):**
  - List of joined groups
  - Group name and code
  - Member count
  - Set as active group option
  - View group details
  - Leave group option

- **Group Actions:**
  - Create New Group
  - Join Existing Group (via code)

- **Join Group Modal:**
  - Group code input
  - Password input
  - Join button
  - Validation

- **Profile Actions:**
  - Edit Profile → Navigate to Edit Profile Screen
  - Change Password → Navigate to Change Password Screen
  - Biometric Settings → Navigate to Biometric Settings Screen
  - Settings → Navigate to Settings Screen
  - Logout (with confirmation)

**Group Features:**
- Real-time member count
- Group password protected
- Token-based context switching
- Cached group data

---

### 13. **View Group Screen** (`ViewGroupScreen.tsx`)
**Purpose:** Detailed group information and management

**User Story:**
> As a group member, I want to view group details, see all members, and manage my membership.

**Features:**

- **Group Information:**
  - Group name
  - Group code (copyable)
  - Description
  - Created date
  - Total members count

- **Password Display:**
  - Show/hide toggle
  - Useful for sharing with new members

- **Member List:**
  - All group members
  - Member names
  - Member avatars

- **Group Actions:**
  - Set as Active Group
  - Leave Group (with confirmation)
  - Copy Group Code
  - View member details

- **Active Status:**
  - Visual indicator if currently active group
  - Context badge

**Security:**
- Password protected groups
- Only members can view details
- Leave confirmation dialog

---

### 14. **Create Group Screen** (`CreateGroupScreen.tsx`)
**Purpose:** Create new expense groups

**User Story:**
> As a user, I want to create a group to track shared expenses with family, roommates, or friends.

**Features:**

- **Group Creation Form:**
  - Group Name
  - Unique Group Code
  - Description
  - Password (min 6 characters)

- **Validation:**
  - All fields required
  - Group code uniqueness check
  - Password strength validation

- **Flow:**
  1. Fill group details
  2. Create group via API
  3. Auto-join created group
  4. Refresh user's group list
  5. Success message
  6. Navigate back to Profile

**Post-Creation:**
- Creator automatically added as member
- Group available for context switching
- Share group code with others

---

### 15. **Edit Profile Screen** (`EditProfileScreen.tsx`)
**Purpose:** Update user account information

**User Story:**
> As a user, I want to update my profile information such as name, email, and phone number.

**Features:**

- **Editable Fields:**
  - Full Name
  - Email Address
  - Phone Number

- **Read-Only Fields:**
  - Username (cannot be changed)
  - User ID display

- **Avatar Customization:**
  - Random color generation
  - Color persists across sessions

- **Actions:**
  - Save Changes
  - Cancel (go back)

- **Validation:**
  - Email format validation
  - Phone number format
  - Name cannot be empty

**Flow:**
- Load current user data
- Modify fields
- Validate changes
- Submit to API
- Update local cache
- Show success message
- Navigate back to Profile

---

### 16. **Change Password Screen** (`ChangePasswordScreen.tsx`)
**Purpose:** Update account password

**User Story:**
> As a security-conscious user, I want to change my password regularly to protect my account.

**Features:**

- **Password Fields:**
  - Current Password
  - New Password
  - Confirm New Password

- **Validation:**
  - Current password verification
  - New password minimum length (6 characters)
  - Password confirmation match
  - Cannot use same as current

- **Security:**
  - Password masked by default
  - Show/hide toggle option
  - Server-side verification

**Flow:**
1. Enter current password
2. Enter new password (twice)
3. Validate on server
4. Update password
5. Success message
6. Recommend re-login

---

### 17. **Settings Screen** (`SettingsScreen.tsx`)
**Purpose:** App configuration and preferences

**User Story:**
> As a user, I want to customize app settings, manage security features, and access help resources.

**Features:**

- **Appearance:**
  - 🌙 Dark Mode Toggle
  - Theme preference saved

- **Security:**
  - 🔐 Biometric Authentication Toggle
  - Navigate to Biometric Settings

- **Data Management:**
  - 📊 Export Data (CSV, Excel, PDF)
  - Choose export format
  - Email export file
  - Share export file

- **Privacy & Policies:**
  - 📜 Privacy Policy
  - Terms of Service

- **Support:**
  - 💬 Contact Support
    - Email support
    - WhatsApp support
    - Phone call option
  - ⭐ Rate App
  - ℹ️ About BudgetWise

- **Account:**
  - 🚪 Logout

**Export Features:**
- Multiple format support
- Date range selection
- Include/exclude deposits
- Email or share directly

---

### 18. **Biometric Settings Screen** (`BiometricSettingsScreen.tsx`)
**Purpose:** Configure fingerprint/face authentication

**User Story:**
> As a user, I want to enable biometric login for quick and secure access to my financial data.

**Features:**

- **Biometric Status:**
  - Device capability check
  - Enrolled biometrics detection
  - Current status display

- **Configuration:**
  - Enable/Disable biometric login
  - Test biometric authentication
  - Fallback to password option

- **Supported Methods:**
  - Fingerprint
  - Face ID/Face Recognition
  - Iris scan (device dependent)

**Requirements:**
- Device must support biometrics
- Biometrics enrolled on device
- User must be logged in

---

### 19. **Biometric Auth Screen** (`BiometricAuthScreen.tsx`)
**Purpose:** Biometric authentication on app launch

**User Story:**
> As a user with biometrics enabled, I want to authenticate quickly using my fingerprint or face instead of typing my password.

**Features:**
- Automatic biometric prompt
- Fallback to password option
- Error handling
- Retry mechanism
- Cancel option

**Flow:**
- App launch detection
- Biometric prompt
- Success → Navigate to Dashboard
- Failure → Show password input or retry
- Multiple attempts handling

---

### 20. **Privacy Policy Screen** (`PrivacyPolicyScreen.tsx`)
**Purpose:** Display app privacy policy

**User Story:**
> As a concerned user, I want to read the app's privacy policy to understand how my data is handled.

**Features:**
- Scrollable privacy policy document
- Sections:
  - Data Collection
  - Data Usage
  - Data Storage
  - Third-party Services
  - User Rights
  - Contact Information
- Easy navigation
- No data collection without consent

---

## 🎨 Common UI Components

### **Context Indicator**
- Displays current context (Personal/Group)
- Color-coded badge
- Shows active group name
- Present on Dashboard, Transactions, Analytics

### **Network Status Bar**
- Offline indicator
- Connection status
- Sync status
- Queue count when offline

### **Adaptive Status Bar**
- Theme-aware
- Auto-adjusts for screen content
- Light/dark variants

### **Custom Toast**
- Success messages (green)
- Error messages (red)
- Info messages (blue)
- Auto-dismiss after 3 seconds

### **Custom Popup**
- Confirmation dialogs
- Error alerts
- Info notifications
- Success confirmations

### **Avatar Component**
- User initials display
- Random color generation
- Consistent colors per user
- Cached color preference

### **Export Modal**
- Format selection (CSV/Excel/PDF)
- Date range picker
- Export options
- Share functionality

---

## 🔄 Navigation Flow Summary

```
Splash Screen
    ↓
Home Screen (if not authenticated)
    ↓
Login / Register
    ↓
Dashboard (Main Tab Navigator)
    ├── Dashboard Tab
    ├── Transactions Tab
    ├── Analytics Tab
    └── Profile Tab
        ├── Edit Profile
        ├── Change Password
        ├── Settings
        ├── Create Group
        ├── View Group
        └── Biometric Settings
```

---

## 🌐 Offline Functionality

**Offline Manager** provides:
- Queue transactions when offline
- Cache user data and transactions
- Auto-sync when connection restored
- Offline indicators throughout app
- Network status monitoring
- Optimistic UI updates

**Cached Data:**
- User profile
- Recent transactions
- User groups
- Categories
- Balance calculations

---

## 🔐 Security Features

1. **Token-based Authentication**
   - JWT tokens
   - Automatic token refresh
   - Context-specific tokens (Personal/Group)

2. **Biometric Authentication**
   - Fingerprint/Face ID support
   - Secure credential storage
   - Fallback authentication

3. **Password Security**
   - Minimum length requirements
   - Secure password reset flow
   - Email verification

4. **Group Security**
   - Password-protected groups
   - Member verification
   - Token-based access control

---

## 📊 Data Management

**Local Storage (AsyncStorage):**
- User credentials
- Authentication tokens
- User preferences
- Cached transactions
- Group memberships
- App settings

**API Integration:**
- RESTful API communication
- Real-time data sync
- Error handling
- Network retry logic

---

## 🎯 Key User Flows

### **Adding an Expense:**
1. Dashboard → Tap (+) Button
2. Select "Expense" type
3. Enter title and amount
4. Select category
5. Add description (optional)
6. Tap Save
7. See success message
8. Return to Dashboard with updated balance

### **Switching to Group Context:**
1. Profile → My Groups
2. Select a group
3. Tap "Set as Active"
4. Confirmation
5. Dashboard now shows group expenses
6. All transactions filtered to group

### **Creating and Joining Groups:**
1. Profile → Create New Group
2. Fill group details
3. Create group
4. Share group code and password
5. Others: Profile → Join Group
6. Enter code and password
7. Join group
8. Group appears in "My Groups"

---

## 🎨 Theme Support

**Light Mode:**
- Bright, clean interface
- Blue primary color (#4A90E2)
- White backgrounds
- Dark text for readability

**Dark Mode:**
- Dark backgrounds
- Light text
- Reduced eye strain
- Same color accents

**Theme Toggle:**
- Available in Settings
- Instant theme switching
- Saved preference
- Consistent across all screens

---

## 📱 Responsive Design

- Adaptive layouts for different screen sizes
- Keyboard-aware input fields
- ScrollView for long content
- Touch-friendly tap targets
- Optimized for mobile devices

---

## 🔔 User Notifications

**Toast Messages:**
- Success confirmations
- Error alerts
- Info notifications

**Popup Dialogs:**
- Confirmations (logout, delete)
- Errors with details
- Important information

**Network Status:**
- Offline indicator
- Sync status
- Connection alerts

---

## ✨ User Experience Highlights

1. **Smooth Animations:** Spring animations on splash screen and transitions
2. **Pull-to-Refresh:** Update data on all listing screens
3. **Search Functionality:** Quick search on dashboard and transactions
4. **Visual Feedback:** Loading indicators, success/error states
5. **Context Awareness:** Clear indication of Personal vs Group mode
6. **Offline Support:** Work seamlessly without internet
7. **Quick Actions:** Floating action buttons for common tasks
8. **Data Visualization:** Charts and graphs for analytics
9. **Secure Access:** Biometric authentication option
10. **Export Options:** Download financial data in multiple formats

---

## 📝 Developed By

**Akshay & Prem**  
Version 1.0.0

---

## 🎓 Conclusion

BudgetWise provides a comprehensive, user-friendly platform for managing personal and group finances. With features like offline support, biometric authentication, detailed analytics, and seamless group collaboration, users can take full control of their financial journey. The app's intuitive design and robust functionality make expense tracking simple, secure, and effective.
