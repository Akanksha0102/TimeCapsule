import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [unlockTime, setUnlockTime] = useState("");
  const [capsules, setCapsules] = useState([]);
  const [countdown, setCountdown] = useState({});

  // Load users from localStorage on mount
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem("users")) || {};
    if (loggedInUser && storedUsers[loggedInUser]) {
      setCapsules(storedUsers[loggedInUser].capsules || []);
    }
  }, [loggedInUser]);

  // Update countdowns for all capsules
  useEffect(() => {
    if (!capsules.length) return;

    const updateCountdowns = () => {
      const now = Date.now();
      setCountdown((prev) => {
        const newCountdown = {};
        capsules.forEach((cap, index) => {
          const timeLeft = cap.unlockTime - now;
          if (timeLeft <= 0) {
            newCountdown[index] = "Ready to open!";
          } else {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            newCountdown[index] = `Unlocks in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
          }
        });
        return newCountdown;
      });
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [capsules]);

  const handleLogin = () => {
    if (!username || !password) {
      alert("Please enter a username and password!");
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem("users")) || {};
    if (storedUsers[username]) {
      if (storedUsers[username].password === password) {
        setLoggedInUser(username);
        setCapsules(storedUsers[username].capsules || []);
      } else {
        alert("Incorrect password!");
      }
    } else {
      // New user registration
      storedUsers[username] = { password, capsules: [] };
      localStorage.setItem("users", JSON.stringify(storedUsers));
      setLoggedInUser(username);
      setCapsules([]);
    }
    setUsername("");
    setPassword("");
  };

  const handleLockCapsule = () => {
    if (!message || !unlockTime) {
      alert("Please enter a message and unlock date!");
      return;
    }

    const unlockTimestamp = new Date(unlockTime).getTime();
    if (unlockTimestamp <= Date.now()) {
      alert("Unlock date must be in the future!");
      return;
    }

    const reader = new FileReader();
    if (image) {
      reader.onload = (e) => {
        const imageData = e.target.result;
        addCapsule({ message, unlockTime: unlockTimestamp, image: imageData });
      };
      reader.readAsDataURL(image);
    } else {
      addCapsule({ message, unlockTime: unlockTimestamp, image: null });
    }

    setMessage("");
    setImage(null);
    setUnlockTime("");
  };

  const addCapsule = (newCapsule) => {
    const updatedCapsules = [...capsules, newCapsule];
    setCapsules(updatedCapsules);
    updateUserData(updatedCapsules);
  };

  const updateUserData = (updatedCapsules) => {
    const storedUsers = JSON.parse(localStorage.getItem("users")) || {};
    storedUsers[loggedInUser].capsules = updatedCapsules;
    localStorage.setItem("users", JSON.stringify(storedUsers));
  };

  const handleOpenCapsule = (index) => {
    const updatedCapsules = capsules.map((cap, i) =>
      i === index ? { ...cap, opened: true } : cap
    );
    setCapsules(updatedCapsules);
    updateUserData(updatedCapsules);

    setTimeout(() => {
      const newCapsules = updatedCapsules.filter((_, i) => i !== index);
      setCapsules(newCapsules);
      updateUserData(newCapsules);
    }, 120000); // 2 minutes
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCapsules([]);
    setCountdown({});
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Digital Time Capsule</h1>
        {!loggedInUser ? (
          <div className="login-section">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button onClick={handleLogin}>Login / Register</button>
          </div>
        ) : (
          <>
            <div className="user-info">
              <p>Logged in as: {loggedInUser}</p>
              <button onClick={handleLogout}>Logout</button>
            </div>
            <div className="input-section">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..."
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />
              <input
                type="datetime-local"
                value={unlockTime}
                onChange={(e) => setUnlockTime(e.target.value)}
              />
              <button onClick={handleLockCapsule}>Lock Capsule</button>
            </div>
            <div className="capsule-list">
              {capsules.map((cap, index) => (
                <div key={index} className="capsule locked">
                  {!cap.opened ? (
                    <>
                      <h2>Capsule #{index + 1}</h2>
                      <div className="countdown">{countdown[index]}</div>
                      {cap.unlockTime <= Date.now() && (
                        <button onClick={() => handleOpenCapsule(index)}>
                          Open Capsule
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="message-display">{cap.message}</div>
                      {cap.image && (
                        <img
                          className="image-display"
                          src={cap.image}
                          alt="Capsule content"
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;