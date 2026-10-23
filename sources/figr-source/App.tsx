import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { AppProvider } from "./lib/app";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
