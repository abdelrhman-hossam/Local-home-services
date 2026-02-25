/**
 * رعايه - نظام إدارة خدمات نظافة وصيانة المنازل
 * استخدام أحدث معايير JavaScript (ES6+)
 * @version 2.0
 */

// ========================================
// 1. Class للعامل (Worker)
// ========================================
class Worker {
  constructor(id, name, type, category, hours, location, price = 0) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.category = category;
    this.hours = hours;
    this.location = location;
    this.price = price;
    this.rating = 0;
    this.reviews = [];
  }

  addReview(rating, comment) {
    this.reviews.push({ rating, comment, date: new Date() });
    this.updateRating();
  }

  updateRating() {
    if (this.reviews.length === 0) return;
    this.rating =
      this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      hours: this.hours,
      location: this.location,
      price: this.price,
      rating: this.rating.toFixed(1),
    };
  }
}

// ========================================
// 2. Service Manager Class
// ========================================
class ServiceManager {
  constructor() {
    this.workers = [];
    this.orders = [];
    this.initializeWorkers();
  }

  async initializeWorkers() {
    try {
      // جلب البيانات من Backend
      const response = await fetch("https://api.raaya.com/workers");
      if (response.ok) {
        const workersData = await response.json();
        this.workers = workersData.map(
          (w) =>
            new Worker(
              w.id,
              w.name,
              w.type,
              w.category,
              w.hours,
              w.location,
              w.price,
            ),
        );
        console.log("✅ تم تحميل العاملين من Backend");
      } else {
        throw new Error("فشل جلب البيانات من السيرفر");
      }
    } catch (error) {
      console.warn(
        "⚠️ لم يتمكن من جلب البيانات من Backend، سيتم استخدام بيانات افتراضية محلية",
        error,
      );
      // بيانات افتراضية كحل بديل
      this.loadDefaultWorkers();
    }
  }

  loadDefaultWorkers() {
    this.workers = [
      new Worker(
        1,
        "سهير السيد",
        "عامله نظافه",
        "cleaning",
        "6 ساعات عمل",
        "اعمل في اي مكان",
        300,
      ),
      new Worker(
        2,
        "نورهان صبحي",
        "عامله نظافه",
        "cleaning",
        "8 ساعات عمل",
        "اعمل في المنازل",
        250,
      ),
      new Worker(
        3,
        "هاني ابراهيم",
        "عامل سباكه",
        "maintenance",
        "7 ساعات عمل",
        "اعمل في اي مكان",
        350,
      ),
      new Worker(
        4,
        "حسن هاشم",
        "عامل كهرباء",
        "maintenance",
        "10 ساعات عمل",
        "اعمل في المنازل",
        500,
      ),
    ];
  }

  getWorkers(category = null) {
    return category
      ? this.workers.filter((w) => w.category === category)
      : this.workers;
  }

  getWorkerById(id) {
    return this.workers.find((w) => w.id === id);
  }

  searchWorkers(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.workers.filter(
      (w) =>
        w.name.toLowerCase().includes(lowerKeyword) ||
        w.type.toLowerCase().includes(lowerKeyword),
    );
  }

  addOrder(workerId, clientInfo) {
    const worker = this.getWorkerById(workerId);
    if (!worker) throw new Error("عامل غير موجود");

    const order = {
      id: Date.now(),
      workerId,
      workerName: worker.name,
      clientInfo,
      price: worker.price,
      status: "pending",
      createdAt: new Date(),
    };

    this.orders.push(order);
    this.saveToLocalStorage();
    return order;
  }

  getOrders() {
    return this.orders;
  }

  updateOrderStatus(orderId, status) {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      this.saveToLocalStorage();
    }
  }

  saveToLocalStorage() {
    try {
      const data = {
        orders: this.orders,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem("raaya_service_data", JSON.stringify(data));
    } catch (error) {
      console.warn("❌ فشل حفظ البيانات:", error);
    }
  }

  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem("raaya_service_data");
      if (data) {
        const parsed = JSON.parse(data);
        this.orders = parsed.orders || [];
        return parsed;
      }
    } catch (error) {
      console.warn("❌ فشل تحميل البيانات:", error);
    }
    return null;
  }
}

// ========================================
// 3. UI Manager Class
// ========================================
class UIManager {
  constructor(serviceManager) {
    this.serviceManager = serviceManager;
    this.init();
  }

  init() {
    this.setupEventDelegation();
    this.setupSmoothScrolling();
    this.setupAnimations();
    this.cacheElements();
  }

