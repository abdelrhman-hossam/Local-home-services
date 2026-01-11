// ====================================
// ملف البرمجة للواجهة الأمامية - Frontend Script
// ====================================

// متغير لتخزين الخدمات المتاحة
let availableServices = [];

// تحديد عنوان الـ API بناءً على البيئة
// إذا كنا على المنفذ 5000 (الخادم المدمج)، نستخدم المسار النسبي - وإلا نستخدم 5000
const isProduction = window.location.port === '5000';
const API_BASE_URL = isProduction ? '' : `http://${window.location.hostname}:5000`;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 تطبيق رعاية جاهز...');

    // Mobile Menu Toggle
    setupMobileMenu();

    // إعداد النافذة المنبثقة للحجز
    setupBookingModal();

    // جلب الخدمات من الـ API
    fetchServices().then(() => {
        // تحديد الصفحة الحالية
        const isHomePage = document.querySelector('.hero-section') !== null;
        const servicesContainer = document.getElementById('services-container');

        if (servicesContainer) {
            if (isHomePage) {
                renderHomePageServices(servicesContainer);
            } else {
                renderAllServices(servicesContainer);
            }
        }
    });
});

/**
 * إعداد قائمة الموبايل
 */
function setupMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (mobileBtn && mobileNav) {
        mobileBtn.addEventListener('click', () => {
            mobileBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileBtn.classList.remove('active');
                mobileNav.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!mobileNav.contains(e.target) && !mobileBtn.contains(e.target) && mobileNav.classList.contains('active')) {
                mobileBtn.classList.remove('active');
                mobileNav.classList.remove('active');
            }
        });
    }
}

/**
 * جلب الخدمات من الباك اند وتخزينها
 */
async function fetchServices() {
    try {
        console.log(`📡 Fetching from: ${API_BASE_URL}/api/services`);
        const response = await fetch(`${API_BASE_URL}/api/services`);

        // محاكاة البيانات إذا كان الخادم مفصولاً
        if (response.status === 503 || !response.ok) {
            console.warn('⚠️ وضع المحاكاة: قاعدة البيانات غير متصلة');
            availableServices = getMockServices();
            return;
        }

        const result = await response.json();
        if (result.success) {
            console.log('✅ تم جلب الخدمات:', result.data);
            availableServices = result.data;
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error);
        availableServices = getMockServices();
    }
}

/**
 * عرض خدمات الصفحة الرئيسية (مختارة)
 */
function renderHomePageServices(container) {
    container.innerHTML = ''; // مسح المحتوى القديم

    // نختار خدمة نظافة وخدمة صيانة للعرض
    const cleaningService = availableServices.find(s => s.name.includes('نظافة') || s.description.includes('نظافة')) || availableServices[0];
    const maintenanceService = availableServices.find(s => s.name.includes('صيانة') || s.description.includes('صيانة')) || availableServices[1];

    if (!cleaningService && !maintenanceService) return;

    // 1. خدمة النظافة
    if (cleaningService) {
        const html = `
            <div class="service-row cleaning-services">
                <div class="service-content">
                    <h2 class="sico">${cleaningService.name}... <span class="text-primary">لأنها رعاية</span></h2>
                    <p>${cleaningService.description}</p>
                    <button class="zorar btn btn-primary" onclick="openOrderModal('${cleaningService.name}', '${cleaningService._id}')">اطلب الخدمة الآن</button>
                </div>
                <div class="service-img">
                    <img src="photo_2025-12-19_22-22-04.jpg" alt="${cleaningService.name}">
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    }

    // 2. خدمة الصيانة (معكوسة)
    if (maintenanceService) {
        const html = `
            <div class="service-row reverse cleaning-services-1">
                <div class="service-content">
                    <h2 class="sico">${maintenanceService.name}... <span class="text-primary">لأنها رعاية</span></h2>
                    <p>${maintenanceService.description}</p>
                    <button class="zorar btn btn-primary" onclick="openOrderModal('${maintenanceService.name}', '${maintenanceService._id}')">اطلب الخدمة الآن</button>
                </div>
                <div class="service-img">
                    <img src="photo_2025-12-19_22-22-10.jpg" alt="${maintenanceService.name}">
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    }
}

/**
 * عرض جميع الخدمات (صفحة الخدمات)
 */
