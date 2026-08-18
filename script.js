let currentRole = 'buyer';

// Global Timer Variables
let loginTimerInterval;
let regTimerInterval;

// --- CUSTOM POP-UP (TOAST) FUNCTION ---
function showToast(message, type = "success") {
    // Agar pehle se koi pop-up hai, to usko hata do
    let existingToast = document.getElementById('customToast');
    if (existingToast) existingToast.remove();

    // Naya pop-up banayein
    let toast = document.createElement('div');
    toast.id = 'customToast';
    toast.className = `custom-toast ${type}`;
    toast.innerText = message;

    document.body.appendChild(toast);

    // Dikhane ka animation (thoda delay dekar class add karte hain)
    setTimeout(() => toast.classList.add('show'), 10);

    // 3 second baad auto-hide kar do
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Gayab hone ke baad delete
    }, 3000);
}

function toggleAuth() {
    document.getElementById('loginBox').classList.toggle('hidden');
    document.getElementById('registerBox').classList.toggle('hidden');
    
    // --- Login Form Reset Karein ---
    document.getElementById('emailStep').classList.remove('hidden');
    document.getElementById('otpStep').classList.add('hidden');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginOtp').value = '';
    clearInterval(loginTimerInterval); 
    
    // --- Registration Form Reset Karein ---
    document.getElementById('regDetailsStep').classList.remove('hidden');
    document.getElementById('regOtpStep').classList.add('hidden');
    document.getElementById('regName').value = '';
    document.getElementById('regUsername').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regMobile').value = '';
    document.getElementById('regPass').value = '';
    document.getElementById('regOtp').value = '';
    clearInterval(regTimerInterval); 
}

// Timer for Login OTP
function startLoginTimer() {
    clearInterval(loginTimerInterval);
    let timeLeft = 60;
    document.getElementById('loginTimerText').classList.remove('hidden');
    document.getElementById('loginResendBtn').classList.add('hidden');
    document.getElementById('loginTimer').innerText = timeLeft;
    
    loginTimerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('loginTimer').innerText = timeLeft;
        if(timeLeft <= 0) {
            clearInterval(loginTimerInterval);
            document.getElementById('loginTimerText').classList.add('hidden');
            document.getElementById('loginResendBtn').classList.remove('hidden');
        }
    }, 1000);
}

// Timer for Registration OTP
function startRegTimer() {
    clearInterval(regTimerInterval);
    let timeLeft = 60;
    document.getElementById('regTimerText').classList.remove('hidden');
    document.getElementById('regResendBtn').classList.add('hidden');
    document.getElementById('regTimer').innerText = timeLeft;
    
    regTimerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('regTimer').innerText = timeLeft;
        if(timeLeft <= 0) {
            clearInterval(regTimerInterval);
            document.getElementById('regTimerText').classList.add('hidden');
            document.getElementById('regResendBtn').classList.remove('hidden');
        }
    }, 1000);
}

// --- REGISTRATION OTP LOGIC ---

async function requestRegisterOTP() {
    const name = document.getElementById('regName').value, username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value, mobile = document.getElementById('regMobile').value;
    const password = document.getElementById('regPass').value;
    
    if(!name || !username || !email || !mobile || !password) return showToast("Please fill all details first!", "error");

    document.getElementById('loaderOverlay').classList.remove('hidden');

    try {
        const response = await fetch('/api/send-register-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, username: username })
        });
        const data = await response.json();
        
        document.getElementById('loaderOverlay').classList.add('hidden');
        
        if (response.ok) {
            document.getElementById('regDetailsStep').classList.add('hidden');
            document.getElementById('regOtpStep').classList.remove('hidden');
            startRegTimer(); 
            showToast(data.message, "success");
        } else {
            showToast("Error: " + data.error, "error");
        }
    } catch (e) { 
        document.getElementById('loaderOverlay').classList.add('hidden');
        showToast('Server error while sending OTP', "error"); 
    }
}

