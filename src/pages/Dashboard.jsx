import { useAuth } from "../auth/useAuth";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header>
        <h1>MerqonTrades</h1>
        <button onClick={logout}>Log out</button>
      </header>
      <main>
        <h2>Welcome, {user.name}</h2>
        <p className="muted">Role: {user.role}</p>
        <p>Login works. Products, stock and sales pages will go here.</p>
      </main>
    </div>
  );
}