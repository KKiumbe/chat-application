import { useEffect, useRef, useState } from 'react';
import './Chat.css';
import EmojiPicker from 'emoji-picker-react';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../libray/firebase';
import { useChatStore } from '../../libray/chatsStore';
import { useUserStore } from '../../libray/userStore';

const Chat = () => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [chat, setChat] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [mediaStream, setMediaStream] = useState(null);

    const { chatId } = useChatStore();
    const { currentUser } = useUserStore();

    const inputRef = useRef(null);
    const recorderRef = useRef(null); // Ref for the recorder element
    const blinkerRef = useRef(null); // Ref for the blinking indicator

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleSend = async () => {
        if (!text && !image && !isRecording) return;

        try {
            setUploading(true);

            if (image) {
                const storageRef = ref(storage, `images/${chatId}/${Date.now()}_${image.name}`);
                const uploadTask = uploadBytesResumable(storageRef, image);

                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload is ${progress}% done`);
                    },
                    (error) => {
                        console.error('Upload failed', error);
                        setUploading(false);
                    },
                    async () => {
                        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        await sendMessage(imageUrl);
                        setImage(null); // Clear the selected image
                        setImagePreview(null); // Clear the image preview
                        setUploading(false);
                    }
                );
            } else if (isRecording) {
                recorder.stop();
                setIsRecording(false);
            } else {
                await sendMessage();
                setUploading(false);
            }
        } catch (error) {
            console.log(error);
            setUploading(false);
        }
    };

    const sendMessage = async (contentUrl = null) => {
        try {
            await updateDoc(doc(db, 'chats', chatId), {
                messages: arrayUnion({
                    senderId: currentUser.user,
                    text,
                    imageUrl: contentUrl,
                    createdAt: new Date()
                })
            });

            const userChatRef = doc(db, "userChats", currentUser.user);
            const userChatSnapShot = await getDoc(userChatRef);

            if (userChatSnapShot.exists()) {
                const userChatData = userChatSnapShot.data();
                const chats = userChatData.chats || [];

                const chatIndex = chats.findIndex(c => c.cId === chatId);
                if (chatIndex !== -1) {
                    chats[chatIndex].lastMessage = text || 'Image';
                    chats[chatIndex].isSeen = true;
                    chats[chatIndex].updatedAt = Date.now();

                    await updateDoc(userChatRef, {
                        chats: chats,
                    });
                }
            }

            setText(""); // Clear the input area after sending the message
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat?.messages]);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChat(res.data());
        });

        return () => {
            unSub();
        };
    }, [chatId]);

    const handleImageUpload = (e) => {
        if (e.target.files[0]) {
            const selectedImage = e.target.files[0];
            setImage(selectedImage);

            // Preview the selected image
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(selectedImage);
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

    const handleMicClick = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const recorderInstance = new MediaRecorder(stream);
            recorderInstance.ondataavailable = (e) => {
                const chunks = [];
                chunks.push(e.data);
            };

            recorderInstance.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);

                const storageRef = ref(storage, `audio/${Date.now()}_${currentUser.uid}.webm`);
                const uploadTask = uploadBytesResumable(storageRef, blob);

                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload is ${progress}% done`);
                    },
                    (error) => {
                        console.error('Upload failed', error);
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            sendMessage(downloadURL);
                            setAudioURL(null); // Clear the recorded audio URL after sending
                        });
                    }
                );
            };

            setRecorder(recorderInstance);
            setMediaStream(stream);
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const handleBlinker = () => {
        if (blinkerRef.current) {
            blinkerRef.current.style.backgroundColor = 'red';
            setTimeout(() => {
                blinkerRef.current.style.backgroundColor = 'transparent';
            }, 500);
        }
    };

    return (
        <div className='chat'>
            <div className="top">
                <div className="user">
                    <img src="public/avatar.png" alt="" />
                    <div className="texts">
                        <span>kevin</span>
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
                {chat?.messages?.map((message) => (
                    <div className={`message ${message.senderId === currentUser.user ? 'own' : ''}`} key={message?.createdAt}>
                        <div className="text">
                            {message.imageUrl && <img src={message.imageUrl} alt="message content" />}
                            <p>{message.text}</p>
                            <span>{getTimeAgo(message.createdAt)}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bottom">
                <div className="icons">
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="imageUpload" />
                    <label htmlFor="imageUpload">
                        <img src="public/img.png" alt="Upload" />
                    </label>
                    {isRecording ? (
                        <div className="recorder" ref={recorderRef}>
                            <div className="recording-indicator" ref={blinkerRef}></div>
                            <button onClick={handleMicClick} style={{ marginLeft: '10px' }}>Stop Recording</button>
                        </div>
                    ) : (
                        <img src="public/mic.png" alt="" onClick={handleMicClick} />
                    )}
                </div>
                {imagePreview && (
                    <div className="image-preview">
                        <img src={imagePreview} alt="Image Preview" style={{ maxWidth: '50px' }} />
                    </div>
                )}
                <input
                    type="text"
                    placeholder="Type a message"
                    onChange={(e) => setText(e.target.value)}
                    value={text}
                    ref={inputRef}
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
};

export default Chat;
