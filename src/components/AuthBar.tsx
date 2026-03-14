import type { AuthState } from "../hooks/useAuth";

interface AuthBarProps {
  auth: AuthState;
}

export function AuthBar({ auth }: AuthBarProps) {
  if (!auth.isLoggedIn) {
    return (
      <div className="auth-bar">
        <button className="btn btn-twitch" onClick={() => auth.loginMock(0)}>
          Login with Twitch (Demo 1)
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => auth.loginMock(1)}>
          Demo 2
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => auth.loginMock(2)}>
          Demo 3
        </button>
      </div>
    );
  }

  const user = auth.user!;
  return (
    <div className="auth-bar logged-in">
      <div className="auth-user-info">
        <span className="auth-avatar">👤</span>
        <span className="auth-name">{user.twitchUser.displayName}</span>
        <span className="auth-wallets">{user.wallets.length} wallet(s)</span>
        <span className="auth-nfts">{user.ownedNftIds.length} NFTs</span>
      </div>
      <button className="btn btn-secondary btn-sm" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}
