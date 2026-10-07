import { CREDIT_NOTE, IMAGE_CREDITS } from '../../lib/images'

// TEMPLATE TEXT: fill in [brackets] and have it reviewed by a qualified lawyer before launch.
export const DOCS = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    sections: [
      { h: 'Who we are', p: ['STEW ("we", "us") is a campus food marketplace for students of the Kwame Nkrumah University of Science and Technology (KNUST). Operator: [company name], [address]. We handle personal data in line with the Data Protection Act, 2012 (Act 843) of Ghana.'] },
      { h: 'What we collect', p: ['Account details: your full name, KNUST student email, student reference ID, phone number, hall or area, and login and security codes we send to your email.', 'Order details: items, notes, timestamps, the pickup day and time you choose, the progress stages your chef marks, and the exact meeting point you and the chef agree in the app. The meeting point is personal data: it is stored with the order and shared with the other party, and with STEW support if there is a dispute.', 'Messages: the notes you and your chef send to each other about an order, which STEW can read if there is a dispute or a safety report.', 'Payment details: the Mobile Money number you pay with, the amount, the transaction reference and status we receive from Paystack, our payment processor, and whether you later confirmed collection. That confirmation is what releases the chef\'s payment, so we record it. Payment is taken in the app before you collect your food. We never see or store your MoMo PIN.', 'Support details: messages you send us, including when you report a problem. Files you attach, such as dispute photos or a student ID, currently send only the file name rather than the file itself.', 'Technical details: basic device data needed to run and secure the app, your notification setting if you turn on order notifications (and the push subscription endpoint for your device), and anonymous usage statistics (page views and key actions such as adding to tray) with no name, phone number or student ID attached. You can switch these off in Account.'] },
      { h: 'Why we use it', p: ['To create and verify your account and confirm you are a KNUST student; to process payments and orders; to handle support, disputes and food safety reports; to prevent fraud and keep the platform safe; and to improve the service.'] },
      { h: 'Who sees it', p: ['Chefs see your first name, the meeting point you agreed, your phone number (for handover and coordination) and your order details only. Paystack processes payments and returns a transaction reference and status to us. We may share information with authorities when the law requires it. We do not sell your personal data.'] },
      { h: 'Meeting safely', p: ['STEW is pickup only: there is no delivery and no riders. You and the chef agree a meeting point in the app, and each of you must confirm it before it is treated as agreed. Before a meetup we show both parties a safety notice: meet only in busy, public, well-lit places, never at a private residence or a secluded spot or anywhere you feel unsafe; meet in daylight; the place agreed in the app must be the actual place you meet; and tell someone where you are going.'] },
      { h: 'How long we keep it', p: ['We keep your data while your account is active and for [retention period] afterwards where needed for disputes, accounting or legal duties. You can ask us to delete your account.'] },
      { h: 'Your rights', p: ['You can ask to access, correct or delete your data, or object to certain uses. Contact us on {{contact}}. You may also complain to the Data Protection Commission of Ghana.'] },
      { h: 'Security', p: ['We use encryption in transit and access controls. You can log in with a one-time 6-digit code sent to your student email, or with a password. To reset your password we email you a code. Keep your password and your codes private and do not share them with anyone.', 'No system is perfectly secure, and STEW will never ask you for your MoMo PIN.'] },
      { h: 'Changes', p: ['We will update this policy when our practices change and show the new date at the top of the page.'] },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    sections: [
      { h: 'Who can use STEW', p: ['STEW is for current KNUST students with a valid KNUST student email. You must give accurate details and keep one account only.'] },
      { h: 'What STEW is', p: ['STEW is a marketplace that connects students with student chefs. Chefs are independent sellers who prepare and are responsible for their food. STEW is not the cook.'] },
      { h: 'Orders and payments', p: ['Prices are in Ghana cedis (GH¢) and all fees are shown before you pay. A 5% service fee is added on top of the menu price and paid by you; the chef receives the full menu price. Payment is taken in the app by Mobile Money and processed by Paystack before you collect your food. STEW never sees or stores your MoMo PIN. An order is confirmed once payment is approved and the chef accepts it.', 'STEW cooks in batches, not on demand. You choose a pickup day when you order, and your chef needs roughly a week to shop for ingredients and cook. Your order is not late until that day has passed without your food being ready.'] },
      { h: 'Where your money sits while you wait', p: ['You pay STEW, not the chef. We hold your payment while your food is being cooked. The chef is not paid until you confirm in the app that you have collected your food.', 'This is deliberate. It means that if a kitchen never cooks your order, or you never receive it, your money is still with STEW and can be returned to you instead of being chased from a student who has already spent it.', 'Until you confirm collection, the money is not STEW revenue and not the chef\'s money. It is held in a separate settlement account with our payment provider and released on your confirmation.', 'Once you confirm collection, we release the chef\'s share and the order is treated as completed, so it can no longer be refunded for a change of mind. If something was wrong with the food, report a problem instead of confirming, so we can hold the money while we look into it.'] },
      { h: 'Following your order', p: ['Your chef marks each stage of your order in the app: accepted, buying ingredients, cooking, portioning and packing, ready for pickup, and finally collected. You can watch these steps and you will be notified as they change. The stages are your chef telling you where the pot has reached; they are not a guarantee of an exact time.'] },
      { h: 'Messages with your chef', p: ['Each order has a message thread between you and your chef, for things like pepper level, allergies or running late. Keep it to the order and stay respectful: the Community Guidelines apply. STEW can read these messages if there is a dispute or a safety report. Do not use the thread to arrange payment outside the app.'] },
      { h: 'Payments and fees', p: ['Your total is the menu price plus the 5% service fee. You pay in the app before collecting your food; nothing is paid in cash at the meetup, and never send Mobile Money to a chef directly. Paystack processes the payment and STEW stores the transaction reference and status so we can trace your order and any refund. If a payment fails or is reversed, no order is created.'] },
      { h: 'Pickup and meeting points', p: ['STEW is pickup only. There is no delivery and there are no riders. You and the chef agree a meeting point in the app, and both of you must confirm it before it is treated as agreed. The agreed meeting point is stored with the order, shared with the chef, and shared with STEW support if there is a dispute. Please be reachable on your phone and arrive on time.'] },
      { h: 'Meeting safely', p: ['Before a meetup we show both parties a safety notice. Meet only in busy, public, well-lit places; never at a private residence, a secluded spot, or anywhere you feel unsafe; meet in daylight; the place agreed in the app must be the actual place you meet; and tell someone where you are going. If anything feels wrong, do not go. Report the order in the app instead.'] },
      { h: 'Allergies and dietary needs', p: ['Menus may not list every ingredient. If you have allergies, ask the chef before ordering. We cannot guarantee allergen-free preparation.'] },
      { h: 'Cancellations, refunds and disputes', p: ['You may cancel within 2 minutes of ordering, and only while the kitchen has not started cooking (while your order still shows as accepted). Once your chef begins buying or cooking, the order cannot be cancelled. Valid refunds are returned to the MoMo number you paid with. See our Refund Policy. Raise problems through the app so we can review them fairly.', 'If your chef does not have your food ready on the pickup day you chose, report it in the app. We will chase the kitchen and refund you if it cannot be resolved.'] },
      { h: 'Acceptable use', p: ['Follow the Community Guidelines. Do not misuse the platform, impersonate others, harass people, post false reviews or try to bypass payments.'] },
      { h: 'Suspension', p: ['We may suspend or close accounts that break these terms or put others at risk.'] },
      { h: 'Liability', p: ['To the extent allowed by law, we are not liable for indirect losses or for the actions of chefs. Nothing here limits rights you have under Ghanaian law.'] },
      { h: 'Governing law', p: ['These terms are governed by the laws of the Republic of Ghana. Contact: {{contact}}.'] },
    ],
  },
  {
    slug: 'guidelines',
    title: 'Community Guidelines',
    sections: [
      { h: 'Be respectful', p: ['Treat students and chefs with respect. No harassment, hate speech or threats.'] },
      { h: 'Be honest', p: ['Chefs: describe food, prices and stock accurately. Students: leave honest, fair reviews and report real problems only.'] },
      { h: 'Keep handovers safe', p: ['STEW is pickup only, so you meet the other party in person. Agree the meeting point in the app and confirm it before it counts as agreed, and meet at that same place. Do not ask anyone to meet somewhere unsafe or private.'] },
      { h: 'Protect privacy', p: ['Do not share other people\'s phone numbers, photos or details.'] },
      { h: 'Meeting safely', p: ['Before a meetup, both parties are shown a safety notice. Meet only in busy, public, well-lit places; never at a private residence, a secluded spot or anywhere you feel unsafe; meet in daylight; the place agreed in the app must be the actual place you meet; and tell someone where you are going. Both of you must confirm the meeting point before it is agreed.'] },
      { h: 'Report problems', p: ['Use "Report a problem" in the app. Food safety concerns are treated as priority.'] },
      { h: 'Consequences', p: ['Breaking these guidelines can lead to warnings, removal of content or suspension.'] },
    ],
  },
  {
    slug: 'food-safety',
    title: 'Food Safety Standards',
    sections: [
      { h: 'Chef standards', p: ['Chefs must prepare food in a clean space, wash hands and equipment, store food at safe temperatures, use fresh ingredients, never sell expired or spoiled food, and label common allergens where they know them. Kitchens are approved on this basis; today an application sends only the file name of a kitchen photo, not the image itself.'] },
      { h: 'Packaging and handover', p: ['Food must be covered and packed so it stays hot or cold as appropriate and is not contaminated on the way to the meetup point.'] },
      { h: 'If something is wrong', p: ['Do not eat food that smells, tastes or looks off. If you feel unwell, seek medical help first, then report a food safety concern in the app. You can describe the problem and send a photo; today only the file name of an attached photo reaches us.'] },
      { h: 'How we respond', p: ['Food safety reports are escalated as priority. We may pause a kitchen while we investigate and may remove chefs who put students at risk.'] },
    ],
  },
  {
    slug: 'refunds',
    title: 'Refund Policy',
    sections: [
      { h: 'When you may get a refund', p: ['You may cancel within 2 minutes of ordering, and only while the kitchen has not started cooking; a valid cancellation is refunded. Once your chef begins buying ingredients or cooking, the order cannot be cancelled. You may also get a refund for missing or wrong items, an order the chef cancels after payment, food that was not ready on the pickup day you chose, a payment we can see twice for the same order, and a verified food safety issue. Store credit is never given in place of a refund.'] },
      { h: 'How to ask', p: ['Cancel from the order screen within 2 minutes. For anything else, open the order and tap "Report a problem" within [24 hours] of collection or the expected meetup time. If relevant, describe what went wrong; today a photo attachment sends only its file name, so tell us in words too.'] },
      { h: 'What is usually not covered', p: ['Change of mind after cooking has started or after the 2-minute window, a wrong hall, phone number or meeting point entered by you, or not turning up to collect your order.'] },
      { h: 'The 5% service fee', p: ['Your total already includes a 5% service fee on top of the menu price; the chef receives the full menu price. On a refund, [whether the 5% service fee is refunded].'] },
      { h: 'How refunds are paid', p: ['Approved refunds go back by Mobile Money to the MoMo number you used to pay. Timing depends on the provider: [typical timeframe].', 'Because we hold your payment until you confirm collection, a refund on an order you never collected is straightforward: the money is still with us. Once you have confirmed collection and we have released the chef\'s share, a refund depends on recovering that money, which is why you should report a problem rather than confirm if anything is wrong.'] },
    ],
  },
  {
    slug: 'vendor-terms',
    title: 'Vendor Terms',
    sections: [
      { h: 'Who can sell', p: ['Current KNUST students whose application has been approved. You are an independent seller, not an employee of STEW.'] },
      { h: 'Your responsibilities', p: ['Keep your menu, prices and stock accurate; follow the Food Safety Standards; prepare orders on time; agree and confirm a meeting point in the app before every handover; and handle customers respectfully. Kitchens are approved on your word for now: a kitchen photo upload sends only the file name, not the image, so we do not review photos.'] },
      { h: 'Fees and payouts', p: ['STEW charges 5% of the menu price, added to the customer\'s total rather than deducted from your earnings. Earnings are paid to the MoMo number you provide on a [weekly] schedule, minus any approved refunds or adjustments.'] },
      { h: 'When you get paid', p: ['A student pays STEW, not you. We hold the money while you cook and release your share once the student confirms in the app that they collected the food.', 'This protects you as much as them. Because the money is still with us until collection is confirmed, a student cannot take the food, claim they never received it and leave you unpaid — the payment is already secured. Follow the preparation stages honestly and mark an order ready only when it genuinely is, and confirmation normally follows.', 'If a student collects but does not confirm, use the reminder in the app and contact STEW. We can release the payment on the evidence of your stage marks and messages. If you and a student cannot agree, STEW decides, and we may hold the money until we do.', 'If you cancel an order we have to return the student\'s money, including anything already held for you. If we have already released money to you for an order that is later refunded, we may deduct it from your next payout.'] },
      { h: 'Reviews and disputes', p: ['Customers can rate orders and open disputes. You may be asked to respond with evidence.'] },
      { h: 'Orders and pickups', p: ['A student may cancel within 2 minutes of ordering, and only while you have not started cooking; once you mark the order as buying ingredients or cooking it cannot be cancelled. You may cancel an order you cannot fulfil, and we will refund the student.', 'You must keep your preparation stages up to date. Tapping accepted, buying ingredients, cooking, portioning and packing, and ready for pickup is what tells the student where their food has reached and prompts their notifications. Do not mark an order ready before the food is actually ready to hand over.', 'All orders are collected in person at the meeting point you both confirm in the app, on the pickup day the student chose. If you cannot make that day, tell the student in the order thread as early as you can.', 'The order thread is for coordinating this order only. Do not ask students to pay you outside the app.'] },
      { h: 'Suspension', p: ['We may pause or remove kitchens for safety concerns, repeated complaints, false information or breaking the rules.'] },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookies & Local Storage',
    sections: [
      { h: 'What we store on your device', p: ['We use your browser\'s local storage, not tracking cookies, to keep you logged in, remember your tray, favorites, recent searches, theme (light or dark) and your Account settings, to hold the state of a payment while it is being confirmed, to remember whether you turned order notifications or anonymous usage counts on or off, and to let the app work offline.'] },
      { h: 'Tracking', p: ['We do not use advertising trackers. We count anonymous usage (page views and key actions such as adding to tray) to improve the app. These counts carry no name, phone number or student ID, and you can turn them off in Account. We also honour your browser\'s Do Not Track setting.'] },
      { h: 'Your choices', p: ['You can clear site data in your browser settings at any time. You will be logged out and your tray will be emptied.'] },
    ],
  },
]

// Photo credits. The images shipped in public/foods/ are Creative Commons licensed, and
// several of those licences REQUIRE this attribution, so do not remove this document.
const CREDITS = {
  slug: 'credits',
  title: 'Photo Credits',
  sections: [
    { h: 'About these photos', p: [CREDIT_NOTE] },
    ...IMAGE_CREDITS.map((c) => ({
      h: c.dish,
      p: [`Photo: ${c.author} — ${c.licence}. Used under the terms of that licence. Original file and licence: ${c.source}`],
    })),
    { h: 'Reusing our content', p: ['The STEW name, logo and app design belong to us. The dish photos above belong to the photographers named and are used here under their Creative Commons licences, which also allow you to reuse them if you credit the photographer and keep the same licence.'] },
  ],
}

// What the navigation shows: the legal documents people can open.
export const NAV_DOCS = [...DOCS, CREDITS]
export { CREDITS }
