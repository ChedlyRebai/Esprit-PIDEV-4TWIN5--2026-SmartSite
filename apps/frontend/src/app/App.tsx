import { RouterProvider } from 'react-router';
import toast, { Toaster } from "react-hot-toast";
import { router } from './routes';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}
