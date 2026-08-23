Here’s a **direct Figma/UI prompt** you can use. I focused on the **Manage Booking flow**, with simulated **rescheduling and cancellation** actions.

---

## Figma UI Prompt: Manage Booking Flow

Design a clean and user-friendly **Manage Booking** interface for a web-based coworking space booking system.

The user should be able to manage an existing booking by entering their **Reference Code** instead of scanning their reserved QR code. The reference code represents the user’s QR booking record. The system will verify the code and show available actions based on the booking status and business rules.

### Screen 1: Manage Booking Entry

Create a page titled **Manage Booking**.

Include a short instruction:

> Enter your booking reference code to view and manage your reservation.

Add the following UI elements:

* Text input field labeled **Reference Code**
* Placeholder: **Enter your reference code**
* Primary button: **Verify Booking**
* Small helper text below the input:

  > You can find your reference code in your booking confirmation email.

### Screen 2: Invalid Reference Code State

After the user enters an invalid reference code, show an error state.

Display:

* Red error message:

  > Invalid reference code. Please check your booking email and try again.
* Keep the **Verify Booking** button active
* Input field should show an error border

### Screen 3: Valid Reference Code / Booking Details

After the reference code is verified, show a **Booking Details Card**.

Display sample booking information:

* **Reference Code:** SKYDY-2026-00125
* **Customer Name:** Juan Dela Cruz
* **Workspace:** Study Desk A3
* **Booking Date:** June 10, 2026
* **Time:** 10:00 AM – 2:00 PM
* **Status:** Confirmed

Below the booking details, show two action buttons:

* **Reschedule Booking**
* **Cancel Booking**

The buttons should only be active if the booking is still within the allowed business rule period.

Add a small note below the buttons:

> Rescheduling and cancellation are only available within the allowed time period set by the business.

---

## Button Behavior / Business Rule Simulation

Create two versions of the action button state:

### Version A: Actions Allowed

If the booking is still within the allowed period, show both buttons as active.

* **Reschedule Booking** button: active
* **Cancel Booking** button: active

When clicked, each button opens its respective simulated flow.

### Version B: Actions Not Allowed

If the booking has already passed the allowed time period, show both buttons as disabled or gray.

* **Reschedule Booking** button: gray
* **Cancel Booking** button: gray

Even if the user tries to click the disabled button, show a notification or modal:

> This action is no longer available because the allowed time period for rescheduling or cancellation has already passed.

---

# Simulated Rescheduling Flow

## Screen 4: Reschedule Booking

When the user clicks **Reschedule Booking**, show a rescheduling form.

Display:

* Current booking details at the top
* Calendar/date picker labeled **Select New Date**
* Time slot dropdown labeled **Select New Time**
* Button: **Check Availability**

After selecting a new date and time, show a simulated availability result.

### Available Slot State

Display:

> The selected schedule is available.

Show button:

* **Confirm Reschedule**

After confirmation, show success modal:

> Your booking has been successfully rescheduled. A confirmation email with your updated booking details will be sent to your registered email address.

### Unavailable Slot State

Display:

> The selected schedule is unavailable. Please choose another date or time.

Keep the date and time fields editable.

---

# Simulated Cancellation Flow

## Screen 5: Cancel Booking Confirmation

When the user clicks **Cancel Booking**, show a confirmation modal.

Modal title:

> Cancel Booking?

Modal message:

> Are you sure you want to cancel this booking? Once confirmed, a cancellation email containing the refund form will be sent to your registered email address.

Buttons:

* **No, Keep Booking**
* **Yes, Cancel Booking**

## Screen 6: Cancellation Success

After the user confirms cancellation, show a success state.

Display:

> Your booking has been cancelled successfully.

Then show this message:

> A cancellation email with a refund form has been sent to your registered email address. Please complete the form by providing your account name, account number, and uploading your QR code with consent for refund processing.

Also display:

> The admin and staff have been notified. The admin will review the refund request and process it within 2–3 business days.

Button:

* **Back to Home**

---

# Admin Notification Simulation

Create a small admin-side notification screen or card.

Title:

> Cancellation Request Received

Show details:

* **Customer:** Juan Dela Cruz
* **Reference Code:** SKYDY-2026-00125
* **Booking Status:** Cancelled
* **Refund Status:** Pending Review

Add button:

* **Open Admin Portal**

When clicked, simulate redirecting the admin to login.

After login, show an admin action button:

* **Tag as For Refund**

After clicking, update the refund status to:

> For Refund

Add note:

> Refund will be processed manually by the admin within 2–3 business days.

---

## UI Style Direction

Use a clean, modern dashboard-style interface suitable for a coworking space booking system.

Recommended style:

* Light background
* Rounded cards
* Clear form fields
* Blue or teal primary buttons
* Gray disabled buttons
* Red error messages
* Green success messages
* Simple icons for booking, calendar, cancellation, and notification
* Mobile-responsive layout

The flow should clearly show:

1. User enters reference code
2. System verifies the booking
3. Booking details appear
4. Reschedule and Cancel buttons activate only if allowed
5. Disabled buttons show a notification when action is no longer available
6. Rescheduling is simulated through date/time selection
7. Cancellation is simulated through confirmation, email notice, and admin refund tagging flow
