import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, storage } from '../../libray/firebase'; // Adjust the path to your firebase config

export const handleFileUpload = async (file, chatId, setUploading, sendMessage) => {
    try {
        setUploading(true);

        const storageRef = ref(storage, `files/${chatId}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

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
                const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
                await sendMessage(fileUrl, 'file');
                setUploading(false);
            }
        );
    } catch (error) {
        console.error('Error uploading file:', error);
        setUploading(false);
    }
};

export const uploadImage = async (imageFile, chatId) => {
    try {
        const storageRef = ref(storage, `images/${chatId}/${Date.now()}_${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload is ${progress}% done`);
                },
                (error) => {
                    console.error('Upload failed', error);
                    reject(error);
                },
                async () => {
                    const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(imageUrl);
                }
            );
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};
