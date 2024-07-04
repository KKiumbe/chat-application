import React from 'react';
import './Details.css';
import { updateDoc, arrayUnion, arrayRemove, doc } from 'firebase/firestore';
import { useChatStore } from '../../libray/chatsStore';
import { auth, db } from '../../libray/firebase';
import { useUserStore } from '../../libray/userStore';

const Details = () => {
  const { setLoading, setCurrentUser } = useUserStore();
  const { chatId, user, isReceiverBlocked, isCurrentBlocked, changeBlock } = useChatStore();
  const { currentUser } = useUserStore();

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        setCurrentUser(null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Sign out error', error);
      });
  };

  const handleBlock = async () => {
    if (!user || !user.user) {
      console.error('User or user ID is not defined.');
      return;
    }


    const userDocRef = doc(db, 'users', currentUser.user);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.user) : arrayUnion(user.user),
      });

      changeBlock();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  return (
    <div className='details'>
      <h1>Details</h1>
      <div className="user">
        <img src={user.avatar || "public/avatar.png"} alt="" />
        <h2>{user.username}</h2>
        <p>Lorem ipsum dolor sit</p>
      </div>

      <div className="info">
        <div className="option">
          <div className="title">
            <span>Privacy and Help</span>
            <img src="public/arrowUp.png" alt="" />
          </div>
        </div>
        
        <div className="option">
          <div className="title">
            <span>Shared photos</span>
            <img src="public/arrowDown.png" alt="" />
          </div>
        </div>

        <div className="photos">
          {/* Placeholder for shared photos */}
          <div className="photoItem">
            <div className="photoDetails">
              <img src="public/AdobeStock_500408234.jpeg" alt="" />
              <span>photo34-43.png</span>
            </div>
            <div className="icon">
              <img src="public/download.png" alt="" />
            </div>
          </div>
          {/* More photo items */}
        </div>

        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="public/arrowUp.png" alt="" />
          </div>
        </div>

        {/* Block user button */}
        <button onClick={handleBlock}>
          {isCurrentBlocked ? "You are blocked" : isReceiverBlocked ? 'Unblocked' : "Block User"}
        </button>

        {/* Logout button */}
        <button className='logout' onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Details;
