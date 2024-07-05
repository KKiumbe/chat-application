import React, { useEffect, useState, useCallback } from 'react';
import './Details.css';
import { updateDoc, arrayUnion, arrayRemove, doc, onSnapshot } from 'firebase/firestore';
import { useChatStore } from '../../libray/chatsStore'; // Assuming this path is correct
import { auth, db } from '../../libray/firebase'; // Assuming this path is correct
import { useUserStore } from '../../libray/userStore'; // Assuming this path is correct

const Details = () => {
  const { setLoading, setCurrentUser } = useUserStore();
  const { user, isReceiverBlocked, isCurrentBlocked, changeBlock, chatId } = useChatStore();
  const { currentUser } = useUserStore();
  const [chat, setChat] = useState(null);
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "chats", chatId), (snapshot) => {
      setChat(snapshot.data());
    });

    return () => unsubscribe();
  }, [chatId]);

  const fetchSharedPhotos = useCallback(() => {
    if (chat && chat.messages) {
      const photos = chat.messages.filter(msg => msg.type === 'image').map(photo => ({
        url: photo.fileUrl,
        createdAt: photo.createdAt.toDate(),
      }));
      setSharedPhotos(photos);
    }
  }, [chat]);

  const fetchSharedFiles = useCallback(() => {
    if (chat && chat.messages) {
      const files = chat.messages.filter(msg => msg.type === 'file').map(file => ({
        url: file.fileUrl,
        createdAt: file.createdAt.toDate(),
      }));
      setSharedFiles(files);
    }
  }, [chat]);

  useEffect(() => {
    fetchSharedPhotos();
    fetchSharedFiles();
  }, [chat, fetchSharedPhotos, fetchSharedFiles]);

  const loadMoreItems = (items, setItems, type) => {
    try {
      const lastItem = items[items.length - 1];
      const moreItems = chat.messages
        .filter(msg => msg.type === type && msg.createdAt > lastItem.createdAt)
        .slice(0, 10)
        .map(item => ({
          id: item.id,
          url: item.fileUrl,
          name: type === 'image' ? 'Image' : 'File',
          createdAt: item.createdAt.toDate(),
        }));
      setItems(prevItems => [...prevItems, ...moreItems]);
    } catch (error) {
      console.error(`Error loading more ${type === 'image' ? 'photos' : 'files'}:`, error);
    }
  };

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
        <img src={isReceiverBlocked ? "public/avatar.png" : (user?.avatar || "public/avatar.png")} alt="" />
        <h2>{isReceiverBlocked ? "User" : user?.username}</h2>
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
          <div className="photos">
            {sharedPhotos.map(photo => (
              <div className="photoItem" key={photo.id}>
                <div className="photoDetails">
                  <img src={photo.url} alt="Shared Photo" />
                </div>
                <div className="icon">
                  <img src="public/download.png" alt="Download" />
                </div>
              </div>
            ))}
            {sharedPhotos.length > 5 && (
              <button className="loadMoreButton" onClick={() => loadMoreItems(sharedPhotos, setSharedPhotos, 'image')}>View More</button>
            )}
          </div>
        </div>

        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="public/arrowUp.png" alt="" />
          </div>
          <div className="files">
            {sharedFiles.map(file => (
              <div className="fileItem" key={file.id}>
                <div className="fileDetails">

                  <img src="public/file.svg" alt="File Icon" className="fileIcon" />

                  <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                </div>
              </div>
            ))}
          
          </div>
        </div>

        <button onClick={handleBlock} className="blockButton">
          {isCurrentBlocked ? "You are blocked" : isReceiverBlocked ? 'Unblock User' : "Block User"}
        </button>

        <button onClick={handleLogout} className='logoutButton'>Logout</button>
      </div>
    </div>
  );
};

export default Details;
