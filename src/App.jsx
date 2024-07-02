import { ThreeDots } from 'react-loader-spinner';
import Chat from './Components/chat/Chat.jsx';
import Details from './Components/details/Details.jsx';
import List from './Components/list/List.jsx';
import Notification from './Components/notification/Notification.jsx';
import './index.css';
import { useUserStore } from './libray/userStore.jsx';
import { useEffect } from 'react';
import Login from './Components/login/login.jsx';
import { useChatStore } from './libray/chatsStore.js';

const App = () => {
  const { currentUser, fetchUser, loading } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  console.log(currentUser);

  if (loading) {
    return (
      <div className="spinner-container">
        <ThreeDots 
          height="80" 
          width="80" 
          radius="9"
          color="#4fa94d" 
          ariaLabel="three-dots-loading"
          visible={true}
        />
      </div>
    );
  }

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {chatId && <Chat />}
          {chatId && <Details />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
