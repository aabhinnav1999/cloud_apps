import { useNotifications } from "../context/NotificationContext.jsx";
import { extractErrorMessage } from "../api/client.js";
import { useState } from "react";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function Notifications() {
  const { notifications, loading, markRead, remove, refresh } = useNotifications();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function handleRead(id) {
    setBusyId(id);
    setError("");
    try {
      await markRead(id);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not update notification"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setError("");
    try {
      await remove(id);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not delete notification"));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="muted">Loading notifications…</p>;
  }

  return (
    <section>
      <div className="page-head">
        <h1>Notifications</h1>
        <button className="btn btn-ghost" onClick={refresh}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {notifications.length === 0 ? (
        <p className="muted">You have no notifications yet.</p>
      ) : (
        <ul className="notif-list">
          {notifications.map((n) => {
            const unread = n.status !== "READ";
            return (
              <li key={n._id} className={`notif ${unread ? "unread" : ""}`}>
                <div className="notif-main">
                  <div className="notif-top">
                    <span className="notif-title">{n.title}</span>
                    <span className={`chip chip-${(n.type || "general").toLowerCase()}`}>
                      {n.type || "GENERAL"}
                    </span>
                  </div>
                  <p className="notif-msg">{n.message}</p>
                  <span className="muted small">{formatDate(n.createdAt)}</span>
                </div>
                <div className="notif-actions">
                  {unread && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRead(n._id)}
                      disabled={busyId === n._id}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    className="link-danger"
                    onClick={() => handleDelete(n._id)}
                    disabled={busyId === n._id}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
