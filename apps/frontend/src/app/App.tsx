import { RouterProvider } from "react-router";
import { Toaster } from "react-hot-toast";
import { router } from "./routes";
import ModalProvider from "./provider/ModalProvider";
import ThemeSync from "./components/ThemeSync";
import { ThemeProvider } from "./context/ThemeContext";
import "@svar-ui/react-gantt/all.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "./context/LanguageContext";

const queryClient = new QueryClient();

export default function App() {
  return (
    <>
      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeSync />
            <RouterProvider router={router} />

            <ModalProvider />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </>
  );
}
