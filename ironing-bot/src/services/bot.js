const prisma = require('./db');
const whatsapp = require('./whatsapp');

// In-memory state store for customer chat sessions
// Keys are customer phone numbers, values are { state: string, tempDetails: Object }
const chatStates = {};

const STATES = {
  // Registration Flow
  REG_AWAIT_NAME: 'REG_AWAIT_NAME',
  REG_AWAIT_ADDRESS: 'REG_AWAIT_ADDRESS',
  REG_AWAIT_LOCATION: 'REG_AWAIT_LOCATION',
  REG_AWAIT_LANDMARK: 'REG_AWAIT_LANDMARK',

  // Main Menu State
  MAIN_MENU: 'MAIN_MENU',

  // Order Placement Flow
  ORDER_AWAIT_COUNT: 'ORDER_AWAIT_COUNT',
  ORDER_AWAIT_DATE: 'ORDER_AWAIT_DATE',
  ORDER_AWAIT_SLOT: 'ORDER_AWAIT_SLOT',
  ORDER_AWAIT_CONFIRM: 'ORDER_AWAIT_CONFIRM',

  // Address Update Flow
  UPDATE_AWAIT_NAME: 'UPDATE_AWAIT_NAME',
  UPDATE_AWAIT_ADDRESS: 'UPDATE_AWAIT_ADDRESS',
  UPDATE_AWAIT_LOCATION: 'UPDATE_AWAIT_LOCATION',
  UPDATE_AWAIT_LANDMARK: 'UPDATE_AWAIT_LANDMARK',

  // Support Flow
  SUPPORT_AWAIT_TICKET: 'SUPPORT_AWAIT_TICKET',

  // Tracking Flow
  ORDER_AWAIT_TRACK: 'ORDER_AWAIT_TRACK'
};

/**
 * Main entrance for handling user incoming text or location messages.
 * @param {string} from - Customer phone number.
 * @param {Object} message - Incoming WhatsApp message payload.
 */
async function handleTextMessage(from, message) {
  const customer = await prisma.customer.findUnique({
    where: { phone: from }
  });

  // If customer doesn't exist OR has pending registration steps, initiate registration flow
  const isPendingReg = !customer || 
                       customer.address === 'PENDING_ADDRESS' || 
                       customer.landmark === 'PENDING_LOCATION' || 
                       customer.landmark === 'PENDING_LANDMARK';

  if (isPendingReg) {
    await handleRegistration(from, message, customer);
    return;
  }

  // Handle active session state machine or command inputs
  const session = chatStates[from];
  const textBody = (message.text?.body || '').trim().toLowerCase();

  // If customer types a reset greeting, clear state and show main menu
  if (textBody === 'hi' || textBody === 'hello' || textBody === 'hey' || textBody === 'start' || textBody === 'menu') {
    delete chatStates[from];
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    await whatsapp.sendMessage(
      from, 
      `Hi ${customer.name} 👋 Welcome back to Ironing Service! We are so happy to serve you again. ❤️\n\n👔 Check out our service rates:\n📄 Price List PDF: ${backendUrl}/uploads/price_list.pdf`
    );
    await sendMainMenu(from, customer.name);
    return;
  }

  // Route commands (Allows typing numbers or titles)
  if (!session || session.state === STATES.MAIN_MENU) {
    if (textBody === '1' || textBody.includes('pickup') || textBody.includes('new')) {
      chatStates[from] = { state: STATES.ORDER_AWAIT_COUNT, tempDetails: {} };
      await whatsapp.sendMessage(from, 'How many clothes approx.?');
      return;
    }
    if (textBody === '2' || textBody.includes('track') || textBody.includes('status')) {
      await handleCheckOrder(from);
      return;
    }
    if (textBody === '3' || textBody.includes('change') || textBody.includes('details')) {
      chatStates[from] = { state: STATES.UPDATE_AWAIT_NAME, tempDetails: {} };
      await whatsapp.sendMessage(from, 'What is your full name?');
      return;
    }
    if (textBody === '4' || textBody.includes('support')) {
      await sendSupportMenu(from);
      return;
    }

    // Default sends menu
    await sendMainMenu(from, customer.name);
    return;
  }

  // Process text messages based on active state
  switch (session.state) {
    case STATES.ORDER_AWAIT_COUNT:
      await handleOrderCountInput(from, message.text?.body);
      break;
    case STATES.SUPPORT_AWAIT_TICKET:
      await handleSupportTicketInput(from, message.text?.body);
      break;
    case STATES.ORDER_AWAIT_TRACK:
      await handleTrackSpecificOrder(from, message.text?.body);
      break;
    case STATES.UPDATE_AWAIT_NAME:
    case STATES.UPDATE_AWAIT_ADDRESS:
    case STATES.UPDATE_AWAIT_LOCATION:
    case STATES.UPDATE_AWAIT_LANDMARK:
      await handleUpdateFlow(from, message);
      break;
    default:
      // If customer is registered but state is out of sync, send menu
      await sendMainMenu(from, customer.name);
      break;
  }
}