  cacheElements() {
    this.mainNavLinks = document.querySelectorAll(".main-nav-link");
    this.orderButtons = document.querySelectorAll(
      ".chair-price a, .btn--small",
    );
    this.mainActionButtons = document.querySelectorAll(".btn--big");
    this.servicingLinks = document.querySelectorAll(".servicing a");
    this.footerLinks = document.querySelectorAll(".link ul li a");
  }

  /**
   * معالجة الأحداث باستخدام Event Delegation
   */
  setupEventDelegation() {
    document.addEventListener("click", (e) => {
      const target = e.target.closest("a");

      if (target?.classList.contains("main-nav-link")) {
        this.handleNavigation(e, target);
      }

      if (target?.classList.contains("btn--big")) {
        this.handleMoreAction(e);
      }

      if (target?.closest(".chair-price")) {
        this.handleOrderRequest(e, target);
      }

      if (target?.closest(".servicing")) {
        this.handleServiceRequest(e, target);
      }

      if (target?.closest(".link ul")) {
        this.handleFooterNavigation(e, target);
      }
    });
  }

  /**
   * معالج التنقل
   */
  handleNavigation(e, element) {
    e.preventDefault();
    console.log("🔗 تم النقر على الرابط:", element.textContent.trim());
  }

  /**
   * معالج زر "المزيد"
   */
  handleMoreAction(e) {
    e.preventDefault();
    this.smoothScroll(".section-home2");
    console.log('📖 التمرير إلى "ما الذي يجعل خدماتنا مميزة"');
  }

  /**
   * معالج طلب الخدمة
   */
  handleOrderRequest(e, element) {
    e.preventDefault();
    const mealCard = element.closest(".meal");

    if (mealCard) {
      const workerName = mealCard
        .querySelector(".meal-title")
        ?.textContent.trim();
      const price = mealCard
        .querySelector(".chair-price strong")
        ?.textContent.trim();

      this.showOrderConfirmation(workerName, price);
    }
  }

  /**
   * معالج طلب الخدمة من الأقسام
   */
  handleServiceRequest(e, element) {
    e.preventDefault();
    const section = element.closest(".cleaning-services");
    if (section) {
      const serviceType = section
        .querySelector("h1")
        ?.textContent.split("…")[0]
        .trim();
      this.showNotification(`🎯 تم اختيار خدمة: ${serviceType}`, "info");
    }
  }

  /**
   * معالج روابط الفوتر
   */
  handleFooterNavigation(e, element) {
    e.preventDefault();
    const linkText = element.textContent.trim();

    switch (linkText) {
      case "الصفحه الرئيسه":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "تفاصيل عن رعايه":
        this.smoothScroll(".section-home2");
        break;
      case "الخدمات":
        this.smoothScroll(".cleaning-services");
        break;
      default:
        console.log(`🔗 انتقل إلى: ${linkText}`);
    }
  }

  /**
   * التمرير السلس للعنصر
   */
  smoothScroll(selector, offset = 0) {
    const element = document.querySelector(selector);
    if (element) {
      const topPosition = element.offsetTop - offset;
      window.scrollTo({
        top: topPosition,
        behavior: "smooth",
      });
    }
  }

  /**
   * عرض dialag تأكيد الطلب
   */
  showOrderConfirmation(workerName, price) {
    const confirmed = confirm(
      `هل تريد طلب الخدمة من ${workerName}؟\n💰 السعر: ${price}`,
    );

    if (confirmed) {
      this.showNotification(
        `✅ تم استلام طلبك من ${workerName}! سيتم التواصل معك قريباً.`,
        "success",
      );
      console.log(`📝 طلب جديد: ${workerName} - ${price}`);
    }
  }

