import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AdminRoute, PrivateRoute, MonthlyRoute } from './ProtectedRoute';
import Home from "../page/user/Home";
import Login from "../page/user/Login";
import Rooms from "../page/admin/Rooms";
import Products from "../page/admin/Products";
import Customer from "../page/admin/Customer";
import CustomerMonthly from "../page/admin/CustomerMonthly";
import BillList from "../page/admin/BillList";
import Repair from "../page/admin/Repair";
import Meter from "../page/admin/Meter";
import Register from "../page/user/Register";
import VerifyEmail from "../page/user/VerifyEmail";
import CompleteProfile from "../page/user/CompleteProfile";
import Dashbord from "../page/admin/Dashbord";
import LayoutAdmin from "../layouts/LayoutAdmin";
import Roomuser from "../page/user/Roomuser";
import Roomhistory from "../page/user/Roomhistory";
import Profile from "../page/user/Profile";
import Editprofile from "../page/user/Editprofile";
import Contact from "../page/user/Contact";
import MoneyList from "../page/admin/MoneyList";
import BookingManagementDaily from "../page/admin/BookingManagementDaily";
import BookingManagementMonthly from "../page/admin/BookingManagementMonthly";
import RepairRequest from "../page/user/RepairRequest";
import MyBills from "../page/user/MyBills";
import MyContracts from "../page/user/MyContracts";
import LineCallback from "../page/user/LineCallback";
import GoogleCallback from "../page/user/GoogleCallback";
import ForgotPassword from "../page/user/ForgotPassword";
import About from "../page/user/About";
import Gallery from "../page/user/Gallery";
import Contracts from "../page/admin/Contracts";
import AuditLogs from "../page/admin/AuditLogs";

// รวม Router สำหรับเปลี่ยนไปหน้าต่างๆ
const router = createBrowserRouter([
  {
    // router ฝั่ง admin — ต้องเป็น Admin เท่านั้น (AdminRoute กัน tenant เข้าไม่ได้)
    path: "/admin",
    element: <AdminRoute><LayoutAdmin /></AdminRoute>,
    children: [
      { index: true, element: <Dashbord /> },
      { path: "rooms", element: <Rooms /> },
      { path: "products", element: <Products /> },
      { path: "customers", element: <Customer /> },
      { path: "customers-monthly", element: <CustomerMonthly /> },
      { path: "bill-daily", element: <BillList rentType="daily" title="บิลรายวัน" /> },
      { path: "bill-monthly", element: <BillList rentType="monthly" title="บิลรายเดือน" /> },
      { path: "contracts", element: <Contracts /> },
      { path: "audit-logs", element: <AuditLogs /> },
      { path: "meter", element: <Meter /> },
      { path: "repair", element: <Repair /> },
      { path: "money-daily", element: <MoneyList rentType="daily" title="ชำระเงิน/ใบเสร็จรายวัน" /> },
      { path: "money-monthly", element: <MoneyList rentType="monthly" title="ชำระเงิน/ใบเสร็จรายเดือน" /> },
      { path: "booking-daily", element: <BookingManagementDaily /> },
      { path: "booking-monthly", element: <BookingManagementMonthly /> },
    ],
  },
  // router ฝั่ง user
  {
    path: "/",
    children: [
      // หน้าสาธารณะ — เข้าได้ทุกคน
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "complete-profile", element: <PrivateRoute><CompleteProfile /></PrivateRoute> },
      { path: "contact", element: <Contact /> },
      { path: "about", element: <About /> },
      { path: "gallery", element: <Gallery /> },
      { path: "roomuser", element: <Roomuser /> },
      { path: "auth/line/callback", element: <LineCallback /> },
      { path: "auth/google/callback", element: <GoogleCallback /> },
      // หน้าส่วนตัว — ต้อง login (PrivateRoute redirect ไป /login ถ้ายังไม่มี token)
      { path: "roomhistory", element: <PrivateRoute><Roomhistory /></PrivateRoute> },
      { path: "profile", element: <PrivateRoute><Profile /></PrivateRoute> },
      { path: "Editprofile", element: <PrivateRoute><Editprofile /></PrivateRoute> },
      { path: "repairrequest", element: <MonthlyRoute><RepairRequest /></MonthlyRoute> },
      { path: "mybills", element: <PrivateRoute><MyBills /></PrivateRoute> },
      { path: "mycontracts", element: <MonthlyRoute><MyContracts /></MonthlyRoute> },
    ],
  },
]);

const AppRouter = () => {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
};

export default AppRouter;
