import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";

const upload = async (file) => {
  const storage = getStorage();

  const date = new Date()

  const storageRef = ref(storage, `images/${date + file.name}`);
  

  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
       
      }, 
      (error) => {
        reject(`Something went wrong: ${error}`);
        // Handle unsuccessful uploads
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('File available at', downloadURL);
          resolve(downloadURL);
        });
      }
    );
  });
}

export default upload;
