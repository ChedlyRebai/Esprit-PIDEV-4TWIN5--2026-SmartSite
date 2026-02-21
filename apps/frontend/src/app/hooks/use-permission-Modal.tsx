import { create } from "zustand";

interface addPermissionModalStore {
  id?: string | number;
  setId: (id: string | number) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useAddPermissionModal = create<addPermissionModalStore>(
  (set) => ({
    id: undefined,
    isOpen: false,
    setId: (id) => set({ id }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  })
);

export default useAddPermissionModal;