async function registerUser() {
    const name = document.getElementById('regName').value, username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value, mobile = document.getElementById('regMobile').value;
    const password = document.getElementById('regPass').value;
    const otp = document.getElementById('regOtp').value;

    if(!otp) return showToast("Please enter the 4-digit OTP!", "error");

    try {
        const response = await fetch('/register', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ name, username, email, mobile, password, otp }) 
        });
        const data = await response.json();
        
        if (response.ok) { 
            showToast(data.message, "success"); 
            document.getElementById('regDetailsStep').classList.remove('hidden');
            document.getElementById('regOtpStep').classList.add('hidden');
            document.getElementById('regOtp').value = '';
            toggleAuth(); 
        } else {
            showToast("Error: " + data.error, "error");
        }
    } catch (e) { showToast('Server error', "error"); }
}

// --- OTP LOGIN LOGIC ---

async function requestOTP() {
    const email = document.getElementById('loginEmail').value;
    if(!email) return showToast("Please enter your registered email!", "error");

    document.getElementById('loaderOverlay').classList.remove('hidden');

    try {
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await response.json();
        
        document.getElementById('loaderOverlay').classList.add('hidden');
        
        if (response.ok) {
            document.getElementById('emailStep').classList.add('hidden'); 
            document.getElementById('otpStep').classList.remove('hidden'); 
            startLoginTimer(); 
            showToast(data.message, "success");
        } else {
            showToast("Error: " + data.error, "error");
        }
    } catch (e) { 
        document.getElementById('loaderOverlay').classList.add('hidden');
        showToast('Server error while sending OTP', "error"); 
    }
}
async function verifyOTPLogin() {
    const email = document.getElementById('loginEmail').value;
    const otp = document.getElementById('loginOtp').value;
    
    if(!otp) return showToast("Please enter the 4-digit OTP!", "error");

    try {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, otp: otp })
        });
        const data = await response.json();
        
        if (response.ok) { 
            showToast("Login Successful!", "success"); 
            sessionStorage.setItem('loggedInUser', JSON.stringify(data.user)); 
            window.location.replace('index.html'); 
        } 
        else {
            showToast(data.error, "error");
        }
    } catch (e) { showToast('Server error while verifying OTP', "error"); }
}

function logout() { 
    sessionStorage.removeItem('loggedInUser');
    window.location.replace('login.html'); 
}

// ==========================================
// --- PAGE LOAD LOGIC (NEW) ---
// ==========================================

let loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser')) || null;

window.onload = () => {
    if (document.getElementById('buyerFoodList')) {
        loadFoods(); 
        
        if (loggedInUser) {
            const roleSwitchBtn = document.getElementById('roleSwitchBtn');
            const sellerBtn = document.getElementById('sellerBtn');
            
            if (roleSwitchBtn) roleSwitchBtn.style.display = 'inline-block';
            if (sellerBtn) sellerBtn.style.display = 'inline-block';
            
            loadSellerOrders(); 
        }
    }
};

function toggleRole() {
    const btn = document.getElementById('roleSwitchBtn') || document.getElementById('sellerBtn');
    const buyerView = document.getElementById('buyerView');
    const sellerView = document.getElementById('sellerView');
    
    if (currentRole === 'buyer') { 
        currentRole = 'seller'; btn.innerText = "Switch to Buyer"; 
        buyerView.classList.add('hidden'); sellerView.classList.remove('hidden'); 
        loadSellerOrders(); 
    } 
    else { 
        currentRole = 'buyer'; btn.innerText = "Switch to Seller"; 
        sellerView.classList.add('hidden'); buyerView.classList.remove('hidden'); 
    }
}

