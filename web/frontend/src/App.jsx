import { useState, useEffect } from "react";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { UserLogsPage } from "./pages/UserLogsPage";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Toast } from "./components/Toast";
import { adminService } from "./api/adminService";

function App() {
  const [token, setToken] = useState(localStorage.getItem("admin_token"));
  const [loggedInAdmin, setLoggedInAdmin] = useState(localStorage.getItem("admin_user"));
  const [companyName, setCompanyName] = useState(localStorage.getItem("company_name") || "Neo");
  const [currentTab, setCurrentTab] = useState("Dashboard");
  
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    try {
      const data = await adminService.login(username, password);
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", username);
      localStorage.setItem("company_name", data.companyName);
      setToken(data.token);
      setLoggedInAdmin(username);
      setCompanyName(data.companyName);
      showToast("Welcome back, " + username);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("company_name");
    setToken(null);
    setLoggedInAdmin(null);
    setCompanyName("Neo");
    setSelectedUser(null);
    setUsers([]);
    setLogs([]);
    setCurrentTab("Dashboard");
  };

  const loadUsers = async () => {
    if (!token) return;
    try {
      const data = await adminService.getUsers(token);
      setUsers(data);
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("token")) {
        handleLogout();
      }
    }
  };

  const handleCreateUser = async (username, password) => {
    setLoading(true);
    try {
      await adminService.createUser(token, username, password);
      showToast("User provisioned successfully");
      loadUsers();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (username) => {
    setSelectedUser(username);
    setLoading(true);
    try {
      const data = await adminService.getLogs(token, username);
      setLogs(data);
      setCurrentTab("UserLogs"); // Move to logs page
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadUsers();
  }, [token]);

  if (!token) {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} />}
        <AuthPage onLogin={handleLogin} loading={loading} />
      </>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case "Dashboard":
        return (
          <DashboardPage 
            users={users}
            logs={logs}
            selectedUser={selectedUser}
            loading={loading}
            loggedInAdmin={loggedInAdmin}
            onCreateUser={handleCreateUser}
            onLoadLogs={loadLogs}
          />
        );
      case "Employees":
        return (
          <EmployeesPage 
            users={users} 
            onLoadLogs={loadLogs} 
            onCreateUser={handleCreateUser} 
            loading={loading}
          />
        );
      case "UserLogs":
        return (
          <UserLogsPage 
            username={selectedUser} 
            logs={logs} 
            onBack={() => setCurrentTab("Dashboard")} 
          />
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fe]">
      {/* Sidebar - Fixed Width */}
      <Sidebar 
        activeTab={currentTab} 
        onTabChange={setCurrentTab} 
        onLogout={handleLogout} 
        companyName={companyName}
      />

      {/* Main Content Area - Flexible Width with Offset */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <Topbar adminName={loggedInAdmin} />
        
        <main className="flex-1">
          {renderContent()}
        </main>

        <footer className="p-8 text-center border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            &copy; 2026 Astraval Neo &bull; All Rights Reserved
          </p>
        </footer>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
