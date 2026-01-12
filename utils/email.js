// ====================================
// أداة إرسال البريد - Email Utility
// ====================================
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    // إنشاء ناقل (Transporter)
    // ملاحظة: للاستخدام التجاري، استخدم Gmail أو Outlook أو خدمات مثل SendGrid
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_USER || "your_ethereal_user",
            pass: process.env.SMTP_PASS || "your_ethereal_pass",
        },
    });

    // إعدادات البريد
    const message = {
        from: `${process.env.FROM_NAME || "رعاية للمهام المنزلية"} <${process.env.FROM_EMAIL || "noreply@raya.com"}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // إرسال البريد
    const info = await transporter.sendMail(message);

    console.log("✅ تم إرسال البريد بنجاح: %s", info.messageId);
};

module.exports = sendEmail;