function openModal(modalId) { 
    if (!loggedInUser && (modalId === 'editProfileModal' || modalId === 'orderListModal' || modalId === 'profileModal')) {
        showToast("Please Login first! 🔒", "error");
        window.location.href = 'login.html';
        return;
    }

    document.getElementById(modalId).classList.remove('hidden'); 
    
    if(modalId === 'orderListModal') { 
        loadOrders(); 
        loadWishlist(); 
    }
    
    if(modalId === 'editProfileModal') {
        document.getElementById('editName').value = loggedInUser.name || '';
        document.getElementById('editUsername').value = loggedInUser.username || '';
        document.getElementById('editEmail').value = loggedInUser.email || '';
        document.getElementById('editMobile').value = loggedInUser.mobile || '';
    }
}
function closeModal(modalId) { 
    document.getElementById(modalId).classList.add('hidden'); 
}

// ==========================================
// --- FOODS & MARKET (BUYER/SELLER) ---
// ==========================================
let activeCategory = 'All';

function filterCategory(categoryName) {
    activeCategory = categoryName;
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.includes(categoryName) || (categoryName === 'All' && btn.innerText === 'All')) {
            btn.classList.add('active');
        }
    });
    loadFoods();
}

async function loadFoods() {
    try {
        const response = await fetch('/api/foods');
        const foods = await response.json();
        const buyerList = document.getElementById('buyerFoodList');
        const sellerList = document.getElementById('sellerFoodList');
        if(buyerList) buyerList.innerHTML = ''; 
        if(sellerList) sellerList.innerHTML = '';

        foods.forEach(food => {
            let itemCategory = 'Others';
            let displayItemName = food.food_name;
            
            if (food.food_name.includes('|||')) {
                let parts = food.food_name.split('|||');
                itemCategory = parts[0];
                displayItemName = parts[1];
            }

            let showInBuyer = food.in_market && (activeCategory === 'All' || activeCategory === itemCategory);

            if(showInBuyer && buyerList) {
                buyerList.innerHTML += `
                    <div class="food-card">
                        <img src="${food.image_url}" alt="${displayItemName}">
                        <h3>${displayItemName} <span style="float:right; cursor:pointer;" onclick="addToWishlist(${food.id})">❤️</span></h3>
                        <p style="font-size:12px; color:gray; margin-top:2px;">In: ${itemCategory}</p>
                        <h4 style="color: #ff5200; margin: 10px 0;">₹${food.price}</h4>
                        
                        <div style="margin-bottom: 15px; text-align: left;">
                            <label style="font-weight: bold; font-size: 14px;">Qty: </label>
                            <input type="number" id="qty_${food.id}" value="1" min="1" style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 5px;">
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="buy-btn" style="flex: 1; padding: 8px 5px; font-size: 13px;" onclick="addToCart(${food.id}, '${displayItemName}', ${food.price})">🛒 Cart</button>
                            <button class="buy-btn" style="flex: 1; padding: 8px 5px; font-size: 13px; background-color: #28a745;" onclick="triggerBuyNow(${food.id}, '${displayItemName}', ${food.price})">⚡ Buy Now</button>
                        </div>
                    </div>`;
            }

            if (loggedInUser && food.seller_id === loggedInUser.id && sellerList) {
                let btnColor = food.in_market ? '#dc3545' : '#28a745';
                let btnText = food.in_market ? 'Remove from Market' : 'Add to Market';
                sellerList.innerHTML += `
                    <div class="food-card" style="opacity: ${food.in_market ? '1' : '0.5'}">
                        <img src="${food.image_url}" alt="${displayItemName}">
                        <h3>${displayItemName} <span style="font-size:12px; color:gray;">(${itemCategory})</span></h3>
                        <h4 style="color: #ff5200; margin: 10px 0;">₹${food.price}</h4>
                        <button class="buy-btn" style="background-color: ${btnColor};" onclick="toggleMarketStatus(${food.id}, ${!food.in_market})">${btnText}</button>
                    </div>`;
            }
        });
        if(buyerList && buyerList.innerHTML === '') buyerList.innerHTML = '<p>Is category me abhi koi item nahi hai.</p>';
    } catch (e) { console.error(e); }
}

