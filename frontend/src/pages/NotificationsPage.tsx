import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

export function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/notifications");
      setItems(response.data.notifications);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    await load();
  }

  if (loading) return <LoadingState message="Loading notifications..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Notifications</h1>
          <p>Appointment, care-plan and support updates.</p>
        </div>
      </div>

      <div className="card">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.read ? "notification-row read" : "notification-row"}
              onClick={() => markRead(item.id)}
            >
              <span>
                <strong>{item.title}</strong>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </span>
              <p>{item.message}</p>
            </button>
          ))
        ) : (
          <EmptyState
            title="No notifications"
            message="Important appointment and care-plan updates will appear here."
          />
        )}
      </div>
    </>
  );
}
