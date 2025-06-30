import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Invite from "./pages/Invite";
import AccountRecords from "./pages/AccountRecords";
import Withdraw from "./pages/Withdraw";
import Recharge from "./pages/Recharge";
import Plans from "./pages/Plans";
import Channel from "./pages/Channel";
import Online from "./pages/Online";
import NotFound from "./pages/NotFound";
import React from "react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/account-records" element={<AccountRecords />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/recharge" element={<Recharge />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/channel" element={<Channel />} />
          <Route path="/online" element={<Online />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
    </React.StrictMode>
  </QueryClientProvider>
);

export default App;
