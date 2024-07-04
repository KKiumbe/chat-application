import React, { useEffect, useRef, useState } from 'react';
import './Chat.css';
import { arrayUnion, doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../libray/firebase';
import { useChatStore } from '../../libray/chatsStore';
import { useUserStore } from '../../libray/userStore';
import { handleFileUpload, uploadImage } from './fileUpload';

const Chat = () => {
    const [text, setText] = useState("");
    const [image, setImage] = useState(null);
    const [chat, setChat] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordingBlob, setRecordingBlob] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

   
    const { currentUser } = useUserStore();
   
    const { chatId, user, isReceiverBlocked, isCurrentBlocked, changeBlock } = useChatStore()



    const inputRef = useRef(null);
    const recorderRef = useRef(null);

    useEffect(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat?.messages]);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "chats", chatId), (snapshot) => {
            setChat(snapshot.data());
            console.log(snapshot.data())
        });
     

        return () => unsubscribe();
   
    }, [chatId]);

  
    const handleImageLoaded = () => {
        setImageLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
    };

    
const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            setUploading(true);
            try {
                const imageUrl = await uploadImage(file, chatId);
                await sendMessage(imageUrl, 'image');
            } catch (error) {
                console.error('Error uploading image:', error);
            } finally {
                setUploading(false);
                setImagePreview(null);
            }
        }
    };


    const handleMicClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    

    const sendMessage = async (contentUrl = null, messageType = 'text') => {
        try {
            const messageData = {
                senderId: currentUser.user,
                createdAt: new Date()
            };

            if (messageType === 'text') {
                messageData.text = text;
            } else {
                messageData.fileUrl = contentUrl;
                messageData.type = messageType;
            }

            const chatRef = doc(db, 'chats', chatId);

            const chatDoc = await getDoc(chatRef);
            if (!chatDoc.exists()) {
                await setDoc(chatRef, {
                    messages: []
                });
            }

            await updateDoc(chatRef, {
                messages: arrayUnion(messageData)
            });

            setText("");
            setShowEmojiPicker(false);
            setRecordingTime(0);

            // Update last seen and last message
            const userIds = [currentUser.user, 'receiverId']; // Replace 'otherUserId' with the actual user ID
            userIds.forEach(async (id) => {
                const userChatsRef = doc(db, 'userChats', id);
                const userChatsSnapshot = await getDoc(userChatsRef);

                if (userChatsSnapshot.exists) {
                    const userChatsData = userChatsSnapshot.data();
                    const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);

                    if (chatIndex !== -1) {
                        userChatsData.chats[chatIndex].lastMessage = messageType === 'text' ? text : contentUrl;
                        userChatsData.chats[chatIndex].isSeen = id === currentUser.user;
                        userChatsData.chats[chatIndex].updatedAt = new Date();

                        await updateDoc(userChatsRef, {
                            chats: userChatsData.chats
                        });
                    }
                }
            });

        } catch (error) {
            console.error('Error updating chat:', error);
        }
    };
    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now - messageTime) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds} seconds ago`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minutes ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hours ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} days ago`;
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
    
            recorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };
    
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setRecordingBlob(blob);
                const audioUrl = URL.createObjectURL(blob);
                setAudioPreviewUrl(audioUrl);
            };
    
            recorderRef.current = recorder;
            setIsRecording(true);
            setStartTime(Date.now());
            recorder.start();
    
            const timerInterval = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1); // Increment recording time by 1 second
            }, 1000);
    
            return () => {
                clearInterval(timerInterval);
            };
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };
    

    
    const stopRecording = async () => {
        try {
            if (recorderRef.current && recorderRef.current.state === 'recording') {
                recorderRef.current.stop();
                setIsRecording(false);
                clearInterval(timerInterval); // Clear the interval timer
    
                const blob = recorderRef.current.stream.getTracks()[0];
                const audioUrl = URL.createObjectURL(blob);
                setAudioPreviewUrl(audioUrl);
                
                const messageUrl = await uploadAudio(audioUrl, chatId); // Replace with your upload function
                await sendMessage(messageUrl, 'audio'); // Assuming sendMessage handles audio messages
    
                // Clean up or reset state as needed
                setAudioPreviewUrl(null);
                setRecordingBlob(null);
            }
        } catch (error) {
            console.error('Error stopping recorder:', error);
        }
    };
    

    const handleDeleteAudioPreview = () => {
        setAudioPreviewUrl(null);
        setRecordingBlob(null);
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    const handleEmojiSelect = (emoji) => {
        setText(text + emoji.native);
    };

    return (
        <div className='chat'>
             <div className="top">
                <div className="user">
                    <img src={user.avatar || "public/avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user.username}.</span>
                        <p>Lorem ipsum, dolor sit</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="public/phone.png" alt="" />
                    <img src="public/video.png" alt="" />
                    <img src="public/info.png" alt="" />
                </div>
            </div>
            <div className="center">
                {chat?.messages.map((message, index) => (
                    <div key={index} className={`message ${message.senderId === currentUser.user ? 'own' : ''}`}>
                        <div className="text">

                          { message.text && <p>{message.text}</p>}
                            <span>{getTimeAgo(message.createdAt?.toDate())}</span>

                          
                            {message.type === 'image' && (
                            <div style={{ position: 'relative', maxHeight: '100px' }}>
                                {imageLoading && !imageError && <div></div>}
                                {imageError && <img src="placeholder.png" alt="Image not available" style={{ maxHeight: '100px' }} />}
                                <img 
                                    src={message.fileUrl} 
                                    alt="message content"  
                                    style={{ display: imageError ? 'none' : 'block', maxHeight: '100px' }} 
                                    onLoad={handleImageLoaded}
                                    onError={handleImageError}
                                />
                            </div>
                        )}
                           

                            {message.type === 'file' && (
                                <div className="file-preview">
                                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" download>
                                        <img src="file.svg" alt="File Icon" style={{ maxWidth: '50px', maxHeight: '50px' }} />
                                    </a>
                                    <span>{getTimeAgo(message.createdAt?.toDate())}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bottom">
                <div className="icons">
                    {uploading ? (
                        <div className="loading-spinner">uploading...</div>
                    ) : (
                        <>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="imageUpload" />
                            <label htmlFor="imageUpload">
                                <img src="public/img.png" alt="Upload Image" />
                            </label>

                            <input type="file" accept="*/*" onChange={(e) => handleFileUpload(e.target.files[0], chatId, setUploading, sendMessage)} style={{ display: 'none' }} id="fileUpload" />
                            <label htmlFor="fileUpload">
                                <img src="public/plus.png" alt="Upload File" />
                            </label>
                        </>
                    )}
                    {isRecording ? (
                        <div className="recorder">
                            <div className="recording-indicator">
                                
                            </div>
                            <button onClick={stopRecording}></button>
                            <span>{recordingTime}s</span>
                        </div>
                    ) : (
                        <img src="public/mic.png" alt="Record Audio" onClick={handleMicClick} />
                    )}
                </div>
                {imagePreview && (
                    <div className="image-preview">
                        <img src={imagePreview} alt="Image Preview" />
                    </div>
                )}
                {audioPreviewUrl && (
                    <div className="audio-preview">
                        <audio controls>
                            <source src={audioPreviewUrl} type="audio/webm" />
                            Your browser does not support the audio element.
                        </audio>
                        <button onClick={handleDeleteAudioPreview}>Delete</button>
                    </div>
                )}
                <input
                    type="text"
                    placeholder={(isReceiverBlocked || isCurrentBlocked) ? "You are Blocked" : "Type a message..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    ref={inputRef}
                    disabled={isReceiverBlocked || isCurrentBlocked}
                  
                    
                />
                <button className="sendButton" onClick={sendMessage} disabled={isReceiverBlocked || isCurrentBlocked}>Send</button>
            </div>
        </div>
    );
};

export default Chat;
