import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import { auth, db } from '../../libray/firebase';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import upload from '../../libray/upload'; // Ensure this function is correctly implemented
import './login.css';
import { ThreeDots } from 'react-loader-spinner'; // Import the spinner component

function Login() {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });
    const [loading, setLoading] = useState(false); // State to manage loading spinner

    const handleAvatar = (e) => {
        setAvatar({
            file: e.target.files[0],
            url: URL.createObjectURL(e.target.files[0])
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Login successful');
        } catch (error) {
            console.log(error);
            toast.error('Login failed');
        }
    };

    const checkIfUserExists = async (email) => {
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty; // returns true if user exists
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true); // Start the spinner
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);

        try {
            // Check if user already exists
            const userExists = await checkIfUserExists(email);
            if (userExists) {
                toast.error('User with this email already exists');
                setLoading(false);
                return;
            }

            // Upload image and register user
            const imgUrl = await upload(avatar.file);
            const res = await createUserWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, "users", res.user.uid), {
                username,
                email,
                avatar: imgUrl,
                password, // Consider not storing the password in plain text
                user: res.user.uid,
                blocked: []
            });

            await setDoc(doc(db, "userChats", res.user.uid), {
                chats: []
            });

            toast.success('Registration successful');
        } catch (error) {
            console.log(error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false); // Stop the spinner
        }
    };

    return (
        <div className="login">
            <div className="item">
                <h2>Welcome back</h2>
                <form onSubmit={handleLogin}>
                    <input type="email" placeholder='Email' name='email' required />
                    <input type="password" placeholder='Password' name='password' required />
                    <button>Sign In</button>
                </form>
            </div>

            <div className='separator'></div>

            <div className="item">
                <h2>Create an Account</h2>
                <form onSubmit={handleRegister}>
                    <label htmlFor="file">
                        <img src={avatar.url || "public/avatar.png"} alt="Avatar" />
                        Upload an image
                    </label>
                    <input type="file" id='file' style={{ display: 'none' }} onChange={handleAvatar} required />
                    <input type="text" placeholder='Username' name='username' required />
                    <input type="text" placeholder='Name' name='name' required />
                    <input type="email" placeholder='Email' name='email' required />
                    <input type="password" placeholder='Password' name='password' required />
                    <button>Sign Up</button>
                    {loading && (
                        <div className="spinner">
                            <ThreeDots 
                                height="80" 
                                width="80" 
                                radius="9"
                                color="#4fa94d" 
                                ariaLabel="three-dots-loading"
                                visible={true}
                            />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default Login;