  /**
   * عرض إشعار
   */
  showNotification(message, type = "info") {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // يمكن إضافة toast notification library مثل Toastify
    // أو إنشاء custom notification element
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background-color: ${this.getNotificationColor(type)};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * الحصول على لون الإشعار
   */
  getNotificationColor(type) {
    const colors = {
      success: "#3ec6ca",
      error: "#ff6b6b",
      info: "#4ecdc4",
      warning: "#ffa502",
    };
    return colors[type] || colors.info;
  }

  /**
   * إضافة الرسوم المتحركة
   */
  setupAnimations() {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes slowFadeInUp {
        from {
          opacity: 0;
          transform: translateY(40px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in-up {
        animation: slowFadeInUp 1s ease-out forwards;
      }
    `;
    document.head.appendChild(styleSheet);

    this.observeElements();
  }

  /**
   * مراقبة ظهور العناصر
   */
  observeElements() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px 0px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // إضافة فوري بدون تأخير
          entry.target.classList.add("animate-fade-in-up");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll(
      "section, .meal, .container-all, .cleaning-services",
    );
    sections.forEach((section) => {
      observer.observe(section);
    });
  }

  /**
   * إضافة التفضيلات للمستخدم
   */
  saveUserPreference(key, value) {
    try {
      localStorage.setItem(`raaya_${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`❌ فشل حفظ التفضيل ${key}:`, error);
    }
  }

  /**
   * استرجاع التفضيلات
   */
  getUserPreference(key) {
    try {
      const value = localStorage.getItem(`raaya_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`❌ فشل تحميل التفضيل ${key}:`, error);
      return null;
    }
  }

  /**
   * إضافة Smooth Scrolling مخصص
   */
  setupSmoothScrolling() {
    if (!("scrollBehavior" in document.documentElement.style)) {
      console.log("⚠️ Smooth scrolling غير مدعوم");
    }
  }
}

// ========================================
// 4. API Manager Class
// ========================================
class APIManager {
  constructor(baseURL = "https://api.raaya.com") {
    this.baseURL = baseURL;
    this.timeout = 5000;
  }

  /**
   * طلب GET
   */
  async get(endpoint) {
    try {
      const response = await Promise.race([
        fetch(`${this.baseURL}${endpoint}`),
        this.getTimeoutPromise(),
      ]);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`❌ خطأ في الطلب: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * طلب POST
   */
  async post(endpoint, data) {
    try {
      const response = await Promise.race([
        fetch(`${this.baseURL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }),
        this.getTimeoutPromise(),
      ]);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`❌ خطأ في الطلب: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * وعد بمهلة زمنية
   */
  getTimeoutPromise() {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("انتهت مهلة الانتظار")), this.timeout),
    );
  }
}

// ========================================
// 5. تهيئة التطبيق
// ========================================
class App {
  constructor() {
    this.serviceManager = new ServiceManager();
    this.uiManager = new UIManager(this.serviceManager);
    this.apiManager = new APIManager();
  }

  async init() {
    console.clear();
    console.log(
      "%c🏠 رعايه - نظام خدمات نظافة وصيانة المنازل",
      "color: #3ec6ca; font-size: 16px; font-weight: bold;",
    );
    console.log("⏳ جاري تحميل البيانات من السيرفر...");

    // تحميل البيانات من Backend
    await this.serviceManager.initializeWorkers();

    console.log("✅ تم تحميل التطبيق بنجاح");
    console.log("📊 عدد العاملين:", this.serviceManager.workers.length);
    console.log(
      "📋 العاملين:",
      this.serviceManager.workers.map((w) => w.getInfo()),
    );

    // تحميل البيانات المحفوظة من localStorage
    const savedData = this.serviceManager.loadFromLocalStorage();
    if (savedData) {
      console.log("📦 تم استرجاع الطلبات المحفوظة:", savedData.lastUpdated);
    }
  }

  /**
   * الحصول على إحصائيات التطبيق
   */
  getStats() {
    return {
      totalWorkers: this.serviceManager.workers.length,
      totalOrders: this.serviceManager.orders.length,
      cleaningWorkers: this.serviceManager.getWorkers("cleaning").length,
      maintenanceWorkers: this.serviceManager.getWorkers("maintenance").length,
      pendingOrders: this.serviceManager.orders.filter(
        (o) => o.status === "pending",
      ).length,
    };
  }

  /**
   * عرض الإحصائيات
   */
  printStats() {
    const stats = this.getStats();
    console.table(stats);
    return stats;
  }
}

// ========================================
// 6. تشغيل التطبيق
// ========================================
let app;

document.addEventListener("DOMContentLoaded", async () => {
  app = new App();
  await app.init();

  // expose global functions for console
  window.raaya = {
    app,
    serviceManager: app.serviceManager,
    uiManager: app.uiManager,
    apiManager: app.apiManager,
    stats: () => app.printStats(),
    searchWorkers: (keyword) => app.serviceManager.searchWorkers(keyword),
    getOrders: () => app.serviceManager.getOrders(),

    // Backend API Examples
    backend: {
      // مثال: جلب العاملين من Backend
      getWorkers: () => app.apiManager.get("/workers"),

      // مثال: إنشاء طلب جديد
      createOrder: (workerId, clientInfo) =>
        app.apiManager.post("/orders", {
          workerId,
          clientInfo,
          timestamp: new Date().toISOString(),
        }),

      // مثال: تحديث حالة الطلب
      updateOrder: (orderId, status) =>
        app.apiManager.post(`/orders/${orderId}`, { status }),

      // مثال: حفظ بيانات المستخدم
      saveUser: (userData) => app.apiManager.post("/users", userData),

      // مثال: الحصول على التقييمات
      getReviews: (workerId) =>
        app.apiManager.get(`/workers/${workerId}/reviews`),

      // مثال: إضافة تقييم
      addReview: (workerId, rating, comment) =>
        app.apiManager.post(`/workers/${workerId}/reviews`, {
          rating,
          comment,
        }),
    },
  };

  console.log(
    "%c💡 استخدم window.raaya للوصول إلى البيانات",
    "color: #ffa502; font-size: 12px;",
  );
  // إنشاء قائمة جانبية للهاتف — تضيف زر القوائم وثلاث شرائط (hamburger)
  // هذا الكود يُضاف ديناميكياً حتى لا نغيّر HTML الأصلي للصفحة
  function createMobileNav() {
    try {
      // نحدد العنصر الذي سنلحق به زر القائمة (غالباً الهيدر)
      const header =
        document.querySelector(".header") ??
        document.querySelector("header") ??
        document.body;

      // إذا لم يوجد هيدر أو الزر موجود مسبقاً نخرج بدون فعل شيء
      if (!header || document.querySelector(".mobile-menu-btn")) return;

      // ندرج زر الهامبرجر داخل الهيدر (ثلاث شرائط)
      header.insertAdjacentHTML(
        "beforeend",
        `
        <button class="mobile-menu-btn" type="button" aria-hidden="true">
          <span class="bar"></span><span class="bar"></span><span class="bar"></span>
        </button>`,
      );

      // ندرج الـ overlay والـ side drawer في نهاية الـ body
      document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div class="side-nav-overlay"></div>
        <nav class="side-nav">
          <button class="side-nav-close">✕</button>
          <div class="drawer-header"><div class="drawer-title">القائمة</div></div>
          <ul>
            <li><a href="#" class="side-nav-link" data-target="home">الصفحه الرئيسيه</a></li>
            <li><a href="#" class="side-nav-link" data-target="services">الخدمات</a></li>
          </ul>
        </nav>`,
      );

      // مراجع للعناصر المضافة لاستخدامها لاحقاً
      const side = document.querySelector(".side-nav");
      const overlay = document.querySelector(".side-nav-overlay");
      const btn = document.querySelector(".mobile-menu-btn");

      // دالة بسيطة لتعيين حالة الفتح/الإغلاق
      const setOpen = (open) => {
        side.classList.toggle("open", open);
        overlay.classList.toggle("open", open);
        btn.classList.toggle("open", open);
        // عند فتح اللوح نمنع التمرير بالخلفية
        document.body.style.overflow = open ? "hidden" : "";
      };

      /*
        هنا نستخدم تفويض أحداث واحد على مستوى المستند (document)
        ليغطي: فتح/إغلاق الزر، الضغط على الـ overlay، والضغط على روابط القائمة
      */
      document.addEventListener("click", (e) => {
        // إذا تم النقر على زر الهامبرجر: نقلب حالة اللوح
        if (e.target.closest(".mobile-menu-btn")) {
          e.stopPropagation();
          setOpen(!side.classList.contains("open"));
          return;
        }

        // إذا نقر المستخدم على الـ overlay أو زر الإغلاق داخل اللوح: نغلق اللوح
        if (
          e.target.closest(".side-nav-overlay") ||
          e.target.closest(".side-nav-close")
        ) {
          setOpen(false);
          return;
        }

        // إذا نقر المستخدم على رابط داخل اللوح: نمنع السلوك الافتراضي، نغلق اللوح وننتقل للهدف
        const a = e.target.closest("a.side-nav-link");
        if (!a) return;
        e.preventDefault();
        const { target } = a.dataset;
        setOpen(false);
        if (target === "home") window.scrollTo({ top: 0, behavior: "smooth" });
        if (target === "services")
          document
            .querySelector(".cleaning-services")
            ?.scrollIntoView({ behavior: "smooth" });
      });
    } catch (err) {
      // في حال حدوث خطأ أثناء إنشاء القائمة نطبع تحذير للمطوّر
      console.warn("mobile nav init error", err);
    }
  }

  createMobileNav();
});

// معالجة الأخطاء العامة
window.addEventListener("error", (event) => {
  console.error("❌ خطأ:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("❌ وعد مرفوض بدون معالج:", event.reason);
});

// ========================================
// 2. معالج أزرار الطلب (طلب الخدمة)
// ========================================

const orderButtons = document.querySelectorAll(".chair-price a, .btn--small");

orderButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const workerCard = button.closest(".meal");
    if (workerCard) {
      const workerName =
        workerCard.querySelector(".meal-title")?.textContent || "عامل";
      const price =
        workerCard.querySelector(".chair-price strong")?.textContent || "";
      orderService(workerName, price);
    }
  });
});

// دالة لمعالجة طلب الخدمة
function orderService(workerName, price) {
  const confirmOrder = confirm(
    `هل تريد طلب الخدمة من ${workerName}؟\nالسعر: ${price}`,
  );
  if (confirmOrder) {
    alert(`تم استلام طلبك من ${workerName}! سيتم التواصل معك قريباً.`);
    // هنا يمكن إرسال البيانات إلى السيرفر
  }
}

// ========================================
// 3. معالج أزرار "المزيد"
// ========================================

const mainActionButtons = document.querySelectorAll(".btn--big");

mainActionButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const buttonText = button.textContent.trim();

    if (buttonText === "المزيد عن رعايه") {
      scrollToSection("section-home2");
    }
  });
});

// دالة للتمرير للقسم المحدد
function scrollToSection(sectionClass) {
  const section = document.querySelector(`.${sectionClass}`);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

// ========================================
// 4. معالج أزرار طلب الخدمة (الأقسام الرئيسية)
// ========================================

const servicingLinks = document.querySelectorAll(".servicing a");

servicingLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const section = link.closest(".cleaning-services");
    if (section) {
      const serviceType = section.querySelector("h1")?.textContent || "الخدمة";
      alert(`تم تحديد الخدمة: ${serviceType}\nسيتم توجيهك إلى صفحة الطلب.`);
      // هنا يمكن إعادة التوجيه إلى صفحة الطلب
    }
  });
});

// ========================================
// 5. معالج روابط الفوتر
// ========================================

const footerLinks = document.querySelectorAll(".link ul li a");

footerLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const href = link.getAttribute("href");
    const linkText = link.textContent.trim();

    if (href === "#") {
      // تمرير سلس للأقسام
      if (linkText === "الصفحه الرئيسه") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (linkText === "تفاصيل عن رعايه") {
        scrollToSection("section-home2");
      } else if (linkText === "الخدمات") {
        const servicesSection = document.querySelector(".cleaning-services");
        if (servicesSection) {
          servicesSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  });
});

// ========================================
// 6. إضافة تأثيرات عند التمرير على الأزرار
// ========================================

function addHoverEffects() {
  const allButtons = document.querySelectorAll(
    'a[href="#"], .btn--big, .chair-price a, .servicing a',
  );

  allButtons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      button.style.transition = "all 0.3s ease";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transition = "all 0.3s ease";
    });
  });
}

// ========================================
// 7. إضافة تأثيرات الرسوم المتحركة عند التمرير
// ========================================

function observeElements() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animation = "fadeInUp 0.6s ease forwards";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const sections = document.querySelectorAll(
    "section, .meal, .container-all, .cleaning-services",
  );
  sections.forEach((section) => {
    observer.observe(section);
  });
}

// إضافة أنيميشن fadeInUp
const style = document.createElement("style");
style.innerHTML = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

// ========================================
// 8. معالج البحث والتصفية
// ========================================
// ملاحظة: البيانات تأتي من Backend عبر ServiceManager
// استخدم: app.serviceManager.getWorkers() و app.serviceManager.searchWorkers()

// ========================================
// 9. تفعيل الرسوم المتحركة والمتفاعلات
// ========================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    addHoverEffects();
    observeElements();
  });
} else {
  addHoverEffects();
  observeElements();
}

// ========================================
// 10. معالج الأخطاء العام
// ========================================

window.addEventListener("error", (e) => {
  console.error("❌ حدث خطأ:", e.message);
});

// ========================================
// 12. معالج حفظ البيانات المحلية (اختياري)
// ========================================

function saveUserPreference(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("⚠️ لا يمكن حفظ البيانات المحلية:", e);
  }
}

function getUserPreference(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.warn("⚠️ لا يمكن قراءة البيانات المحلية:", e);
    return null;
  }
}

console.log(
  "%c🎨 تم تحميل ملف JavaScript بنجاح - رعايه",
  "color: #3ec6ca; font-size: 14px; font-weight: bold;",
);