function submitFood(event) {
    event.preventDefault(); 
    
    const foodCategory = document.getElementById('newFoodCategory').value;
    const foodName = document.getElementById('newFoodName').value;
    const foodPrice = document.getElementById('newFoodPrice').value;
    const imageInput = document.getElementById('newFoodImage');
    
    const combinedName = foodCategory + "|||" + foodName;
    
    if (!imageInput.files || !imageInput.files[0]) return showToast("Photo required!", "error");
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            await fetch('/api/add-food', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ seller_id: loggedInUser.id, food_name: combinedName, price: foodPrice, image_url: e.target.result }) 
            });
            document.getElementById('addFoodForm').reset();
            closeModal('addFoodModal'); 
            showToast('Item added Successfully!', "success"); 
            loadFoods(); 
        } catch (error) { showToast('Error adding food', "error"); }
    };
    reader.readAsDataURL(imageInput.files[0]);
}

async function toggleMarketStatus(foodId, newStatus) {
    await fetch('/api/toggle-food', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ food_id: foodId, in_market: newStatus }) });
    loadFoods();
}

// ==========================================
// --- WISHLIST LOGIC ---
// ==========================================

async function addToWishlist(foodId) {
    if (!loggedInUser) return showToast("Please Login first to use Wishlist! 🔒", "error");
    await fetch('/api/add-wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyer_id: loggedInUser.id, food_id: foodId }) });
    showToast("❤️ Item Added to Wishlist!", "success");
}

async function loadWishlist() {
    const response = await fetch(`/api/wishlist/${loggedInUser.id}`);
    const wishlist = await response.json();
    const listDiv = document.getElementById('myWishlist');
    listDiv.innerHTML = '';
    
    wishlist.forEach(item => {
        listDiv.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                <div><strong>${item.food_name}</strong> - ₹${item.price}</div>
                <button class="submit-btn" style="background:#dc3545; padding: 5px 10px; font-size: 12px; width: auto;" onclick="removeFromWishlist(${item.id})">Delete</button>
            </div>`;
    });
    
    if(listDiv.innerHTML === '') listDiv.innerHTML = '<p>Wishlist is empty.</p>';
}

async function removeFromWishlist(wishlistId) {
    await fetch('/api/remove-wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wishlist_id: wishlistId }) });
    showToast("Item Removed from Wishlist!", "success"); 
    loadWishlist(); 
}

// ==========================================
// --- ORDERS & TRACKING LOGIC ---
// ==========================================

let currentOrderFoodId = null;
function openOrderModal(foodId, itemName, itemPrice) {
    currentOrderFoodId = foodId;
    document.getElementById('orderItemName').innerText = itemName;
    document.getElementById('orderItemPrice').innerText = '₹' + itemPrice;
    openModal('orderModal');
}

function triggerBuyNow(foodId, itemName, itemPrice) {
    if (!loggedInUser) {
        showToast("Please Login first to place an order! 🔒", "error");
        window.location.href = 'login.html';
        return;
    }
    
    const qtyInput = document.getElementById(`qty_${foodId}`);
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;
    
    currentOrderFoodId = foodId;
    document.getElementById('orderItemName').innerText = itemName;
    document.getElementById('orderItemPrice').innerText = `₹${itemPrice} x ${qty} = ₹${itemPrice * qty}`;
    
    openModal('orderModal');
    
    const modalQtyInput = document.querySelector('#orderModal input[type="number"]');
    if(modalQtyInput) {
        modalQtyInput.value = qty;
    }
}

async function placeOrder(event) {
    event.preventDefault();
    const address = event.target.querySelector('textarea').value;
    const qty = event.target.querySelector('input[type="number"]').value;
    const payment = document.getElementById('buyerPaymentMethod').value;
    
    await fetch('/api/place-order', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ buyer_id: loggedInUser.id, food_id: currentOrderFoodId, delivery_address: address, quantity: qty, payment_method: payment }) 
    });
    showToast('Order Placed Successfully!', "success"); 
    closeModal('orderModal');
}

async function cancelOrder(orderId) {
    if(confirm("Are you sure you want to cancel this order?")) {
        await fetch('/api/cancel-order', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({order_id: orderId}) });
        showToast("Order Cancelled!", "success");
        if(currentRole === 'buyer') loadOrders(); else loadSellerOrders();
    }
}

async function loadOrders() {
    const response = await fetch(`/api/orders/${loggedInUser.id}`);
    const orders = await response.json();
    const ordersList = document.getElementById('myOrdersList');
    ordersList.innerHTML = '';
    orders.forEach(order => {
        let cancelBtn = (order.status !== 'Delivered' && order.status !== 'Cancelled') ? `<button class="submit-btn" style="background:#dc3545; padding:5px 10px; width:auto; font-size:12px; margin-top:5px;" onclick="cancelOrder(${order.id})">Cancel Order</button>` : '';
        ordersList.innerHTML += `
            <div style="border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px;">
                <strong>${order.food_name}</strong> - ₹${order.price} <br> 
                <span style="color: #ff5200; font-weight: bold;">Status: ${order.status}</span><br>
                <span>Time: ${order.estimated_time || 'Pending Admin Confirmation'} | Pay: ${order.payment_method}</span><br>
                ${cancelBtn}
            </div>`;
    });
    if(ordersList.innerHTML === '') ordersList.innerHTML = '<p>No orders yet.</p>';
}

async function loadSellerOrders() {
    const response = await fetch(`/api/seller-orders/${loggedInUser.id}`);
    const orders = await response.json();
    const listDiv = document.getElementById('sellerOrdersList');
    listDiv.innerHTML = '';
    orders.forEach(order => {
        let actionHTML = '';
        if(order.status === 'Waiting for Seller') {
            actionHTML = `
                <button class="submit-btn" style="background:#28a745; width:auto; margin-top:10px;" onclick="shiftOrderToOffice(${order.id})">Accept & Shift to Office</button>
                <button class="submit-btn" style="background:#dc3545; width:auto; margin-top:10px; margin-left:10px;" onclick="cancelOrder(${order.id})">Cancel Order</button>
            `;
        } else {
            actionHTML = `<p style="color:gray; margin-top:10px;">Order Status: ${order.status}</p>`;
        }

        listDiv.innerHTML += `
            <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; background: white;">
                <h4>Item: ${order.food_name} (Qty: ${order.quantity})</h4>
                <p><strong>Buyer:</strong> ${order.buyer_name} | <strong>Mobile:</strong> ${order.buyer_mobile}</p>
                <p><strong>Address:</strong> ${order.delivery_address}</p>
                <p><strong>Payment Method Chosen:</strong> <span style="color:#007bff; font-weight:bold;">${order.payment_method}</span></p>
                ${actionHTML}
            </div>`;
    });
    if(listDiv.innerHTML === '') listDiv.innerHTML = '<p>No orders received yet.</p>';
}

async function shiftOrderToOffice(orderId) {
    await fetch('/api/update-order-status', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ order_id: orderId, status: "Shifted to Office" }) 
    });
    showToast("Item Shifted to Office for Delivery!", "success");
    loadSellerOrders();
}

// ==========================================
// --- OFFICE ADMIN PANEL LOGIC ---
// ==========================================

function verifyOfficeLogin() {
    const id = document.getElementById('adminId').value;
    const pass = document.getElementById('adminPass').value;
    if (id === 'admin' && pass === 'office@123') {
        document.getElementById('officeLoginBox').classList.add('hidden');
        document.getElementById('officeDashboardBox').classList.remove('hidden');
        loadOfficeOrders();
    } else showToast("Wrong Admin ID or Password!", "error");
}

function logoutOffice() {
    document.getElementById('officeLoginBox').classList.remove('hidden');
    document.getElementById('officeDashboardBox').classList.add('hidden');
    document.getElementById('adminId').value = ''; document.getElementById('adminPass').value = '';
}

let allDeliveryBoys = [];
async function createDeliveryBoy() {
    const payload = {
        name: document.getElementById('dbName').value, mobile: document.getElementById('dbMobile').value,
        username: document.getElementById('dbUsername').value, password: document.getElementById('dbPass').value
    };
    await fetch('/api/create-delivery-boy', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    showToast("Delivery Account Created!", "success"); fetchDeliveryBoysList();
}

async function fetchDeliveryBoysList() {
    const res = await fetch('/api/delivery-boys-list');
    allDeliveryBoys = await res.json();
}

async function loadOfficeOrders() {
    await fetchDeliveryBoysList(); 
    const response = await fetch('/api/office-orders');
    const orders = await response.json();
    const listDiv = document.getElementById('officeOrdersList');
    listDiv.innerHTML = '';
    
    orders.forEach(o => {
        let options = allDeliveryBoys.map(db => `<option value="${db.id}">${db.name}</option>`).join('');
        let actionHTML = '';
        
        if(o.status === 'Shifted to Office') {
            actionHTML = `
                <input type="text" id="time_${o.id}" placeholder="Est. Time (e.g. 30 mins)" class="form-group" style="width:200px; display:inline; margin-right:10px;">
                <select id="db_select_${o.id}" style="padding:10px; margin-right:10px;">
                    <option value="">Select Delivery Boy</option>${options}
                </select>
                <button class="submit-btn" style="width:auto; background:#28a745;" onclick="assignDelivery(${o.id})">Dispatch Order</button>`;
        }
        
        listDiv.innerHTML += `
            <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; background: white;">
                <h4>Order #${o.id} - ${o.food_name} | Status: <span style="color:red">${o.status}</span></h4>
                <p>Buyer: ${o.buyer_name} (${o.buyer_mobile}) | Addr: ${o.delivery_address}</p>
                <div style="margin-top:10px;">${actionHTML}</div>
            </div>`;
    });
}

async function assignDelivery(orderId) {
    const time = document.getElementById(`time_${orderId}`).value;
    const db_id = document.getElementById(`db_select_${orderId}`).value;
    if(!time || !db_id) return showToast("Enter Time and Select Delivery Boy!", "error");
    
    await fetch('/api/admin-assign-order', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({order_id: orderId, time, db_id}) });
    showToast("Order Dispatched for Delivery!", "success"); loadOfficeOrders();
}

// ==========================================
// --- DELIVERY BOY PANEL LOGIC ---
// ==========================================

let loggedInDelivery = null;
if (window.location.pathname.includes('delivery.html')) {
    loggedInDelivery = JSON.parse(sessionStorage.getItem('loggedDeliveryUser'));
    if(loggedInDelivery) {
        document.getElementById('deliveryLoginBox').classList.add('hidden');
        document.getElementById('deliveryDashboard').classList.remove('hidden');
        loadDeliveryTasks();
    }
}

async function loginDeliveryBoy() {
    const user = document.getElementById('delUsername').value, pass = document.getElementById('delPass').value;
    const res = await fetch('/delivery-login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: user, password: pass}) });
    const data = await res.json();
    if(res.ok) {
        sessionStorage.setItem('loggedDeliveryUser', JSON.stringify(data.user));
        window.location.reload();
    } else showToast(data.error, "error");
}

function logoutDelivery() { sessionStorage.removeItem('loggedDeliveryUser'); window.location.reload(); }

async function loadDeliveryTasks() {
    const res = await fetch(`/api/delivery-tasks/${loggedInDelivery.id}`);
    const orders = await res.json();
    const list = document.getElementById('deliveryOrdersList');
    list.innerHTML = '';
    orders.forEach(o => {
        list.innerHTML += `
            <div style="border: 2px solid #ff5200; padding: 15px; margin-bottom: 15px; background: #fff;">
                <h3>Collect ₹${o.price * o.quantity} (${o.payment_method})</h3>
                <p><strong>Item:</strong> ${o.food_name} (Qty: ${o.quantity})</p>
                <p><strong>Deliver To:</strong> ${o.buyer_name} | ${o.buyer_mobile}</p>
                <p><strong>Address:</strong> ${o.delivery_address}</p>
                <button class="submit-btn" style="background:#28a745; margin-top:10px;" onclick="confirmDeliveryPayment(${o.id})">✅ Payment Received & Delivered</button>
            </div>`;
    });
    if(list.innerHTML === '') list.innerHTML = "No deliveries pending! Enjoy your tea ☕";
}

async function confirmDeliveryPayment(orderId) {
    if(confirm("Have you received the payment and delivered the order?")) {
        await fetch('/api/confirm-delivery', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({order_id: orderId}) });
        showToast("Awesome! Delivery Completed.", "success");
        loadDeliveryTasks();
    }
}
// ==========================================
// --- CART LOGIC (UPDATED WITH QTY) ---
// ==========================================

let cart = JSON.parse(sessionStorage.getItem('myCart')) || [];
cart = cart.map(item => ({...item, qty: item.qty || 1}));
updateCartUI(); 

function updateCartUI() {
    const cartCountElement = document.getElementById('cartCount');
    let totalItems = 0;
    cart.forEach(item => totalItems += item.qty);
    if(cartCountElement) cartCountElement.innerText = totalItems;
    
    sessionStorage.setItem('myCart', JSON.stringify(cart));
}

function addToCart(id, name, price) {
    if (!loggedInUser) {
        showToast("Please Login first to add items to your cart! 🔒", "error");
        window.location.href = 'login.html';
        return;
    }

    const qtyInput = document.getElementById(`qty_${id}`);
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ id, name, price, qty });
    }
    
    updateCartUI();
    showToast(`${qty} x ${name} added to Cart! 🛒`, "success");
}

function openCartModal() {
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }
    renderCart();
    openModal('cartModal');
}

function renderCart() {
    const cartList = document.getElementById('cartItemsList');
    const cartTotal = document.getElementById('cartTotal');
    cartList.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<p>Your cart is empty. Please add some food!</p>';
        cartTotal.innerText = '0';
        return;
    }

    cart.forEach((item, index) => {
        const itemQty = item.qty || 1;
        const itemTotal = item.price * itemQty; 
        total += itemTotal;
        cartList.innerHTML += `
            <div class="cart-item">
                <div><strong>${item.name}</strong> <br> ₹${item.price} x ${itemQty} = <b>₹${itemTotal}</b></div>
                <button class="cart-remove-btn" onclick="removeFromCart(${index})">❌ Remove</button>
            </div>
        `;
    });
    cartTotal.innerText = total;
}

function removeFromCart(index) {
    cart.splice(index, 1); 
    updateCartUI();
    renderCart(); 
}

async function checkoutCart(event) {
    event.preventDefault();
    if (cart.length === 0) return showToast("Your cart is empty!", "error");

    const address = document.getElementById('cartAddress').value;
    const payment = document.getElementById('cartPaymentMethod').value;

    for (let item of cart) {
        await fetch('/api/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buyer_id: loggedInUser.id,
                food_id: item.id,
                delivery_address: address,
                quantity: item.qty || 1, 
                payment_method: payment
            })
        });
    }

    showToast('All Orders Placed Successfully! 🎉', "success");
    cart = []; 
    updateCartUI();
    closeModal('cartModal');
    loadOrders(); 
}
// ==========================================
// --- NEW ADMIN TABS & MANAGEMENT LOGIC ---
// ==========================================

function switchAdminTab(tabName) {
    if (tabName === 'orders') {
        document.getElementById('adminOrdersSection').classList.remove('hidden');
        document.getElementById('adminSellersSection').classList.add('hidden');
        loadOfficeOrders();
    } else {
        document.getElementById('adminOrdersSection').classList.add('hidden');
        document.getElementById('adminSellersSection').classList.remove('hidden');
        loadAdminSellers();
    }
}

async function loadAdminSellers() {
    const res = await fetch('/api/admin/sellers-and-stock');
    const data = await res.json();
    const listDiv = document.getElementById('officeSellersList');
    listDiv.innerHTML = '';
    
    data.users.forEach(u => {
        let itemsHTML = '';
        let userFoods = data.foods.filter(f => f.seller_id === u.id);
        
        userFoods.forEach(f => {
            let itemName = f.food_name.includes('|||') ? f.food_name.split('|||')[1] : f.food_name;
            itemsHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:8px 0;">
                    <span>🍕 <b>${itemName}</b> - ₹${f.price}</span>
                    <button onclick="adminDeleteFood(${f.id})" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Delete Item</button>
                </div>`;
        });

        listDiv.innerHTML += `
            <div style="border:2px solid #333; padding:15px; margin-bottom:15px; background:white; border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="margin:0;">👤 ${u.name} <span style="color:gray; font-size:14px;">(@${u.username}) - 📱 ${u.mobile}</span></h4>
                    <button onclick="adminDeleteUser(${u.id})" style="background:darkred; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">🚫 Block & Delete User</button>
                </div>
                <div style="margin-top:15px; background:#f9f9f9; padding:10px; border-radius: 5px;">
                    <strong style="color:#ff5200;">Stock Listed by User:</strong>
                    <div style="margin-top:10px;">${itemsHTML || '<p style="color:gray; margin-top:5px;">No items listed.</p>'}</div>
                </div>
            </div>`;
    });
}

