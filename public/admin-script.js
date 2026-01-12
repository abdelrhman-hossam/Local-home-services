// ====================================
// منطق لوحة التحكم - Admin Logic
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من الصلاحيات فوراً
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // تحميل البيانات الأولية
    loadDashboardStats();
    loadAdminOrders();
});

const token = localStorage.getItem('token');
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

/**
 * تحميل إحصائيات لوحة التحكم
 */
async function loadDashboardStats() {
    try {
        const servicesRes = await fetch(`${API_BASE_URL}/api/services`);
        const servicesData = await servicesRes.json();
        document.getElementById('totalServices').textContent = servicesData.count || 0;

        const ordersRes = await fetch(`${API_BASE_URL}/api/orders`, { headers });
        const ordersData = await ordersRes.json();

        const newOrdersCount = ordersData.data.filter(o => o.status === 'جديد').length;
        document.getElementById('newOrders').textContent = newOrdersCount;

    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

/**
 * تحميل وجدولة الطلبات في الجدول
 */
async function loadAdminOrders() {
    const tableBody = document.getElementById('recentOrdersTable');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, { headers });
        const result = await response.json();

        if (result.success) {
            tableBody.innerHTML = result.data.slice(0, 10).map(order => `
                <tr>
                    <td>${order.user_name}</td>
                    <td>الخدمة #${order.serviceId.length}</td>
                    <td>${new Date(order.order_date).toLocaleDateString('ar-EG')}</td>
                    <td><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></td>
                    <td>
                        <select onchange="updateOrderStatus('${order._id}', this.value)" class="action-btn">
                            <option value="جديد" ${order.status === 'جديد' ? 'selected' : ''}>جديد</option>
                            <option value="قيد التنفيذ" ${order.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
                            <option value="مكتمل" ${order.status === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
                            <option value="ملغي" ${order.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
                        </select>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading orders:', err);
    }
}

/**
 * تحديث حالة الطلب
 */
window.updateOrderStatus = async function (id, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            alert('✅ تم تحديث حالة الطلب بنجاح');
            loadDashboardStats();
            loadAdminOrders();
        }
    } catch (err) {
        alert('❌ فشل تحديث الطلب');
    }
};

/**
 * تحميل الخدمات في قسم الإدارة
 */
window.loadAdminServices = async function () {
    const tableBody = document.getElementById('adminServicesTable');
    try {
        const response = await fetch(`${API_BASE_URL}/api/services`);
        const result = await response.json();

        tableBody.innerHTML = result.data.map(service => `
            <tr>
                <td>${service.name}</td>
                <td>${service.price} ج.م</td>
                <td>${service.department_id || 'عام'}</td>
                <td>
                    <button onclick="deleteService('${service._id}')" class="action-btn" style="color: red;">حذف</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
};

/**
 * حذف خدمة
 */
window.deleteService = async function (id) {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/services/${id}`, {
            method: 'DELETE',
            headers
        });

        if (response.ok) {
            loadAdminServices();
            loadDashboardStats();
        }
    } catch (err) {
        alert('❌ فشل الحذف');
    }
};

function getStatusClass(status) {
    switch (status) {
        case 'جديد': return 'status-new';
        case 'قيد التنفيذ': return 'status-pending';
        case 'مكتمل': return 'status-completed';
        default: return '';
    }
}
