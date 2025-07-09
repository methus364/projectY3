import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "../page/user/Home";
import Dashbord from "../page/admin/Dashbord";
import LayoutAdmin from "../layouts/LayoutAdmin";
// รวม Router สำหรับเปลี่ยนไปหน้าต่างๆ
const router = createBrowserRouter([
  {
    // router ฝั่ง admin
    path: "/admin",
    element: <LayoutAdmin />,
    children: [
      { index: true, element: <Dashbord /> },
    ],
  },
// router ฝั่ง user
  {
    path: "/",
    children: [
      { index: true, element: <Home/> },
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
