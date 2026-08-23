Here’s a refined **Lovable AI prompt** you can paste directly:

---

**Design a modern self-service kiosk interface for a co-working space platform.**
The kiosk should be **touch-friendly, clean, intuitive, and high-fidelity**, designed for tablet use in a reception area. The experience should focus on **walk-in guests and walk-in reservations**, with the **interactive workspace map as the main centerpiece of the interface**.

## Overall kiosk layout

* **Center:** large interactive workspace map
* **Upper left corner:** co-working space logo
* **Upper right corner:** prominent **“Scan QR”** button
* Clean modern UI, minimal clutter, professional SaaS-like design
* Realistic color-coded map legend for desk status:

  * **Available**
  * **Pending**
  * **Reserved**
  * **Occupied** if needed for clarity
* The kiosk should feel efficient, welcoming, and easy for first-time users

---

## Main Kiosk Entry Screen

When users first see the kiosk:

* show the **interactive workspace map immediately**
* show available desks and rooms in real time through color coding
* allow users to tap/click a desk directly on the map
* QR scan button should remain visible for returning/reserved users

When a user clicks a desk on the map:

* a **modal form** should appear
* the modal should show the selected desk details
* the modal should offer two actions:

  1. **Book Now**
  2. **Book Reservation**

The map should continue to remain visible behind the modal.

---

# Flow 1: Walk-In Guest Flow

This flow is for a guest who wants to use a desk immediately.

### Step 1: Interactive map selection

* User taps an available desk on the map
* Modal appears with:

  * selected desk/room name
  * desk type
  * zone/area
  * status
  * action buttons: **Book Now** or **Book Reservation**

### Step 2: Rent selection

If user selects **Book Now**:

* kiosk asks the user to select rent type:

  * **Day Rent** with visible fixed price
  * **Hourly Rate** with visible hourly price
* show a clean pricing card UI
* if hourly is selected, allow user to select number of hours

### Step 3: User information

* kiosk asks for:

  * full name
  * email address
* include a **privacy consent checkbox**
* privacy text should be clear and professional

### Step 4: Payment method

* kiosk displays payment options:

  * **Cash**
  * **Card**
  * **QR Payment**
* once payment method is selected, show the corresponding payment step
* the UI should still feel kiosk-friendly and easy to follow

### Step 5: Payment confirmation

* payment is confirmed
* kiosk shows success screen

### Step 6: QR issuance

After successful payment:

* kiosk generates and displays a **QR code**
* show booking/session summary
* show desk assigned
* show rent type and time details
* confirm that a copy of the QR has also been sent to the user’s email

### Step 7: Email confirmation

* user receives a QR copy through email
* kiosk should visually mention:

  * “A copy of your QR has been sent to your email.”

---

# Flow 2: Walk-In Reservation Flow

This flow is for a walk-in user who does not want immediate use, but wants to reserve.

### Step 1: Interactive map selection

* same starting screen as walk-in guest
* user taps a desk on the map
* same modal appears:

  * desk details
  * **Book Now**
  * **Book Reservation**

### Step 2: Reservation action

If user selects **Book Reservation**:

* continue with reservation flow

### Step 3: Reservation details

Ask the user to complete reservation details:

* reservation date
* time slot
* duration
* rent type:

  * **Day Rent**
  * **Hourly Rate**

### Step 4: Alternative choices

For the reservation flow, ask the user to select **up to 4 alternative spaces** in case the preferred space becomes unavailable.

* allow the user to choose alternatives directly from the map
* selected alternatives should be visually highlighted
* make this easy and intuitive

### Step 5: User information

* ask for:

  * full name
  * email address
* include privacy consent checkbox

### Step 6: Payment method

* show:

  * Cash
  * Card
  * QR Payment

### Step 7: Payment confirmation

* payment confirmed
* show reservation success screen

### Step 8: QR issuance

* generate QR for the reservation
* display booking summary
* show preferred desk plus alternative selections
* confirm QR copy is sent to email

---

## Design requirements

* Make the kiosk interface feel like a **real product**, not just wireframes
* Touch-first, large tap targets
* Modern modal design
* Interactive map should feel central and alive
* Clear color-coded desk states
* Smooth end-to-end flow from map selection to QR issuance
* The same main map screen should support both:

  * immediate walk-in use
  * walk-in reservations
* Maintain a polished co-working/business aesthetic
* Keep screens visually connected and consistent

## Output expectation

Generate a **full kiosk user experience** with all connected screens for:

1. Main kiosk map interface
2. Desk selection modal
3. Book Now flow
4. Book Reservation flow
5. Payment selection
6. Payment confirmation
7. QR issuance
8. Email confirmation state

---

If you want, I can also make a **second Lovable prompt for the staff/admin dashboard** so the kiosk flow matches the full platform.
