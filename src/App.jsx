import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import AddStock from "./pages/AddStock";
import StockOverview from "./pages/StockOverview";
import Dashboard from "./pages/Dashboard";
import IssueStock from "./pages/IssueStock";
import "./components/Layout.css";
import ReturnStock from "./pages/ReturnStock";
import StockHistory from "./pages/StockHistory";
import BranchStock from "./pages/BranchStock";
// import Requirements from "./pages/RequirementDEtails";
import Requirements from "./pages/Requirements";
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <Sidebar isOpen={sidebarOpen} />

      <main className="main-content">
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/stock" element={<StockOverview />} />

            <Route path="/add-stock" element={<AddStock />} />

            <Route path="/issue-stock" element={<IssueStock />} />

            <Route path="/return-stock" element={<ReturnStock />} />

            <Route path="/stock-history" element={<StockHistory />} />

            <Route path="/branch-stock" element={<BranchStock />} />

            <Route path="/requirements" element={<Requirements />} />

            {/* <Route path="/reports" element={<Reports />} /> */}

            <Route path="/settings" element={<h1>Settings</h1>} />
          </Routes>
        </div>
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