/**
 * Main entrance for handling interactive button clicks.
 * @param {string} from - Customer phone number.
 * @param {string} buttonId - Selected button identifier.
 */
async function handleButtonClick(from, buttonId) {
  const customer = await prisma.customer.findUnique({
    where: { phone: from }
  });

  if (!customer) {
    // If not registered, reset session state to start registration
    chatStates[from] = { state: STATES.REG_AWAIT_NAME, tempDetails: {} };
    await whatsapp.sendMessage(from, `Welcome to Ironing Service! 👋 Looks like you're new here.\n\nWhat's your name?`);
    return;
  }

  // Main menu handlers
  if (buttonId === 'place_order') {
    chatStates[from] = { state: STATES.ORDER_AWAIT_COUNT, tempDetails: {} };
    await whatsapp.sendMessage(from, 'How many clothes approx.?');
    return;
  }

  if (buttonId === 'check_order') {
    await handleCheckOrder(from);
    return;
  }

  if (buttonId === 'price_list') {
    await sendPriceList(from);
    return;
  }

  if (buttonId === 'confirm_yes') {
    if (chatStates[from]?.state === STATES.ORDER_AWAIT_CONFIRM) {
      const count = chatStates[from].tempDetails.count;
      try {
        const order = await prisma.order.create({
          data: {
            customerPhone: from,
            pickupDate: 'Today',
            pickupSlot: 'Evening',
            status: 'CONFIRMED',
            paymentStatus: 'Pending',
            customerNameSnapshot: customer.name,
            pickupAddress: customer.address,
            pickupLandmark: customer.landmark
          }
        });
        
        if (global.emitSSE) {
          global.emitSSE('orders_updated', { message: 'New order created' });
        }

        delete chatStates[from];

        await whatsapp.sendMessage(
          from, 
          `✅ Order #${order.id} booking confirmed! Our pickup partner will reach your destination between 7 pm to 9 pm. 🧺✨\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
        );
      } catch (error) {
        console.error('Error auto-creating order:', error);
        await whatsapp.sendMessage(from, 'Failed to place order. Please try again later or contact support.');
      }
    } else {
      await sendMainMenu(from, customer.name);
    }
    return;
  }

  if (buttonId === 'confirm_no') {
    if (chatStates[from]?.state === STATES.ORDER_AWAIT_CONFIRM) {
      delete chatStates[from];
      await whatsapp.sendMessage(from, "No worries! Your order has been cancelled. We'll be right here whenever you're ready to use our service again. Have a great day! 😊");
    } else {
      await sendMainMenu(from, customer.name);
    }
    return;
  }

  if (buttonId === 'update_addr') {
    chatStates[from] = { state: STATES.UPDATE_AWAIT_NAME, tempDetails: {} };
    await whatsapp.sendMessage(from, 'What is your full name?');
    return;
  }

  if (buttonId === 'support') {
    await sendSupportMenu(from);
    return;
  }

  // Support ticket options
  if (buttonId.startsWith('support_')) {
    const categoryMap = {
      support_missing: 'ClothMissing',
      support_damage: 'ClothDamage',
      support_delay: 'Delay',
      support_payment: 'Payment',
      support_other: 'Other'
    };
    const category = categoryMap[buttonId];
    if (category) {
      chatStates[from] = { state: STATES.SUPPORT_AWAIT_TICKET, tempDetails: { category } };
      await whatsapp.sendMessage(from, 'Please describe your query in detail, and we will log a ticket:');
      return;
    }
  }

  // Fallback if button didn't match anything
  await sendMainMenu(from, customer.name);
}

/**
 * Handle step-by-step registration messages.
 */
async function handleRegistration(from, message, existingCustomer) {
  const text = (message.text?.body || '').trim();
  const lowerText = text.toLowerCase();
  const GREETINGS = ['hi', 'hello', 'hey', 'start', 'menu', 'hola', 'hy', 'hii', 'hiii', 'hi2'];

  // Step 1: Ask for Name
  if (!existingCustomer) {
    if (!text || GREETINGS.includes(lowerText)) {
      await whatsapp.sendMessage(from, `Welcome to Ironing Service! 👋 Looks like you're new here.\n\nWhat's your name?`);
      return;
    }

    await prisma.customer.create({
      data: {
        phone: from,
        name: text,
        address: 'PENDING_ADDRESS'
      }
    });

    await whatsapp.sendMessage(from, `Nice to meet you, ${text}! 👋\n\nGreat! Please share your pickup address.`);
    return;
  }

  // Step 2: Ask for Address
  if (existingCustomer.address === 'PENDING_ADDRESS') {
    if (!text || GREETINGS.includes(lowerText)) {
      await whatsapp.sendMessage(from, `Please share your pickup address to continue:`);
      return;
    }

    await prisma.customer.update({
      where: { phone: from },
      data: { 
        address: text,
        landmark: 'PENDING_LOCATION'
      }
    });

    await whatsapp.sendMessage(from, `Got it! Address saved.\n\nPlease share your location pin (tap 📎 → Location or send Google Maps link).`);
    return;
  }

  // Step 3: Ask for Location Pin / Google Maps Link
  if (existingCustomer.landmark === 'PENDING_LOCATION') {
    let lat = null;
    let lng = null;
    let skip = false;

    if (message.type === 'location' && message.location) {
      lat = message.location.latitude;
      lng = message.location.longitude;
    } else if (text) {
      if (lowerText === 'skip' || lowerText === 'none') {
        skip = true;
      } else if (text.includes('maps.google.com') || text.includes('goo.gl') || text.includes('maps.app.goo.gl')) {
        const qMatch = text.match(/q=([0-9.-]+)%2C([0-9.-]+)/) || text.match(/q=([0-9.-]+),([0-9.-]+)/) || text.match(/@([0-9.-]+),([0-9.-]+)/);
        if (qMatch) {
          lat = parseFloat(qMatch[1]);
          lng = parseFloat(qMatch[2]);
        } else {
          skip = true;
        }
      } else {
        const coords = text.split(',');
        if (coords.length === 2) {
          lat = parseFloat(coords[0].trim());
          lng = parseFloat(coords[1].trim());
        }
      }
    }

    if (!skip && (lat === null || lng === null || isNaN(lat) || isNaN(lng))) {
      await whatsapp.sendMessage(from, 'Could not parse location coordinates. Please share your location pin (tap 📎 → Location) or reply with "skip" to bypass:');
      return;
    }

    await prisma.customer.update({
      where: { phone: from },
      data: {
        latitude: lat,
        longitude: lng,
        landmark: 'PENDING_LANDMARK'
      }
    });

    await whatsapp.sendMessage(from, 'Please enter a nearby landmark (or type "skip" to bypass):');
    return;
  }

  // Step 4: Ask for Landmark
  if (existingCustomer.landmark === 'PENDING_LANDMARK') {
    if (!text) {
      await whatsapp.sendMessage(from, 'Please enter a landmark or type "skip" to bypass:');
      return;
    }

    const landmarkVal = (lowerText === 'none' || lowerText === 'skip') ? '' : text;

    const finalCustomer = await prisma.customer.update({
      where: { phone: from },
      data: { landmark: landmarkVal }
    });

    await whatsapp.sendMessage(from, `You're all set, ${finalCustomer.name}!`);

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    await whatsapp.sendMessage(
      from,
      `👔 Check out our service rates:\n📄 Price List PDF: ${backendUrl}/uploads/price_list.pdf`
    );

    await sendMainMenu(from, finalCustomer.name);
    return;
  }
}

/**
 * Handle placing order cloth count.
 */
/**
 * Handle placing order cloth count.
 * Directly creates the order with default slot/date parameters.
 */
async function handleOrderCountInput(from, countText) {
  const count = parseInt((countText || '').trim());
  if (isNaN(count) || count <= 0) {
    await whatsapp.sendMessage(from, 'Please enter a valid positive number for the cloth count:');
    return;
  }

  try {
    // Save the count in tempDetails and transition to ORDER_AWAIT_CONFIRM
    chatStates[from] = { state: STATES.ORDER_AWAIT_CONFIRM, tempDetails: { count } };

    await whatsapp.sendButtons(
      from,
      `You have approximately ${count} clothes. Are you sure you want to confirm your order?`,
      [
        { type: 'reply', reply: { id: 'confirm_yes', title: 'Yes' } },
        { type: 'reply', reply: { id: 'confirm_no', title: 'No' } }
      ]
    );
  } catch (error) {
    console.error('Error sending confirmation buttons:', error);
    await whatsapp.sendMessage(from, 'An error occurred. Please try again.');
  }
}

/**
 * Handle support description input.
 */
async function handleSupportTicketInput(from, description) {
  const session = chatStates[from];
  if (!description || description.trim().length < 5) {
    await whatsapp.sendMessage(from, 'Please provide a brief description of the issue (at least 5 characters):');
    return;
  }

  try {
    // Find customer's latest order (excluding cancelled ones) to automatically link
    const latestOrder = await prisma.order.findFirst({
      where: {
        customerPhone: from,
        status: { not: 'CANCELLED' }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const ticket = await prisma.supportTicket.create({
      data: {
        customerPhone: from,
        orderId: latestOrder ? latestOrder.id : null,
        category: session.tempDetails.category,
        issue: description,
        status: 'Open'
      }
    });

    delete chatStates[from];
    await whatsapp.sendMessage(from, `Support ticket #${ticket.id} has been logged. Our administrative team will reach out to you shortly.`);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    await whatsapp.sendMessage(from, 'Failed to create support ticket. Please try again later.');
  }
}

async function sendMainMenu(from, customerName) {
  await whatsapp.sendList(
    from, 
    "How can we help you today?", 
    "Select Options",
    [
      { id: 'place_order', title: '1️⃣ New Pickup' },
      { id: 'check_order', title: '2️⃣ Track Order' },
      { id: 'update_addr', title: '3️⃣ Change Details' },
      { id: 'support', title: '4️⃣ Support' }
    ]
  );
}

/**
 * Show price catalog.
 */
async function sendPriceList(from) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  await whatsapp.sendMessage(from, `📄 View our complete Price List PDF:\n${backendUrl}/uploads/price_list.pdf`);
}

/**
 * Displays active/recent orders.
 */
async function handleCheckOrder(from) {
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        customerPhone: from,
        status: { notIn: ['DELIVERED', 'CANCELLED'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (activeOrders.length === 0) {
      await whatsapp.sendMessage(from, 'You have no active orders at the moment. You can place one from the main menu!');
      return;
    }

    if (activeOrders.length === 1) {
      const order = activeOrders[0];
      await whatsapp.sendMessage(
        from, 
        `Order #${order.id} — Your order will be delivered today estimated time between 7pm to 9pm.\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
      );
      return;
    }

    // Multiple orders
    chatStates[from] = { state: STATES.ORDER_AWAIT_TRACK, tempDetails: {} };
    let listText = `You have ${activeOrders.length} active orders:\n\n`;
    activeOrders.forEach((o, i) => {
      listText += `${i + 1}. Order #${o.id}\n`;
    });
    listText += '\nTo check a specific order, type the number (e.g. 12):';
    await whatsapp.sendMessage(from, listText);
  } catch (error) {
    console.error('Check order error:', error);
    await whatsapp.sendMessage(from, 'Error checking order status. Please try again.');
  }
}

/**
 * Handle user typing order number to check status.
 */
async function handleTrackSpecificOrder(from, text) {
  const orderId = parseInt((text || '').trim());
  if (isNaN(orderId)) {
    await whatsapp.sendMessage(from, 'Please type a valid order number (e.g. 12):');
    return;
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerPhone: from
      }
    });

    if (!order) {
      await whatsapp.sendMessage(from, `Could not find Order #${orderId} under your phone number. Please type a valid order number:`);
      return;
    }

    delete chatStates[from]; // Clear session
    
    await whatsapp.sendMessage(
      from,
      `Order #${order.id} — Your order will be delivered today estimated time between 7pm to 9pm.\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
    );
  } catch (error) {
    console.error('Track specific order error:', error);
    await whatsapp.sendMessage(from, 'Error looking up order. Please try again.');
  }
}

/**
 * Opens support category selection.
 */
async function sendSupportMenu(from) {
  await whatsapp.sendButtons(from, 'Select the category for your query:', [
    { type: 'reply', reply: { id: 'support_missing', title: 'Cloth Missing' } },
    { type: 'reply', reply: { id: 'support_damage', title: 'Cloth Damage' } },
    { type: 'reply', reply: { id: 'support_other', title: 'Other Query' } }
  ]);
}

/**
 * Customer accepts the cloth check issues reported by the partner.
 */
async function acceptClothIssue(from) {
  try {
    const activeOrder = await prisma.order.findFirst({
      where: {
        customerPhone: from,
        clothCheckStatus: 'IssuesFound'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeOrder) {
      await whatsapp.sendMessage(from, 'No active cloth check issues found.');
      return;
    }

    await prisma.order.update({
      where: { id: activeOrder.id },
      data: { clothCheckStatus: 'CustomerAccepted' }
    });

    await whatsapp.sendMessage(
      from,
      `Thank you! You have accepted the condition report for Order #${activeOrder.id}. Our partner will proceed with the item count and request payment.`
    );
  } catch (error) {
    console.error('Error accepting cloth issue:', error);
    await whatsapp.sendMessage(from, 'Failed to record response. Please try again.');
  }
}

/**
 * Customer rejects the cloth check issues and requests support contact.
 */
async function escalateToSupport(from) {
  try {
    const activeOrder = await prisma.order.findFirst({
      where: {
        customerPhone: from,
        clothCheckStatus: 'IssuesFound'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeOrder) {
      await whatsapp.sendMessage(from, 'No active cloth check issues found.');
      return;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        customerPhone: from,
        orderId: activeOrder.id,
        category: 'ClothDamage',
        issue: 'Automated ticket from partner app cloth check issues',
        status: 'Open'
      }
    });

    await whatsapp.sendMessage(
      from,
      `Support ticket #${ticket.id} has been created. An administrator will call you shortly to resolve this.`
    );
  } catch (error) {
    console.error('Error escalating to support:', error);
    await whatsapp.sendMessage(from, 'Failed to log ticket. Please try again.');
  }
}

/**
 * Handle single-message customer details update flow.
 */
async function handleUpdateFlow(from, message) {
  const session = chatStates[from];
  const text = (message.text?.body || '').trim();

  if (session.state === STATES.UPDATE_AWAIT_NAME) {
    if (!text) {
      await whatsapp.sendMessage(from, 'Invalid name. What is your full name?');
      return;
    }
    session.tempDetails.name = text;
    session.state = STATES.UPDATE_AWAIT_ADDRESS;
    await whatsapp.sendMessage(from, 'Please share your new pickup address.');
    return;
  }

  if (session.state === STATES.UPDATE_AWAIT_ADDRESS) {
    if (!text) {
      await whatsapp.sendMessage(from, 'Invalid address. Please share your new pickup address.');
      return;
    }
    session.tempDetails.address = text;
    session.state = STATES.UPDATE_AWAIT_LOCATION;
    await whatsapp.sendMessage(from, 'Please share your new location pin (tap 📎 → Location).');
    return;
  }

  if (session.state === STATES.UPDATE_AWAIT_LOCATION) {
    let lat = null;
    let lng = null;
    let skip = false;

    if (message.type === 'location' && message.location) {
      lat = message.location.latitude;
      lng = message.location.longitude;
    } else if (text) {
      const lowerText = text.toLowerCase();
      if (lowerText === 'skip' || lowerText === 'none') {
        skip = true;
      } else {
        const coords = text.split(',');
        if (coords.length === 2) {
          lat = parseFloat(coords[0].trim());
          lng = parseFloat(coords[1].trim());
        }
      }
    }

    if (!skip && (lat === null || lng === null || isNaN(lat) || isNaN(lng))) {
      await whatsapp.sendMessage(from, 'Could not parse coordinates. Please share your location pin (tap 📎 → Location) or reply with "skip" to bypass:');
      return;
    }

    session.tempDetails.latitude = lat;
    session.tempDetails.longitude = lng;
    session.state = STATES.UPDATE_AWAIT_LANDMARK;
    await whatsapp.sendMessage(from, 'Please enter a nearby landmark (or type "skip" to bypass):');
    return;
  }

  if (session.state === STATES.UPDATE_AWAIT_LANDMARK) {
    if (!text) {
      await whatsapp.sendMessage(from, 'Please enter a landmark or type "skip" to bypass:');
      return;
    }
    const lowerText = text.toLowerCase();
    const landmark = (lowerText === 'none' || lowerText === 'skip') ? '' : text;

    try {
      // Only update the customer's master profile so future orders use the new details.
      // We do NOT update the active/current order so it doesn't mess up existing deliveries.
      await prisma.customer.update({
        where: { phone: from },
        data: {
          name: session.tempDetails.name,
          address: session.tempDetails.address,
          latitude: session.tempDetails.latitude,
          longitude: session.tempDetails.longitude,
          landmark: landmark
        }
      });

      delete chatStates[from]; // Update completed
      await whatsapp.sendMessage(
        from,
        `✅ Details updated successfully!\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
      );
    } catch (error) {
      console.error('Error updating customer details:', error);
      await whatsapp.sendMessage(from, 'An error occurred during updating details. Please try again by typing Hi.');
    }
  }
}

module.exports = {
  handleTextMessage,
  handleButtonClick
};
