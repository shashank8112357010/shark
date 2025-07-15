import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

const Register = () => {
  const [searchParams] = useSearchParams();
  // Support both 'invite' and 'invite_code' as URL params for backward compatibility
  const inviteCodeFromUrl = searchParams.get("invite") || searchParams.get("invite_code") || "";
  const [inviteCode, setInviteCode] = useState(inviteCodeFromUrl);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  // Add other states as needed

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit registration logic here
    // Include inviteCode in the request body
  };

  return (
    <div className="mobile-container relative" style={{ maxWidth: 400, margin: "2rem auto", background: "#fff", padding: 24, borderRadius: 12, zIndex: 1 }}>
      <video
          src="/shark.mp4"
          autoPlay
          loop
          muted
          className=" w-full h-full object-cover"
       
        />
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "2rem auto", background: "#fff", padding: 24, borderRadius: 12, position: 'relative', zIndex: 1 }}>
      <h2>Register</h2>
      <label>
        Phone:
        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
      </label>
      <br />
      <label>
        Password:
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>
      <br />
      <label>
        Invite Code (optional):
        <input
          type="text"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          placeholder="Enter invite code"
        />
      </label>
      <br />
      <button type="submit">Register</button>
    </form>
    </div>
  );
};

export default Register;
