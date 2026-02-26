// ====================================
// ملف البرمجة للواجهة الأمامية - Frontend Script
// ====================================

// متغير لتخزين الخدمات المتاحة
let availableServices = [];
let currentFilter = "all";
let searchQuery = "";

// تحديد عنوان الـ API بناءً على البيئة
// إذا كنا على المنفذ 5000 (الخادم المدمج)، نستخدم المسار النسبي - وإلا نستخدم 5000
// تحديد عنوان الـ API بناءً على البيئة
// إذا كُنا نشغل الواجهة الأمامية والخلفية معاً على نفس الخادم (Production) نستخدم مساراً نسبياً
// وإلا (في بيئة التطوير) نحاول الوصول للمنفذ 5000
const isLocalDev =
  window.location.port !== "5000" && window.location.hostname === "localhost";
const API_BASE_URL = isLocalDev ? `http://localhost:5000` : "";

document.addEventListener("DOMContentLoaded", () => {
  // 1. منع المتصفح من استعادة مكان السكرول القديم
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // 2. إجبار الصفحة تبدأ من فوق فوراً
  window.scrollTo(0, 0);
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE

  console.log("🚀 تطبيق رعاية جاهز...");

  // إعداد النافذة المنبثقة للحجز
  setupBookingModal();

  // السيطرة على نماذج المصادقة (دخول/تسجيل)
  setupAuthForms();

  // تحديث واجهة المستخدم بناءً على تسجيل الدخول
  updateUIForAuth();

  // إعداد الوضع الليلي
  setupDarkMode();

  // جلب الخدمات من الـ API
  fetchServices().then(() => {
    // تحديد الصفحة الحالية
    const isHomePage = document.querySelector(".hero-section") !== null;
    const servicesContainer = document.getElementById("services-container");

    if (isHomePage) {
      renderHomePageServices();
    } else {
      const servicesContainer = document.getElementById("services-container");
      if (servicesContainer) renderAllServices(servicesContainer);
    }
    // 3. تأكيد الصعود للأعلى بعد تحميل المحتوى
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  });
});

// إجبار التمرير للأعلى عند اكتمال تحميل كل العناصر (الصور والخطوط)
window.onload = function () {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 10);
};

/**
 * جلب الخدمات من الباك اند وتخزينها
 */
async function fetchServices() {
  try {
    console.log(`📡 Fetching from: ${API_BASE_URL}/api/services`);
    const response = await fetch(`${API_BASE_URL}/api/services`);

    // محاكاة البيانات إذا كان الخادم مفصولاً
    if (response.status === 503 || !response.ok) {
      console.warn("⚠️ وضع المحاكاة: قاعدة البيانات غير متصلة");
      availableServices = getMockServices();
      return;
    }

    const result = await response.json();
    if (result.success) {
      console.log("✅ تم جلب الخدمات:", result.data);
      availableServices = result.data;
    }
  } catch (error) {
    console.error("❌ خطأ في الاتصال:", error);
    availableServices = getMockServices();
  }
}

/**
 * دالة لتنقية النصوص لمنع ثغرات XSS
 */
function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * عرض خدمات الصفحة الرئيسية (مختارة)
 */
function renderHomePageServices() {
  const cleaningContainer = document.getElementById("cleaning-container");
  const maintenanceContainer = document.getElementById("maintenance-container");

  if (cleaningContainer) cleaningContainer.innerHTML = "";
  if (maintenanceContainer) maintenanceContainer.innerHTML = "";

  availableServices.forEach((service) => {
    const isCleaning =
      service.name.includes("نظافة") || service.description.includes("نظافة");
    const isMaintenance =
      service.name.includes("صيانة") || service.description.includes("صيانة");

    const targetContainer = isCleaning
      ? cleaningContainer
      : isMaintenance
        ? maintenanceContainer
        : null;

    if (!targetContainer) return;

    // تحديد الصورة بناءً على الاسم أو استخدام صورة افتراضية
    let imgSrc = "Screenshot 2025-12-04 001749 2.png";
    if (isMaintenance) imgSrc = "Screenshot 2025-12-04 004330 1.png";

    const escapedName = escapeHTML(service.name);
    const escapedDesc = escapeHTML(service.description);
    const escapedPrice = escapeHTML(service.price.toString());

    const html = `
            <div class="meal">
              <img src="${imgSrc}" alt="${escapedName}" />
              <div class="meal-content">
                <p class="meal-title">${escapedName}</p>
                <p style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">${escapedDesc}</p>
                <div class="chair-price">
                  <button class="btn--small" style="border:none; cursor:pointer;" onclick="openOrderModal('${escapedName}', '${service._id}')">طلب</button>
                  <strong><span>ج.م</span>${escapedPrice}</strong>
                </div>
              </div>
            </div>
        `;
    targetContainer.insertAdjacentHTML("beforeend", html);
  });
}

