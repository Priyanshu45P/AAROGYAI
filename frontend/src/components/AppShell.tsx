import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  BrainCircuit,
  CalendarDays,
  ClipboardList,
  FileHeart,
  HeartPulse,
  Link2,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { api } from "../lib/api";

export function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  async function loadNotifications() {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications);
    } catch {
      // Notification errors should not block the main workspace.
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    await loadNotifications();
  }

  const unread = notifications.filter((item) => !item.read).length;

  const links =
    user?.role === "PATIENT"
      ? [
          ["/patient", "Dashboard", Activity],
          ["/patient/readings", "Readings", HeartPulse],
          ["/patient/medical", "Medical History", FileHeart],
          ["/patient/behaviour", "Behaviour", ClipboardList],
          ["/patient/ai-insights", "AI Insights", BrainCircuit],
          ["/patient/appointments", "Appointments", CalendarDays],
          ["/patient/care-plan", "Care Plan", ClipboardList],
          ["/patient/progress", "Progress", Activity],
          ["/patient/notifications", "Notifications", Bell],
          ["/patient/profile", "Profile", UserRound],
        ]
      : user?.role === "CLINICIAN"
      ? [
          ["/clinician", "Dashboard", Stethoscope],
          ["/clinician/patients", "Patients", Users],
          ["/clinician/appointments", "Appointments", CalendarDays],
        ]
      : [
          ["/admin", "Dashboard", ShieldCheck],
          ["/admin/users", "Users", Users],
          ["/admin/assignments", "Care Access", Link2],
          ["/admin/audit", "Audit", ClipboardList],
        ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>AAROGYAI</strong>
            <small>Intelligent Care</small>
          </div>
        </div>

        <nav>
          {links.map(([to, label, Icon]: any) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/patient" || to === "/clinician" || to === "/admin"}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          className="logout"
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="notification-wrap">
            <button
              className="icon-button"
              type="button"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Bell size={19} />
              {unread > 0 && <b>{unread}</b>}
            </button>

            {open && (
              <div className="notification-menu">
                <h4>Notifications</h4>
                {notifications.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      item.read
                        ? "notification-item read"
                        : "notification-item"
                    }
                    onClick={() => markRead(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </button>
                ))}
                {!notifications.length && (
                  <p className="muted">No notifications.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <strong>
              {user?.firstName} {user?.lastName}
            </strong>
            <span>{user?.role}</span>
          </div>
        </header>

        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
