import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./router/routes.jsx";
import { AuthProvider } from "../shared/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: 13, fontFamily: 'inherit' },
          success: { duration: 2500 },
          error:   { duration: 4000 },
        }}
      />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}