import React, { useEffect, useState } from 'react';
import './Chatlist.css';
import { useUserStore } from '../../../libray/userStore';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../libray/firebase';
import AddUser from '../../addUser/addUser';
import { useChatStore } from '../../../libray/chatsStore';

const Chatlist = () => {
    const [addMode, setMode] = useState(false);
    const [chats, setChats] = useState([]);
  
    const { currentUser } = useUserStore();
    const { changeChat } = useChatStore();

    useEffect(() => {
        if (!currentUser?.user) {
            console.log("No current user available.");
            return;
        }

        const docRef = doc(db, 'userChats', currentUser.user);
        const unSub = onSnapshot(docRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                try {
                    const data = docSnapshot.data();
                    const items = data?.chats || [];

                    const promises = items.map(async (item) => {
                        const userDocRef = doc(db, 'users', item.receiverId);
                        const userDocSnap = await getDoc(userDocRef);
                        const user = userDocSnap.data();
                        return { ...item, user };
                    });

                    const chatData = await Promise.all(promises);
                    setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
                } catch (error) {
                    console.error("Error fetching chat data:", error);
                    setChats([]);
                }
            } else {
                console.log("No such document!");
                setChats([]);
            }
        }, (error) => {
            console.error("Error in onSnapshot:", error);
            setChats([]);
        });

        return () => {
            unSub();
        };
    }, [currentUser]);

    const handleSelect = (chat) => {
        changeChat(chat.chatId, chat.user);
    };

    const truncateMessage = (message, maxLength) => {
        if (!message) return '';
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    return (
        <div className='chatList'>
            <div className="search">
                <div className="searchBar">
                    <img src="public/search.png" alt="" />
                    <input type="text" placeholder='Search' />
                </div>
                <img 
                    src={addMode ? "public/minus.png" : "public/plus.png"} 
                    alt="" 
                    className='add' 
                    onClick={() => setMode(prevMode => !prevMode)} 
                />
            </div>

            {chats.length > 0 ? (
                chats.map((chat) => (
                    <div 
                        className={`item ${!chat.isSeen ? 'unseen' : ''}`} 
                        key={chat.chatId} 
                        onClick={() => handleSelect(chat)}
                    >
                        <img src={chat.user?.avatar || "public/avatar.png"} alt="" />
                        <div className="text">
                            <span>{chat.user?.username || 'Unknown User'}</span>
                            <p>{truncateMessage(chat.lastMessage, 50)}</p> {/* Truncate message to a preview */}
                        </div>
                    </div>
                ))
            ) : (
                <div>No chats found</div>
            )}

            {addMode && <AddUser />}
        </div>
    );
}

export default Chatlist;