function renderAllServices(container) {
    container.innerHTML = '';
    container.className = 'services-grid-page container'; // إضافة كلاس للتنسيق

    // إضافة تنسيق CSS للشبكة ديناميكياً إذا لم يكن موجوداً
    if (!document.getElementById('services-grid-style')) {
        const style = document.createElement('style');
        style.id = 'services-grid-style';
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

    availableServices.forEach(service => {
        // تحديد الصورة بناءً على النوع
        let imgSrc = 'photo_2025-12-19_22-22-19.jpg'; // افتراضي
        if (service.name.includes('صيانة') || service.description.includes('كهرباء')) imgSrc = 'photo_2025-12-19_22-22-15.jpg';
        if (service.name.includes('نظافة')) imgSrc = 'photo_2025-12-19_22-22-04.jpg';

        const html = `
            <div class="service-card-full">
                <div class="service-card-img">
                    <img src="${imgSrc}" alt="${service.name}">
                </div>
                <div class="service-card-body">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="service-price">${service.price} ج.م</div>
                    <button class="btn btn-outline" style="width:100%" onclick="openOrderModal('${service.name}', '${service._id}')">طلب الخدمة</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

/**
 * إعداد النافذة المنبثقة للحجز (Modal) وحقنها في الـ DOM
 */
let currentServiceId = '';

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
                        <label for="userAddress">العنوان بالتفصيل</label>
                        <textarea id="userAddress" placeholder="أدخل عنوانك بالتفصيل هنا" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary submit-btn">إرسال الطلب</button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('bookingModal');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('bookingForm');

    // إغلاق النافذة عند الضغط على زر X
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // إغلاق النافذة عند الضغط خارجها
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // معالجة إرسال النموذج
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('userName').value;
        const phone = document.getElementById('userPhone').value;
        const address = document.getElementById('userAddress').value;

        await submitOrder({
            user_name: name,
            user_phone: phone,
            user_address: address,
            serviceId: currentServiceId
        });

        // إغلاق النافذة وتفريغ الحقول
        modal.classList.remove('active');
        form.reset();
    });
}

/**
 * فتح نموذج الطلب
 */
window.openOrderModal = function (serviceName, serviceId) {
    currentServiceId = serviceId;
    document.getElementById('modalTitle').textContent = `طلب خدمة: ${serviceName}`;
    document.getElementById('bookingModal').classList.add('active');
};

/**
 * إرسال الطلب
 */
async function submitOrder(orderData) {
    try {
        // إذا كان المعرف يبدأ بـ mock، فهو محاكاة
        if (typeof orderData.serviceId === 'string' && orderData.serviceId.startsWith('mock')) {
            alert('⚠️ النظام في وضع المحاكاة. تم قبول الطلب (محلياً فقط).');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        // إذا كان الخادم مفصولاً
        if (response.status === 503) {
            alert('⚠️ النظام في وضع الصيانة. لا يمكن حفظ الطلب حالياً.');
            return;
        }

        const result = await response.json();
        if (result.success) {
            alert('🎉 تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً.');
        } else {
            alert('❌ فشل في إرسال الطلب: ' + (result.message || 'خطأ غير معروف'));
        }
    } catch (error) {
        alert('❌ حدث خطأ في الاتصال بالخادم.');
        console.error(error);
    }
}

/**
 * بيانات وهمية للمحاكاة
 */
function getMockServices() {
    return [
        { _id: 'mock1', name: 'تنظيف شامل للمنزل', description: 'تنظيف عميق وشامل لجميع الغرف', price: 500 },
        { _id: 'mock2', name: 'صيانة كهرباء', description: 'إصلاح جميع الأعطال الكهربائية بأمان', price: 200 },
        { _id: 'mock3', name: 'صيانة سباكة', description: 'حل مشاكل التسريب والانسداد', price: 150 },
        { _id: 'mock4', name: 'مكافحة حشرات', description: 'قضاء تام على الحشرات بمواد آمنة', price: 300 },
        { _id: 'mock5', name: 'نظافة خزانات', description: 'غسيل وتعقيم خزانات المياه', price: 400 },
        { _id: 'mock6', name: 'صيانة تكييف', description: 'غسيل وشحن فريون وصيانة', price: 250 }
    ];
}
