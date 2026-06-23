// ============================================================
// Social Auth (ฝั่ง client) — เรียก SDK ของแต่ละ provider แล้วได้ token
// แล้วส่ง token ให้ backend ตรวจ (backend ไม่เชื่อโปรไฟล์ที่ client ส่งตรงๆ)
// อ่าน client id จาก .env ของ Vite (VITE_*) — ถ้าไม่ตั้ง = ปุ่มยังไม่พร้อมใช้
// วิธีขอ client id ดูใน docs/SOCIAL_LOGIN_SETUP.md
// ============================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;

// เช็คว่า provider ตั้งค่า client id แล้วหรือยัง
export function isConfigured(provider) {
    if (provider === "google") return !!GOOGLE_CLIENT_ID;
    if (provider === "facebook") return !!FACEBOOK_APP_ID;
    if (provider === "line") return !!LINE_CHANNEL_ID;
    return false;
}

// โหลด <script> ของ SDK ครั้งเดียว (กันโหลดซ้ำ)
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const el = document.createElement("script");
        el.src = src;
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error("โหลด SDK ไม่สำเร็จ: " + src));
        document.head.appendChild(el);
    });
}

// ---------- Google: ได้ id_token ผ่าน Google Identity Services ----------
export async function getGoogleIdToken() {
    if (!GOOGLE_CLIENT_ID) throw new Error("ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID");
    await loadScript("https://accounts.google.com/gsi/client");

    return new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (resp) => {
                if (resp.credential) resolve(resp.credential); // = id_token (JWT)
                else reject(new Error("ไม่ได้รับ token จาก Google"));
            },
        });
        // เปิดหน้าต่างเลือกบัญชี Google
        window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                reject(new Error("หน้าต่าง Google ไม่แสดง/ถูกข้าม (ตรวจ cookie ของเบราว์เซอร์)"));
            }
        });
    });
}

// ---------- Facebook: ได้ access_token ผ่าน FB JS SDK ----------
export async function getFacebookAccessToken() {
    if (!FACEBOOK_APP_ID) throw new Error("ยังไม่ได้ตั้งค่า VITE_FACEBOOK_APP_ID");
    await loadScript("https://connect.facebook.net/en_US/sdk.js");
    window.FB.init({ appId: FACEBOOK_APP_ID, version: "v19.0", cookie: true });

    return new Promise((resolve, reject) => {
        window.FB.login((resp) => {
            if (resp.authResponse?.accessToken) resolve(resp.authResponse.accessToken);
            else reject(new Error("ยกเลิก หรือเข้าสู่ระบบ Facebook ไม่สำเร็จ"));
        }, { scope: "public_profile,email" });
    });
}

// ---------- LINE: redirect ไปหน้า login ของ LINE (กลับมาที่ /auth/line/callback) ----------
export function startLineLogin() {
    if (!LINE_CHANNEL_ID) throw new Error("ยังไม่ได้ตั้งค่า VITE_LINE_CHANNEL_ID");
    const redirectUri = `${window.location.origin}/auth/line/callback`;
    const state = Math.random().toString(36).slice(2); // กัน CSRF
    sessionStorage.setItem("line_state", state);

    const url = "https://access.line.me/oauth2/v2.1/authorize?response_type=code"
        + `&client_id=${LINE_CHANNEL_ID}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&state=${state}`
        + `&scope=${encodeURIComponent("openid profile email")}`;
    window.location.href = url;
}
