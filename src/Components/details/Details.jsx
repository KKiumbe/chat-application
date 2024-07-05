import React, { useEffect, useState } from 'react';
import './Details.css';
import { updateDoc, arrayUnion, arrayRemove, doc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { useChatStore } from '../../libray/chatsStore'; // Assuming this path is correct
import { auth, db } from '../../libray/firebase'; // Assuming this path is correct
import { useUserStore } from '../../libray/userStore'; // Assuming this path is correct

const Details = () => {
  const { setLoading, setCurrentUser } = useUserStore();
  const { user, isReceiverBlocked, isCurrentBlocked, changeBlock, chat } = useChatStore(); // Adjusted based on the assumption of useChatStore usage
  const { currentUser } = useUserStore();

  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);

  useEffect(() => {
    if (!chat) return; // Ensure chat is loaded before fetching photos and files
    fetchSharedPhotos();
    fetchSharedFiles();
    const unsubscribe = subscribeToSharedFiles();
    return unsubscribe;
  }, [chat]);

  const fetchSharedPhotos = async () => {
    try {
      const photos = chat.messages.filter(msg => msg.type === 'image').map(photo => ({
       
        url: photo.fileUrl, // Adjust field name as per your Firestore document
       
        createdAt: photo.createdAt.toDate(), // Assuming createdAt is a Firestore timestamp field
      }));

      setSharedPhotos(photos);
      console.log('Shared photos:', photos); // Log fetched photos
    } catch (error) {
      console.error("Error fetching shared photos:", error);
      setSharedPhotos([]); // Set to empty array on error
    }
  };

  const fetchSharedFiles = async () => {
    try {
      const files = chat.messages.filter(msg => msg.type === 'file').map(file => ({
       
        url: file.fileUrl, // Adjust field name as per your Firestore document
   
        createdAt: file.createdAt.toDate(), // Assuming createdAt is a Firestore timestamp field
      }));

      setSharedFiles(files);
      console.log('Shared files:', files); // Log fetched files
    } catch (error) {
      console.error("Error fetching shared files:", error);
      setSharedFiles([]); // Set to empty array on error
    }
  };

  const loadMorePhotos = async () => {
    try {
      const lastPhoto = sharedPhotos[sharedPhotos.length - 1];
      // Example: Load more photos based on timestamp order
      const morePhotos = chat.messages
        .filter(msg => msg.type === 'image' && msg.createdAt > lastPhoto.createdAt)
        .slice(0, 10)
        .map(photo => ({
          id: photo.id,
          url: photo.fileUrl, // Adjust field name as per your Firestore document
          name: 'Image', // Example name for images
          createdAt: photo.createdAt.toDate(), // Assuming createdAt is a Firestore timestamp field
        }));

      setSharedPhotos(prevPhotos => [...prevPhotos, ...morePhotos]);
    } catch (error) {
      console.error("Error loading more photos:", error);
      // Handle error if necessary
    }
  };

  const loadMoreFiles = async () => {
    try {
      const lastFile = sharedFiles[sharedFiles.length - 1];
      // Example: Load more files based on timestamp order
      const moreFiles = chat.messages
        .filter(msg => msg.type === 'file' && msg.createdAt > lastFile.createdAt)
        .slice(0, 10)
        .map(file => ({
          id: file.id,
          url: file.fileUrl, // Adjust field name as per your Firestore document
          name: 'File', // Example name for files
          createdAt: file.createdAt.toDate(), // Assuming createdAt is a Firestore timestamp field
        }));

      setSharedFiles(prevFiles => [...prevFiles, ...moreFiles]);
    } catch (error) {
      console.error("Error loading more files:", error);
      // Handle error if necessary
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

  const subscribeToSharedFiles = () => {
    if (!chat) return () => {}; // Return empty function if chat is not loaded
    const unsubscribe = onSnapshot(collection(db, 'chats', chat.id, 'messages'), (snapshot) => {
      const files = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.type === 'file') { // Assuming 'type' field distinguishes between images and files
          return {
            id: doc.id,
            url: data.fileUrl, // Adjust field name as per your Firestore document
            name: 'File', // Example name for files
            createdAt: data.createdAt.toDate(), // Assuming createdAt is a Firestore timestamp field
          };
        }
        return null;
      }).filter(file => file !== null);

      setSharedFiles(files);
    });

    return unsubscribe; // Return the unsubscribe function to use when component unmounts or changes
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
            {sharedPhotos.slice(0, 5).map(photo => (
              <div className="photoItem" key={photo.id}>
                <div className="photoDetails">
                  <img src={photo.url} alt={photo.name} />
                  <span>{photo.name}</span>
                </div>
                <div className="icon">
                  <img src="public/download.png" alt="Download" />
                </div>
              </div>
            ))}
            {sharedPhotos.length > 5 && (
              <button className="loadMoreButton" onClick={loadMorePhotos}>View More</button>
            )}
          </div>
        </div>

        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="public/arrowUp.png" alt="" />
          </div>
          <div className="files">
            {sharedFiles.slice(0, 5).map(file => (
              <div className="fileItem" key={file.id}>
                <div className="fileDetails">
                  <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                </div>
                <div className="icon">
                  <img src="public/download.png" alt="Download" />
                </div>
              </div>
            ))}
            {sharedFiles.length > 5 && (
              <button className="loadMoreButton" onClick={loadMoreFiles}>View More</button>
            )}
          </div>
        </div>

        {/* Block user button */}
        <button onClick={handleBlock} className="blockButton">
          {isCurrentBlocked ? "You are blocked" : isReceiverBlocked ? 'Unblock User' : "Block User"}
        </button>

        {/* Logout button */}
        <button onClick={handleLogout} className='logoutButton'>Logout</button>
      </div>
    </div>
  );
}

export default Details;
