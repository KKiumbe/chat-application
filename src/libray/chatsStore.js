import { create } from 'zustand';
import { useUserStore } from './userStore';

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentBlocked: false,
  isReceiverBlocked: false,

  changeChat: async (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    // Check if current user is blocked by the other user
    if (user.blocked.includes(currentUser.user)) {
      set({
        chatId: chatId,
        user: null,
        isCurrentBlocked: true,
        isReceiverBlocked: false,
      });
    } else if (currentUser.blocked.includes(user)) {
      // Check if the other user is blocked by the current user
      set({
        chatId: chatId,
        user: user,
        isCurrentBlocked: false,
        isReceiverBlocked: true,
      });
    } else {
      // Default case when neither user is blocked
      set({
        chatId: chatId,
        user: user,
        isCurrentBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },

  changeBlock: () => {
    set((state) => ({
      ...state,
      isReceiverBlocked: !state.isReceiverBlocked,
    }));
  },
}));