/**
 * عرض جميع الخدمات (صفحة الخدمات)
 */
function renderAllServices(container) {
  container.innerHTML = "";
  container.className = "services-grid-page container";

  // فلترة الخدمات بناءً على القسم المدخل والبحث
  const filteredServices = availableServices.filter((service) => {
    const matchesCategory =
      currentFilter === "all" ||
      (currentFilter === "نظافة" &&
        (service.name.includes("نظافة") ||
          service.description.includes("نظافة"))) ||
      (currentFilter === "صيانة" &&
        (service.name.includes("صيانة") ||
          service.description.includes("صيانة"))) ||
      (currentFilter === "أخرى" &&
        !service.name.includes("نظافة") &&
        !service.name.includes("صيانة"));

    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery) ||
      service.description.toLowerCase().includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  if (filteredServices.length === 0) {
    container.innerHTML = `
            <div class="text-center" style="grid-column: 1/-1; padding: 60px;">
                <h3 style="color: #888;">عذراً، لم نجد خدمات تطابق بحثك 🔍</h3>
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="document.getElementById('serviceSearch').value=''; searchQuery=''; filterServices();">عرض الكل</button>
            </div>
        `;
    return;
  }

  // إضافة تنسيق CSS للشبكة ديناميكياً إذا لم يكن موجوداً
  if (!document.getElementById("services-grid-style")) {
    const style = document.createElement("style");
    style.id = "services-grid-style";
    style.textContent = `
            .services-grid-page {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 30px;
                padding: 40px 20px;
            }
            .service-card-full {
                background: #fff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                transition: transform 0.3s ease;
                border: 1px solid #eee;
                display: flex;
                flex-direction: column;
            }
            .service-card-full:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(43, 198, 193, 0.2);
            }
            .service-card-img {
                height: 200px;
                background-color: #e0f7f6;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .service-card-img img {
                max-width: 60%;
                max-height: 80%;
            }
            .service-card-body {
                padding: 25px;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
            }
            .service-card-body h3 {
                color: #343a40;
                margin-bottom: 10px;
                font-size: 1.3rem;
            }
            .service-card-body p {
                color: #6c757d;
                font-size: 0.95rem;
                margin-bottom: 20px;
                flex-grow: 1;
            }
            .service-price {
                font-weight: 700;
                color: #2bc6c1;
                font-size: 1.2rem;
                margin-bottom: 15px;
            }
        `;
    document.head.appendChild(style);
  }

  filteredServices.forEach((service) => {
    // تحديد الصورة بناءً على النوع
    let imgSrc = "photo_2025-12-19_22-22-19.jpg"; // افتراضي
    if (
      service.name.includes("صيانة") ||
      service.description.includes("كهرباء")
    )
      imgSrc = "photo_2025-12-19_22-22-15.jpg";
    if (service.name.includes("نظافة"))
      imgSrc = "photo_2025-12-19_22-22-04.jpg";

    const averageRating = service.averageRating || 0;
    const numOfReviews = service.numOfReviews || 0;

    const html = `
            <div class="service-card-full">
                <div class="service-card-img">
                    <img src="${imgSrc}" alt="${service.name}">
                </div>
                <div class="service-card-body">
                    <h3>${service.name}</h3>
                    <div class="service-rating" style="margin-bottom: 10px; color: #f1c40f;">
                        ${generateStars(averageRating)}
                        <span style="color: #888; font-size: 0.8rem; margin-right: 5px;">(${numOfReviews} تقييم)</span>
                    </div>
                    <p>${service.description}</p>
                    <div class="service-price">${service.price} ج.م</div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-outline" style="flex:1" onclick="openOrderModal('${service.name}', '${service._id}')">طلب</button>
                        <button class="btn btn-primary" style="flex:1" onclick="window.openReviewsModal('${service._id}', '${service.name}')">تقييمات</button>
                    </div>
                </div>
            </div>
        `;
    container.insertAdjacentHTML("beforeend", html);
  });
}

/**
 * توليد نجوم التقييم
 */
function generateStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.round(rating)) {
      stars += '<span class="star-filled">★</span>';
    } else {
      stars += '<span class="star-empty" style="color:#ddd">★</span>';
    }
  }
  return `<div class="stars" style="display:inline-flex;">${stars}</div>`;
}

/**
 * إعداد النافذة المنبثقة للحجز (Modal) وحقنها في الـ DOM
 */
