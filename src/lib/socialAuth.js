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
        // ถ้ามี tag เดิมอยู่แล้ว: โหลดเสร็จแล้ว → resolve เลย · ยังโหลดไม่เสร็จ → รอ event load ของ tag เดิม
        // (กัน resolve ก่อนเวลาเมื่อถูกเรียกซ้ำ เช่น React StrictMode เรียก useEffect 2 รอบ)
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (existing.dataset.loaded === "true") return resolve();
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("โหลด SDK ไม่สำเร็จ: " + src)));
            return;
        }
        const el = document.createElement("script");
        el.src = src;
        el.async = true;
        el.onload = () => { el.dataset.loaded = "true"; resolve(); };
        el.onerror = () => reject(new Error("โหลด SDK ไม่สำเร็จ: " + src));
        document.head.appendChild(el);
    });
}

// ---------- Google: redirect ไปหน้า login ของ Google (กลับมาที่ /auth/google/callback) ----------
// ใช้ redirect flow แบบเดียวกับ LINE — backend แลก code เป็น id_token เอง (ใน /auth/google/exchange)
// เลี่ยงปัญหาของปุ่ม GSI (Cross-Origin-Opener-Policy, third-party cookie)
export function startGoogleLogin() {
    if (!GOOGLE_CLIENT_ID) throw new Error("ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID");
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const state = Math.random().toString(36).slice(2); // กัน CSRF
    sessionStorage.setItem("google_state", state);

    const url = "https://accounts.google.com/o/oauth2/v2/auth?response_type=code"
        + `&client_id=${GOOGLE_CLIENT_ID}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&state=${state}`
        + `&scope=${encodeURIComponent("openid profile email")}`;
    window.location.href = url;
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
