import React, { useState } from 'react';
import './AddUser.css';
import { useUserStore } from '../../libray/userStore';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, arrayUnion } from 'firebase/firestore';
import { db } from '../../libray/firebase';

const AddUser = () => {
    const [users, setUsers] = useState([]);
    const { currentUser } = useUserStore();
  
    const handleSearch = async (e) => {
      e.preventDefault();
  
      const formData = new FormData(e.target);
      const username = formData.get('username').toLowerCase();
  
      try {
        const userRef = collection(db, 'users');
        const q = query(userRef, where('username', '==', username));
        const userSnapshot = await getDocs(q);
  
        if (!userSnapshot.empty) {
          const foundUsers = userSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((user) => user.id !== currentUser.user); // Exclude current user
  
          setUsers(foundUsers);
        } else {
          setUsers([]);
        }
  
        console.log("Found Users:", users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
  
    const addChat = async (selectedUser) => {
      if (selectedUser.id === currentUser.user) {
        console.log("Cannot add chat with yourself.");
        return;
      }
  
      const chatRef = collection(db, 'chats');
  
      try {
        const newChatRef = doc(chatRef);
        const timestamp = serverTimestamp();
  
        // Create a new chat document
        await setDoc(newChatRef, {
          createdAt: timestamp,
          messages: []
        });
  
        console.log(newChatRef.id);
  
        const userChatsRef = collection(db, 'userChats');
  
        // Ensure userChat document for the selected user exists
        const selectedUserChatRef = doc(userChatsRef, selectedUser.id);
        const currentUserChatRef = doc(userChatsRef, currentUser.user);
  
        await setDoc(selectedUserChatRef, { chats: [] }, { merge: true });
        await setDoc(currentUserChatRef, { chats: [] }, { merge: true });
  
        // Update userChatRef for the selected user
        await updateDoc(selectedUserChatRef, {
          chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: '',
            receiverId: currentUser.user,
            updatedAt: Date.now()
          })
        });
  
        // Update userChatRef for currentUser
        await updateDoc(currentUserChatRef, {
          chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: '',
            receiverId: selectedUser.id,
            updatedAt: Date.now()
          })
        });
  
        console.log("Chat added successfully.");
      } catch (error) {
        console.error("Error adding chat:", error);
      }
    };

  return (
    <div className='addUser'>
      <form onSubmit={handleSearch}>
        <input type='text' name='username' placeholder='Enter username' />
        <button type='submit'>Search</button>
      </form>

      {users.length > 0 ? (
        users.map((user) => (
          <div className='user' key={user.id}>
            <div className='detail'>
              <img src={user.avatar || 'public/avatar.png'} alt='' />
              <span>{user.username}</span>
            </div>
            <button onClick={() => addChat(user)}>
              Chat
            </button>
          </div>
        ))
      ) : (
        <div>No users found</div>
      )}
    </div>
  );
};

export default AddUser;