let currentServiceId = "";

function setupBookingModal() {
  const modalHtml = `
        <div id="bookingModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalTitle">طلب خدمة</h2>
                    <button class="close-modal" id="closeModal">&times;</button>
                </div>
                <form id="bookingForm" class="booking-form">
                    <div class="form-group">
                        <label for="userName">الاسم بالكامل</label>
                        <input type="text" id="userName" placeholder="أدخل اسمك هنا" required>
                    </div>
                    <div class="form-group">
                        <label for="userPhone">رقم الهاتف</label>
                        <input type="tel" id="userPhone" placeholder="01xxxxxxxxx" required pattern="^(010|011|012|015)\\d{8}$">
                    </div>
                    <div class="form-group">
                        <label for="userEmail">البريد الإلكتروني (اختياري)</label>
                        <input type="email" id="userEmail" placeholder="example@mail.com">
                    </div>
                    <div class="form-group">
                        <label for="userAddress">العنوان بالتفصيل</label>
                        <textarea id="userAddress" placeholder="أدخل عنوانك بالتفصيل هنا" required></textarea>
                    </div>

                    <!-- اختيار وسيلة الدفع -->
                    <div class="form-group">
                        <label>وسيلة الدفع</label>
                        <div class="payment-methods">
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="كاش" checked>
                                <span>💵 كاش</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="بطاقة بنكية">
                                <span>💳 فيزا/ماستر</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="فوري">
                                <span>🏪 فوري</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="فودافون كاش">
                                <span>📱 محفظة إلكترونية</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary submit-btn">إرسال الطلب</button>
                </form>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const modal = document.getElementById("bookingModal");
  const closeBtn = document.getElementById("closeModal");
  const form = document.getElementById("bookingForm");

  // إغلاق النافذة عند الضغط على زر X
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  // إغلاق النافذة عند الضغط خارجها
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  // معالجة إرسال النموذج
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("userName").value;
    const phone = document.getElementById("userPhone").value;
    const email = document.getElementById("userEmail").value;
    const address = document.getElementById("userAddress").value;
    const paymentMethod = form.querySelector(
      'input[name="paymentMethod"]:checked',
    ).value;

    submitOrder({
      user_name: name,
      user_phone: phone,
      user_email: email,
      user_address: address,
      serviceId: currentServiceId,
      paymentMethod: paymentMethod,
    });

    // إغلاق النافذة وتفريغ الحقول
    modal.classList.remove("active");
    form.reset();
  });
}

/**
 * فتح نموذج الطلب
 */
window.openOrderModal = function (serviceName, serviceId) {
  currentServiceId = serviceId;
  document.getElementById("modalTitle").textContent =
    `طلب خدمة: ${serviceName}`;

  // تعبئة البيانات تلقائياً إذا كان مسجل دخول
  const userJson = localStorage.getItem("user");
  if (userJson) {
    const user = JSON.parse(userJson);
    document.getElementById("userName").value = user.username || "";
    document.getElementById("userEmail").value = user.email || "";
  }

  document.getElementById("bookingModal").classList.add("active");
};

/**
 * إرسال الطلب
 */
async function submitOrder(orderData) {
  try {
    // التحقق من صحة ID الخدمة
    if (!orderData.serviceId) {
      alert("⚠️ لم يتم تحديد الخدمة بشكل صحيح.");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    // إذا كان الخادم مفصولاً
    if (response.status === 503) {
      alert("⚠️ النظام في وضع الصيانة. لا يمكن حفظ الطلب حالياً.");
      return;
    }

    const result = await response.json();
    if (result.success) {
      // إذا كانت وسيلة الدفع ليست كاش، ننتقل لصفحة الدفع
      if (orderData.paymentMethod !== "كاش") {
        const amount = result.data.totalAmount || 500;
        window.location.href = `payment.html?method=${encodeURIComponent(orderData.paymentMethod)}&orderId=${result.data._id}&amount=${amount}`;
      } else {
        alert("🎉 تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً.");
        window.location.reload();
      }
    } else {
      alert("❌ فشل في إرسال الطلب: " + (result.message || "خطأ غير معروف"));
    }
  } catch (error) {
    console.error("Connection Error:", error);
    if (error.message === "Failed to fetch") {
      alert(
        "❌ فشل الاتصال بالخادم: يبدو أن الخادم (الباك اند) متوقف حالياً. يرجى التأكد من تشغيله.",
      );
    } else {
      alert("❌ حدث خطأ غير متوقع في الاتصال بالخادم.");
    }
  }
}

/**
 * بيانات وهمية للمحاكاة
 */
function getMockServices() {
  return [
    {
      _id: "mock1",
      name: "تنظيف شامل للمنزل",
      description: "تنظيف عميق وشامل لجميع الغرف",
      price: 500,
    },
    {
      _id: "mock2",
      name: "صيانة كهرباء",
      description: "إصلاح جميع الأعطال الكهربائية بأمان",
      price: 200,
    },
    {
      _id: "mock3",
      name: "صيانة سباكة",
      description: "حل مشاكل التسريب والانسداد",
      price: 150,
    },
    {
      _id: "mock4",
      name: "مكافحة حشرات",
      description: "قضاء تام على الحشرات بمواد آمنة",
      price: 300,
    },
    {
      _id: "mock5",
      name: "نظافة خزانات",
      description: "غسيل وتعقيم خزانات المياه",
      price: 400,
    },
    {
      _id: "mock6",
      name: "صيانة تكييف",
      description: "غسيل وشحن فريون وصيانة",
      price: 250,
    },
  ];
}

/**
 * إعداد نماذج المصادقة (دخول وتسجيل)
 */
function setupAuthForms() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (result.success) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
          alert("👋 تم تسجيل الدخول بنجاح!");
          window.location.href = "/";
        } else {
          alert("❌ " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("❌ حدث خطأ في الاتصال");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("regUsername").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const result = await response.json();
        if (result.success) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
          alert("🎉 تم إنشاء الحساب بنجاح!");
          window.location.href = "/";
        } else {
          alert("❌ " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("❌ حدث خطأ في الاتصال");
      }
    });
  }
}

/**
 * تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
 */
function updateUIForAuth() {
  const userJson = localStorage.getItem("user");
  const authLinksContainer = document.getElementById("auth-links");

  if (!authLinksContainer) return;

  // تفريغ المحتوى القديم للروابط في الهيدر
  authLinksContainer.innerHTML = "";

  if (userJson) {
    const user = JSON.parse(userJson);

    if (user.role === "admin") {
      authLinksContainer.innerHTML = `<a href="admin.html" class="main-nav-link"; padding: 10px 15px;">لوحة التحكم</a>`;
    } else {
      authLinksContainer.innerHTML = `<a href="orders.html" class="main-nav-link"; padding: 10px 15px;">طلباتي</a>`;
    }

    authLinksContainer.innerHTML += `<a href="#" class="main-nav-link color:blue" onclick="logout()">خروج</a>`;
  } else {
    authLinksContainer.innerHTML = `<a href="auth.html" class="main-nav-link color:blue">دخول</a>`;
  }
}