async function adminDeleteUser(userId) {
    if(confirm("🚨 WARNING: Are you sure you want to delete this user and ALL their stock?")) {
        await fetch('/api/admin/delete-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: userId }) });
        showToast("User and their stock deleted successfully!", "success");
        loadAdminSellers(); // Refresh list
    }
}

async function adminDeleteFood(foodId) {
    if(confirm("Delete this specific item?")) {
        await fetch('/api/admin/delete-food', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ food_id: foodId }) });
        showToast("Item deleted from database!", "success");
        loadAdminSellers(); // Refresh list
    }
}

// ==========================================
// --- LIVE UPDATE LOGIC (AUTO-POLLING) ---
// ==========================================

// Ye code background me har 4 second me checking karega
setInterval(() => {
    
    // 1. Agar Seller Dashboard khula hai
    if (document.getElementById('sellerView') && !document.getElementById('sellerView').classList.contains('hidden')) {
        if(loggedInUser && currentRole === 'seller') loadSellerOrders();
    }
    
    // 2. Agar Buyer ka 'My Orders' modal khula hai
    if (document.getElementById('orderListModal') && !document.getElementById('orderListModal').classList.contains('hidden')) {
        if(loggedInUser) loadOrders();
    }
    
    // 3. Agar Office Admin Panel khula hai (Live Orders section)
    if (document.getElementById('officeDashboardBox') && !document.getElementById('officeDashboardBox').classList.contains('hidden')) {
        if (!document.getElementById('adminOrdersSection').classList.contains('hidden')) {
            loadOfficeOrders();
        }
    }
    
    // 4. Agar Delivery Boy Panel khula hai
    if (document.getElementById('deliveryDashboard') && !document.getElementById('deliveryDashboard').classList.contains('hidden')) {
        if(loggedInDelivery) loadDeliveryTasks();
    }

}, 4000); // 4000 milliseconds = Har 4 second me refresh