/**
 * تسجيل الخروج
 */
window.logout = function () {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.reload();
};

/**
 * فتح نافذة التقييمات
 */
window.openReviewsModal = async function (serviceId, serviceName) {
  // إنشاء المودال إذا لم يكن موجوداً
  if (!document.getElementById("reviewsModal")) {
    const modalHTML = `
            <div id="reviewsModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: none; align-items: center; justify-content: center; z-index: 3000;">
                <div class="modal-content" style="background: white; width: 90%; max-width: 500px; padding: 30px; border-radius: 20px; position: relative;">
                    <button onclick="document.getElementById('reviewsModal').style.display = 'none'" style="position: absolute; left: 20px; top: 20px; border: none; background: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    <h2 id="reviewsModalTitle" style="margin-bottom: 20px; color: #333;">التقييمات</h2>
                    <div id="reviewsList" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px; border-bottom: 1px solid #eee;">
                        <p style="text-align:center;">جاري تحميل التقييمات...</p>
                    </div>

                    <div id="addReviewFormContainer">
                        <h4 style="margin-bottom:10px;">أضف تقييمك</h4>
                        <form id="addReviewForm">
                            <input type="hidden" id="reviewServiceId">
                            <div style="margin-bottom: 15px;">
                                <label style="display:block; margin-bottom:5px;">التقييم:</label>
                                <select id="reviewRating" style="width:100%; padding:10px; border-radius:8px; border: 1px solid #ccc;">
                                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                                    <option value="3">⭐⭐⭐ (3/5)</option>
                                    <option value="2">⭐⭐ (2/5)</option>
                                    <option value="1">⭐ (1/5)</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label style="display:block; margin-bottom:5px;">تعليقك:</label>
                                <textarea id="reviewComment" placeholder="اكتب رأيك في الخدمة..." required style="width:100%; padding:10px; border-radius:8px; border: 1px solid #ccc; min-height:80px;"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width:100%;">إرسال التقييم</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // ربط حدث الإرسال
    document
      .getElementById("addReviewForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
          alert("⚠️ يرجى تسجيل الدخول أولاً للتمكن من التقييم");
          window.location.href = "auth.html";
          return;
        }

        const reviewData = {
          service: document.getElementById("reviewServiceId").value,
          rating: parseInt(document.getElementById("reviewRating").value),
          comment: document.getElementById("reviewComment").value,
        };

        try {
          const response = await fetch(`${API_BASE_URL}/api/reviews`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(reviewData),
          });

          const result = await response.json();
          if (result.success) {
            alert("✅ شكراً لتقييمك!");
            document.getElementById("addReviewForm").reset();
            openReviewsModal(reviewData.service, serviceName); // إعادة تحميل التقييمات
            fetchServices(); // لتحديث النجوم في البطاقة
          } else {
            alert("❌ " + result.message);
          }
        } catch (err) {
          alert("❌ حصل خطأ في الاتصال");
        }
      });
  }

  document.getElementById("reviewsModalTitle").textContent =
    `تقييمات خدمة: ${serviceName}`;
  document.getElementById("reviewServiceId").value = serviceId;
  document.getElementById("reviewsModal").style.display = "flex";

  // تحميل التقييمات من الـ API
  try {
    const res = await fetch(`${API_BASE_URL}/api/reviews/${serviceId}`);
    const result = await res.json();
    const list = document.getElementById("reviewsList");

    if (result.data.length === 0) {
      list.innerHTML =
        '<p style="text-align:center; color:#888; padding: 20px;">لا توجد تقييمات لهذه الخدمة بعد.</p>';
    } else {
      list.innerHTML = result.data
        .map(
          (r) => `
                <div class="review-item" style="padding:15px; border-bottom:1px solid #f9f9f9;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="font-weight:700;">${r.user_name}</span>
                        <span>${generateStars(r.rating)}</span>
                    </div>
                    <p style="color:#555; font-size:0.9rem;">${r.comment}</p>
                    <small style="color:#ccc; font-size:0.7rem;">${new Date(r.createdAt).toLocaleDateString("ar-EG")}</small>
                </div>
            `,
        )
        .join("");
    }
  } catch (err) {
    console.error(err);
  }
};
/**
 * التحكم في البحث والفلترة
 */
function setFilter(category, btn) {
  currentFilter = category;

  // تحديث شكل الأزرار
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  applyFilters();
}

function filterServices() {
  searchQuery = document.getElementById("serviceSearch").value.toLowerCase();
  applyFilters();
}

function applyFilters() {
  const servicesContainer = document.getElementById("services-container");
  if (!servicesContainer) return;

  const isHomePage = document.querySelector(".hero-section") !== null;

  if (isHomePage) {
    renderHomePageServices(servicesContainer);
  } else {
    renderAllServices(servicesContainer);
  }
}

/**
 * إعداد الوضع الليلي
 */
function setupDarkMode() {
  const toggleSwitch = document.querySelector(
    '.theme-switch input[type="checkbox"]',
  );
  const currentTheme = localStorage.getItem("theme");

  if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "dark") {
      if (toggleSwitch) toggleSwitch.checked = true;
    }
  }

  if (toggleSwitch) {
    toggleSwitch.addEventListener("change", function (e) {
      if (e.target.checked) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      }
    });
  }
}
// ---------------------------------------------------------
// Mouse Tracking for Nebula Footer
// ---------------------------------------------------------
document.addEventListener("mousemove", (e) => {
  const footer = document.querySelector("footer");
  if (footer) {
    const rect = footer.getBoundingClientRect();
    if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      footer.style.setProperty("--mouse-x", `${x}%`);
      footer.style.setProperty("--mouse-y", `${y}%`);
    }
  }
});

// ---------------------------------------------------------
// Live Chat Logic
// ---------------------------------------------------------
window.toggleChat = function () {
  const chatWin = document.getElementById("chatWindow");
  if (chatWin) chatWin.classList.toggle("active");
};

window.sendChatMessage = function () {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  appendMessage("user", msg);
  input.value = "";

  // Simple Auto-Bot response
  setTimeout(() => {
    const responses = [
      "أهلاً بك! كيف يمكنني مساعدتك اليوم؟",
      "سأقوم بتحويلك لأحد ممثلي خدمة العملاء فورا.",
      "هل تود الاستفسار عن خدمة معينة؟",
      "شكراً لتواصلك مع رعاية، نحن هنا لخدمتك.",
    ];
    const random = responses[Math.floor(Math.random() * responses.length)];
    appendMessage("bot", random);
  }, 1000);
};

function appendMessage(type, text) {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg msg-${type}`;
  msgDiv.textContent = text;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

// Support hitting Enter to send
document.getElementById("chatInput")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendChatMessage();
});
